import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BirthProfile } from '@astroai/shared-types';
import {
  deleteBirthProfile,
  listBirthProfiles,
} from '../../lib/birthProfileApi';
import { formatTime12Hour } from '../../lib/time';
import type { AppStackParamList } from '../../navigation/AppStack';

type Nav = NativeStackNavigationProp<AppStackParamList, 'BirthProfileList'>;

const TIME_CONFIDENCE_LABEL: Record<BirthProfile['timeConfidence'], string> = {
  exact: 'exact time',
  approximate: 'approximate time',
  unknown: 'time unknown',
};

export function BirthProfileListScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ['birthProfiles'],
    queryFn: listBirthProfiles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBirthProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['birthProfiles'] });
    },
  });

  function confirmDelete(profile: BirthProfile) {
    Alert.alert(
      'Delete birth profile',
      `Remove "${profile.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(profile.id),
        },
      ],
    );
  }

  if (profilesQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (profilesQuery.isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Couldn't load birth profiles.</Text>
        <TouchableOpacity
          onPress={() => {
            void profilesQuery.refetch();
          }}
          accessibilityRole="button"
        >
          <Text style={styles.retryLink}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = profilesQuery.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={items.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No birth profiles yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your birth details to get personalized readings.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('BirthProfileForm', { profileId: item.id })
            }
            onLongPress={() => confirmDelete(item)}
            accessibilityRole="button"
          >
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                {item.dateOfBirth}
                {item.birthTime
                  ? ` · ${formatTime12Hour(item.birthTime)}`
                  : ''}{' '}
                · {TIME_CONFIDENCE_LABEL[item.timeConfidence]}
              </Text>
              <Text style={styles.rowMeta}>{item.location.canonicalName}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('BirthProfileForm', {})}
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>+ Add birth profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: '#c0392b' },
  retryLink: { color: '#1a73e8' },
  emptyContainer: { flexGrow: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6b6b75', textAlign: 'center' },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f2',
  },
  rowText: { gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, color: '#6b6b75' },
  addButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
