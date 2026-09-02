import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { LocationCandidate } from '@astroai/shared-types';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ApiError } from '../../lib/apiError';
import { resolveLocation, searchLocations } from '../../lib/locationApi';
import type { LocationSelection } from './types';

interface Props {
  value: LocationSelection | null;
  onChange: (value: LocationSelection | null) => void;
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}
function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [candidates, setCandidates] = useState<LocationCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvingPlaceId, setResolvingPlaceId] = useState<string | null>(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Manual entry fields — kept as raw text so a user can type "12" before
  // "12.5" without the field fighting them; validated on every change.
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [manualCountryCode, setManualCountryCode] = useState('');

  // Pre-fills the manual fields when the parent hands us an existing
  // manually-entered location (editing a profile) — only once, so it
  // doesn't fight the user's own in-progress edits afterward.
  useEffect(() => {
    if (value?.mode === 'manual' && manualName === '') {
      setManualMode(true);
      setManualName(value.manual.canonicalName);
      setManualLat(String(value.manual.latitude));
      setManualLng(String(value.manual.longitude));
      setManualCountry(value.manual.country);
      setManualCountryCode(value.manual.countryCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (value?.mode === 'placeId' || debouncedQuery.trim().length < 2) {
      setCandidates([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    searchLocations(debouncedQuery)
      .then(result => {
        if (cancelled) return;
        setCandidates(result.candidates);
        setSearchUnavailable(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (
          error instanceof ApiError &&
          error.code === 'LOCATION_PROVIDER_UNAVAILABLE'
        ) {
          setSearchUnavailable(true);
          setManualMode(true);
        } else {
          setSearchError(
            "Couldn't search locations. Check your connection and try again.",
          );
        }
        setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, value]);

  async function pickCandidate(candidate: LocationCandidate) {
    setResolvingPlaceId(candidate.placeId);
    setSearchError(null);
    try {
      const preview = await resolveLocation(candidate.placeId);
      onChange({ mode: 'placeId', placeId: candidate.placeId, preview });
      setCandidates([]);
      setQuery('');
    } catch {
      setSearchError("Couldn't load details for that place. Please try again.");
    } finally {
      setResolvingPlaceId(null);
    }
  }

  function updateManual(next: {
    name?: string;
    lat?: string;
    lng?: string;
    country?: string;
    countryCode?: string;
  }) {
    const name = next.name ?? manualName;
    const lat = next.lat ?? manualLat;
    const lng = next.lng ?? manualLng;
    const country = next.country ?? manualCountry;
    const countryCode = next.countryCode ?? manualCountryCode;

    setManualName(name);
    setManualLat(lat);
    setManualLng(lng);
    setManualCountry(country);
    setManualCountryCode(countryCode);

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const isComplete =
      name.trim().length > 0 &&
      country.trim().length > 0 &&
      countryCode.trim().length === 2 &&
      isValidLatitude(latNum) &&
      isValidLongitude(lngNum);

    onChange(
      isComplete
        ? {
            mode: 'manual',
            manual: {
              canonicalName: name.trim(),
              latitude: latNum,
              longitude: lngNum,
              country: country.trim(),
              countryCode: countryCode.trim().toUpperCase(),
            },
          }
        : null,
    );
  }

  if (value?.mode === 'placeId') {
    return (
      <View style={styles.selectedCard}>
        <Text style={styles.selectedName}>{value.preview.canonicalName}</Text>
        <Text style={styles.selectedMeta}>
          {value.preview.country} · {value.preview.timezone}
        </Text>
        <TouchableOpacity
          onPress={() => {
            onChange(null);
            setQuery('');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.changeLink}>Change location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {!manualMode && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Search for a city or town"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            accessibilityLabel="Birth location search"
          />
          {isSearching && <ActivityIndicator style={styles.spacingTop} />}
          {searchError && <Text style={styles.errorText}>{searchError}</Text>}
          {searchUnavailable && (
            <Text style={styles.hintText}>
              Location search isn't available right now — enter it manually
              below.
            </Text>
          )}
          {candidates.length > 1 && (
            <Text style={styles.hintText}>
              Multiple places matched — choose the right one:
            </Text>
          )}
          {candidates.map(candidate => (
            <TouchableOpacity
              key={candidate.placeId}
              style={styles.candidateRow}
              onPress={() => {
                void pickCandidate(candidate);
              }}
              disabled={resolvingPlaceId !== null}
              accessibilityRole="button"
            >
              <Text style={styles.candidateText}>{candidate.displayName}</Text>
              {resolvingPlaceId === candidate.placeId && (
                <ActivityIndicator size="small" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setManualMode(true)}
            accessibilityRole="button"
          >
            <Text style={styles.changeLink}>
              Can't find it? Enter it manually
            </Text>
          </TouchableOpacity>
        </>
      )}

      {manualMode && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Place name (city, region, country)"
            value={manualName}
            onChangeText={name => updateManual({ name })}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Latitude"
              keyboardType="numbers-and-punctuation"
              value={manualLat}
              onChangeText={lat => updateManual({ lat })}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Longitude"
              keyboardType="numbers-and-punctuation"
              value={manualLng}
              onChangeText={lng => updateManual({ lng })}
            />
          </View>
          {manualLat.length > 0 && !isValidLatitude(Number(manualLat)) && (
            <Text style={styles.errorText}>
              Latitude must be between -90 and 90
            </Text>
          )}
          {manualLng.length > 0 && !isValidLongitude(Number(manualLng)) && (
            <Text style={styles.errorText}>
              Longitude must be between -180 and 180
            </Text>
          )}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Country"
              value={manualCountry}
              onChangeText={country => updateManual({ country })}
            />
            <TextInput
              style={[styles.input, styles.rowInputSmall]}
              placeholder="ISO code (e.g. IN)"
              autoCapitalize="characters"
              maxLength={2}
              value={manualCountryCode}
              onChangeText={countryCode => updateManual({ countryCode })}
            />
          </View>
          {!searchUnavailable && (
            <TouchableOpacity
              onPress={() => setManualMode(false)}
              accessibilityRole="button"
            >
              <Text style={styles.changeLink}>Search for it instead</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1 },
  rowInputSmall: { flex: 1 },
  spacingTop: { marginTop: 4 },
  errorText: { color: '#c0392b', fontSize: 12, marginBottom: 8 },
  hintText: { color: '#6b6b75', fontSize: 12, marginBottom: 8 },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    marginBottom: 6,
  },
  candidateText: { fontSize: 14, flexShrink: 1 },
  changeLink: { color: '#1a73e8', fontSize: 13, marginTop: 4, marginBottom: 8 },
  selectedCard: {
    borderWidth: 1,
    borderColor: '#d0d0d5',
    borderRadius: 8,
    padding: 12,
  },
  selectedName: { fontSize: 15, fontWeight: '600' },
  selectedMeta: {
    fontSize: 13,
    color: '#6b6b75',
    marginTop: 2,
    marginBottom: 8,
  },
});
