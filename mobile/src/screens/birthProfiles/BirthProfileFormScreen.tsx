import { zodResolver } from '@hookform/resolvers/zod';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  TimeConfidence,
  type CreateBirthProfileInput,
} from '@astroai/shared-types';
import { z } from 'zod';
import {
  createBirthProfile,
  getBirthProfile,
  updateBirthProfile,
} from '../../lib/birthProfileApi';
import { ApiError } from '../../lib/apiError';
import {
  applyTime24ToDate,
  dateToISODate,
  dateToTime24,
  formatTime12Hour,
  midnightOrNoonNote,
  parseISODateToLocalDate,
} from '../../lib/time';
import type { AppStackParamList } from '../../navigation/AppStack';
import { LocationPicker } from './LocationPicker';
import type { LocationSelection } from './types';

const MIN_BIRTH_YEAR = 1900;

const formSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name').max(100, 'Name is too long'),
    dateOfBirth: z.date(),
    timeConfidence: z.nativeEnum(TimeConfidence),
    birthTime: z.date().nullable(),
  })
  .superRefine((value, ctx) => {
    // `Date.now()` evaluated here, at parse time, on purpose — a bound
    // baked into the schema at module-load time (`z.date().max(new
    // Date())`) would freeze "now" to whenever the app started, which can
    // wrongly reject a same-day date picked hours into a long-running
    // session.
    if (value.dateOfBirth.getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: 'Date of birth cannot be in the future',
      });
    }
    if (
      value.timeConfidence !== TimeConfidence.UNKNOWN &&
      value.birthTime === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthTime'],
        message: 'Add a birth time, or choose "I don\'t know" above',
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const CONFIDENCE_OPTIONS: {
  value: TimeConfidence;
  label: string;
  explanation: string;
}[] = [
  {
    value: TimeConfidence.EXACT,
    label: 'Exact',
    explanation:
      "We'll use this exact time for precise predictions, like your ascendant.",
  },
  {
    value: TimeConfidence.APPROXIMATE,
    label: 'Approximate',
    explanation:
      "We'll do our best with this — time-sensitive details like your ascendant may be less precise.",
  },
  {
    value: TimeConfidence.UNKNOWN,
    label: "Don't know",
    explanation:
      "That's okay. We'll skip time-based details like your ascendant until you can add a time.",
  },
];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Couldn't save this. Check your connection and try again.";
}

type Nav = NativeStackNavigationProp<AppStackParamList, 'BirthProfileForm'>;
type FormRoute = RouteProp<AppStackParamList, 'BirthProfileForm'>;

