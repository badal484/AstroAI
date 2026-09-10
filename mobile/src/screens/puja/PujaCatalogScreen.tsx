import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PujaCategory,
  PujaTier,
  type BookPujaInput,
  type PujaItemDTO,
} from '@astroai/shared-types';
import { bookPuja, fetchPujaCatalog } from '../../lib/pujaApi';
import { CreditBalanceBadge } from '../../components/ui/CreditBalanceBadge';
import { AstroIcon, type AstroIconName } from '../../components/ui/AstroIcon';
import { colors, radius, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/AppStack';

interface CategoryItem {
  id: string;
  label: string;
  iconName: AstroIconName;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'ALL', label: 'All Sacred Pujas', iconName: 'flame' },
  { id: PujaCategory.HEALTH_MAHAMRITYUNJAYA, label: 'Maha Mrityunjaya', iconName: 'trishul' },
  { id: PujaCategory.GRAHA_SHANTI, label: 'Navagraha Shanti', iconName: 'sun' },
  { id: PujaCategory.DOSHA_NIVARAN, label: 'Kaal Sarp Nivaran', iconName: 'node' },
  { id: PujaCategory.WEALTH_LAKSHMI, label: 'Maha Lakshmi Wealth', iconName: 'lotus' },
  { id: PujaCategory.CAREER_VICTORY, label: 'Baglamukhi Victory', iconName: 'sword' },
  { id: PujaCategory.RELATIONSHIPS, label: 'Mangal Bhat Puja', iconName: 'puja' },
];