export function BirthProfileFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<FormRoute>();
  const profileId = route.params?.profileId;
  const isEditing = Boolean(profileId);
  const queryClient = useQueryClient();

  const existingProfileQuery = useQuery({
    queryKey: ['birthProfile', profileId],
    queryFn: () => getBirthProfile(profileId as string),
    enabled: isEditing,
  });

  const [location, setLocation] = useState<LocationSelection | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      dateOfBirth: new Date(),
      timeConfidence: TimeConfidence.EXACT,
      birthTime: null,
    },
  });

  const timeConfidence = watch('timeConfidence');
  const dateOfBirth = watch('dateOfBirth');
  const birthTime = watch('birthTime');

  useEffect(() => {
    const profile = existingProfileQuery.data;
    if (!profile) return;

    reset({
      name: profile.name,
      dateOfBirth: parseISODateToLocalDate(profile.dateOfBirth),
      timeConfidence: profile.timeConfidence,
      birthTime: profile.birthTime
        ? applyTime24ToDate(new Date(), profile.birthTime)
        : null,
    });

    setLocation(
      profile.location.placeId
        ? {
            mode: 'placeId',
            placeId: profile.location.placeId,
            preview: profile.location,
          }
        : {
            mode: 'manual',
            manual: {
              canonicalName: profile.location.canonicalName,
              latitude: profile.location.latitude,
              longitude: profile.location.longitude,
              country: profile.location.country,
              countryCode: profile.location.countryCode,
            },
          },
    );
  }, [existingProfileQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!location) throw new Error('missing-location');

      const payload: CreateBirthProfileInput = {
        name: values.name.trim(),
        dateOfBirth: dateToISODate(values.dateOfBirth),
        timeConfidence: values.timeConfidence,
        ...(values.timeConfidence !== TimeConfidence.UNKNOWN && values.birthTime
          ? { birthTime: dateToTime24(values.birthTime) }
          : {}),
        location:
          location.mode === 'placeId'
            ? { placeId: location.placeId }
            : { manual: location.manual },
      };

      return isEditing && profileId
        ? updateBirthProfile(profileId, payload)
        : createBirthProfile(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['birthProfiles'] });
      navigation.goBack();
    },
    onError: (error: unknown) => {
      setSubmitError(errorMessage(error));
    },
  });

  function onSubmit(values: FormValues) {
    setSubmitError(null);
    if (!location) {
      setSubmitError('Add a birth location before saving.');
      return;
    }
    saveMutation.mutate(values);
  }

  if (isEditing && existingProfileQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const timeNote = birthTime
    ? midnightOrNoonNote(dateToTime24(birthTime))
    : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name</Text>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput
            style={styles.input}
            placeholder="e.g. Priya Sharma"
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="words"
          />
        )}
      />
      {errors.name && (
        <Text style={styles.errorText}>{errors.name.message}</Text>
      )}

      <Text style={styles.label}>Date of birth</Text>
      <TouchableOpacity
        style={styles.pickerField}
        onPress={() => setShowDatePicker(true)}
        accessibilityRole="button"
      >
        <Text style={styles.pickerFieldText}>{dateToISODate(dateOfBirth)}</Text>
      </TouchableOpacity>
      {errors.dateOfBirth && (
        <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
      )}
      {showDatePicker && (
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <DateTimePicker
              value={field.value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date(MIN_BIRTH_YEAR, 0, 1)}
              onChange={(event: DateTimePickerEvent, selected?: Date) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (event.type === 'set' && selected) field.onChange(selected);
              }}
            />
          )}
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShowDatePicker(false)}
          accessibilityRole="button"
        >
          <Text style={styles.doneLink}>Done</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>How sure are you about the birth time?</Text>
      <Controller
        control={control}
        name="timeConfidence"
        render={({ field }) => (
          <View style={styles.confidenceRow}>
            {CONFIDENCE_OPTIONS.map(option => {
              const selected = field.value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.confidenceChip,
                    selected && styles.confidenceChipSelected,
                  ]}
                  onPress={() => field.onChange(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.confidenceChipText,
                      selected && styles.confidenceChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
      <Text style={styles.hintText}>
        {
          CONFIDENCE_OPTIONS.find(option => option.value === timeConfidence)
            ?.explanation
        }
      </Text>

      {timeConfidence !== TimeConfidence.UNKNOWN && (
        <>
          <Text style={styles.label}>Birth time</Text>
          <TouchableOpacity
            style={styles.pickerField}
            onPress={() => setShowTimePicker(true)}
            accessibilityRole="button"
          >
            <Text style={styles.pickerFieldText}>
              {birthTime
                ? formatTime12Hour(dateToTime24(birthTime))
                : 'Select a time'}
            </Text>
          </TouchableOpacity>
          {errors.birthTime && (
            <Text style={styles.errorText}>{errors.birthTime.message}</Text>
          )}
          {timeNote && <Text style={styles.hintText}>{timeNote}</Text>}
          {showTimePicker && (
            <Controller
              control={control}
              name="birthTime"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value ?? new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: DateTimePickerEvent, selected?: Date) => {
                    if (Platform.OS === 'android') setShowTimePicker(false);
                    if (event.type === 'set' && selected)
                      field.onChange(selected);
                  }}
                />
              )}
            />
          )}
          {showTimePicker && Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => setShowTimePicker(false)}
              accessibilityRole="button"
            >
              <Text style={styles.doneLink}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.label}>Birth location</Text>
      <LocationPicker value={location} onChange={setLocation} />

      {submitError && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {submitError}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          saveMutation.isPending && styles.submitButtonDisabled,
        ]}
        onPress={() => {
          void handleSubmit(onSubmit)();
        }}
        disabled={saveMutation.isPending}
        accessibilityRole="button"
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Save changes' : 'Add birth profile'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 48 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#3a3a42',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  pickerField: {
    borderWidth: 1,
    borderColor: '#d0d0d5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerFieldText: { fontSize: 15 },
  errorText: { color: '#c0392b', fontSize: 12, marginTop: 4 },
  hintText: { color: '#6b6b75', fontSize: 12, marginTop: 4 },
  doneLink: {
    color: '#1a73e8',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  confidenceRow: { flexDirection: 'row', gap: 8 },
  confidenceChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0d5',
    alignItems: 'center',
  },
  confidenceChipSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  confidenceChipText: { fontSize: 13, color: '#3a3a42' },
  confidenceChipTextSelected: { color: '#fff', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