export function PujaCatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [pujas, setPujas] = useState<PujaItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [selectedPuja, setSelectedPuja] = useState<PujaItemDTO | null>(null);
  const [selectedTier, setSelectedTier] = useState<PujaTier>(PujaTier.STANDARD);
  const [sankalpaName, setSankalpaName] = useState<string>('Aditya Sharma');
  const [gotra, setGotra] = useState<string>('Kashyapa');
  const [nakshatra, setNakshatra] = useState<string>('Purva Phalguni');
  const [prayerIntent, setPrayerIntent] = useState<string>(
    'Health, protection against malefic planetary transits, and family prosperity',
  );
  const [wantPrasad, setWantPrasad] = useState<boolean>(true);
  const [address, setAddress] = useState<string>('B-402, Lotus Grandeur, Linking Road');
  const [city, setCity] = useState<string>('Mumbai');
  const [pincode, setPincode] = useState<string>('400050');
  const [phone, setPhone] = useState<string>('9876543210');
  const [isBooking, setIsBooking] = useState<boolean>(false);

  useEffect(() => {
    loadCatalog(selectedCategory);
  }, [selectedCategory]);

  const loadCatalog = async (cat: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchPujaCatalog(cat);
      setPujas(items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load sacred temple pujas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBooking = (puja: PujaItemDTO) => {
    setSelectedPuja(puja);
    setSelectedTier(puja.tiers[0]?.tier || PujaTier.STANDARD);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPuja) return;
    if (!sankalpaName.trim()) {
      Alert.alert('Required Field', 'Please enter devotee full name for Vedic Sankalpa');
      return;
    }

    setIsBooking(true);
    try {
      const payload: BookPujaInput = {
        pujaId: selectedPuja.id,
        tier: selectedTier,
        sankalpaName: sankalpaName.trim(),
        gotra: gotra.trim() || 'Kashyapa',
        nakshatra: nakshatra.trim() || 'Purva Phalguni',
        prayerIntent: prayerIntent.trim(),
        isPrasadDeliveryRequested: wantPrasad,
        deliveryAddress: wantPrasad
          ? {
              fullAddress: address.trim(),
              city: city.trim(),
              state: 'Maharashtra',
              pincode: pincode.trim(),
              contactPhone: phone.trim(),
            }
          : undefined,
      };

      const order = await bookPuja(payload);
      setSelectedPuja(null);
      Alert.alert(
        'Vedic Puja Confirmed',
        `Your sacred ${order.pujaTitle} has been registered at ${order.templeName}.\n\nScheduled on: ${order.scheduledDate}\nLive Stream & Prasad tracking are active.`,
        [
          {
            text: 'View My Orders',
            onPress: () => (navigation as any).navigate('PujaOrderHistory'),
          },
          { text: 'OK' },
        ],
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err?.message || 'Failed to complete Vedic puja booking');
    } finally {
      setIsBooking(false);
    }
  };

  const activeTierOption = selectedPuja?.tiers.find((t) => t.tier === selectedTier) || selectedPuja?.tiers[0];

  return (
    <View style={styles.container}>
      {/* Top Bar with Balance & My Orders Link */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Devasthanam Sanctuary</Text>
          <Text style={styles.screenSubtitle}>Sacred Temple Pujas & Live Prasad</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.myOrdersBtn}
            onPress={() => (navigation as any).navigate('PujaOrderHistory')}
            activeOpacity={0.8}
          >
            <AstroIcon name="orders" size={13} color={colors.primary} />
            <Text style={styles.myOrdersBtnText}>My Orders</Text>
          </TouchableOpacity>
          <CreditBalanceBadge />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <AstroIcon
                  name={cat.iconName}
                  size={14}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    isActive && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching sacred temple rituals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadCatalog(selectedCategory)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.pujaList}>
          {pujas.map((item) => (
            <View key={item.id} style={styles.pujaCard}>
              <View style={styles.cardHeader}>
                <View style={styles.deityBadge}>
                  <AstroIcon name="flame" size={11} color={colors.primary} />
                  <Text style={styles.deityText}>{item.deity}</Text>
                </View>
                <View style={styles.streamBadge}>
                  <AstroIcon name="live" size={10} color={colors.error} />
                  <Text style={styles.streamBadgeText}>Live Video</Text>
                </View>
              </View>

              <Text style={styles.pujaTitle}>{item.title}</Text>
              <Text style={styles.sanskritTitle}>{item.sanskritTitle}</Text>

              <View style={styles.locationRow}>
                <AstroIcon name="location" size={12} color={colors.textMuted} />
                <Text style={styles.locationText}>
                  {item.templeName} • {item.templeLocation}
                </Text>
              </View>

              <Text style={styles.description}>{item.description}</Text>

              {/* Vedic Benefits */}
              <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>Sacred Benefits:</Text>
                {item.benefits.map((b, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <AstroIcon name="sparkle" size={9} color={colors.primary} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.tithiRow}>
                <Text style={styles.tithiLabel}>Auspicious Muhurat:</Text>
                <Text style={styles.tithiValue}>{item.auspiciousUpcomingTithi}</Text>
              </View>

              {/* Price & Book Button */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.priceValue}>
                    ₹{item.tiers[0]?.priceINR} • {item.tiers[0]?.creditsRequired} Credits
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => handleOpenBooking(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookBtnText}>Book Puja</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Booking Modal */}
      <Modal
        visible={!!selectedPuja}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPuja(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Devotee & Puja Details</Text>
                <Text style={styles.modalSubtitle}>{selectedPuja?.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPuja(null)}
                style={styles.closeBtn}
              >
                <AstroIcon name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Tier Selector */}
              <Text style={styles.inputLabel}>Select Puja Tier / Seva</Text>
              <View style={styles.tierSelector}>
                {selectedPuja?.tiers.map((t) => {
                  const isSelected = selectedTier === t.tier;
                  return (
                    <TouchableOpacity
                      key={t.tier}
                      style={[styles.tierOption, isSelected && styles.tierOptionActive]}
                      onPress={() => setSelectedTier(t.tier)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tierTitle, isSelected && styles.tierTitleActive]}>
                        {t.title}
                      </Text>
                      <Text style={styles.tierSub}>
                        ₹{t.priceINR} ({t.creditsRequired} Credits) • {t.panditCount} Pandits • {t.durationMinutes}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Seeker Details */}
              <Text style={styles.inputLabel}>Devotee Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={sankalpaName}
                onChangeText={setSankalpaName}
                placeholder="Enter full name for Pandit chant"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: spacing.xs }}>
                  <Text style={styles.inputLabel}>Gotra</Text>
                  <TextInput
                    style={styles.textInput}
                    value={gotra}
                    onChangeText={setGotra}
                    placeholder="e.g. Kashyapa"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.xs }}>
                  <Text style={styles.inputLabel}>Janma Nakshatra</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nakshatra}
                    onChangeText={setNakshatra}
                    placeholder="e.g. Rohini"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Specific Prayer Intent / Mano Kamna *</Text>
              <TextInput
                style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
                value={prayerIntent}
                onChangeText={setPrayerIntent}
                multiline
                placeholder="Specific prayers for health, career, or family peace"
                placeholderTextColor={colors.textMuted}
              />

              {/* Prasad Option */}
              <TouchableOpacity
                style={styles.prasadCheckbox}
                onPress={() => setWantPrasad(!wantPrasad)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBoxCustom, wantPrasad && styles.checkboxBoxCustomActive]}>
                  {wantPrasad && <AstroIcon name="check" size={12} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxLabel}>Receive Consecrated Prasad at Home</Text>
                  <Text style={styles.checkboxSub}>
                    Sanctified Bhasma, Rudraksha, dry sweets, & energized Yantra
                  </Text>
                </View>
              </TouchableOpacity>

              {wantPrasad && (
                <View style={styles.addressBox}>
                  <Text style={styles.inputLabel}>Delivery Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Flat / Street / Area"
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.formRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginRight: spacing.xs }]}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginLeft: spacing.xs }]}
                      value={pincode}
                      onChangeText={setPincode}
                      placeholder="Pincode"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Contact Phone"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {/* Samagri Included */}
              <View style={styles.samagriBox}>
                <Text style={styles.samagriTitle}>Samagri Included in Seva:</Text>
                <Text style={styles.samagriList}>
                  {activeTierOption?.samagriInclusions?.join(' • ') || 'Pure Ghee, Gangajal, Havan Samagri, Sacred Flowers, & Prasad'}
                </Text>
              </View>
            </ScrollView>

            {/* Footer Summary & Confirm */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, isBooking && styles.confirmBtnDisabled]}
                onPress={handleConfirmBooking}
                disabled={isBooking}
                activeOpacity={0.85}
              >
                {isBooking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    Confirm & Book Puja • ₹{activeTierOption?.priceINR} ({activeTierOption?.creditsRequired} Credits)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  myOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  myOrdersBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  categoryContainer: {
    backgroundColor: colors.backgroundElevated,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pujaList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pujaCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  deityText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  streamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  streamBadgeText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    fontSize: 11,
  },
  pujaTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
  },
  sanskritTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  benefitsSection: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  benefitsTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 1,
  },
  benefitText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  tithiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  tithiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 4,
  },
  tithiValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  priceValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  bookBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalBody: {
    marginVertical: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    ...typography.body,
    color: colors.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tierSelector: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tierOption: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  tierOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tierTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tierTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tierSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prasadCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  checkboxBoxCustom: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
  },
  checkboxBoxCustomActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  checkboxSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addressBox: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing.xs,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  samagriBox: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.md,
  },
  samagriTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  samagriList: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
