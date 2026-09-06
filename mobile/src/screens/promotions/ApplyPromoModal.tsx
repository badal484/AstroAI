import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PromotionDTO,
  PromotionTarget,
  PromotionValidationResultDTO,
} from '@astroai/shared-types';
import { promotionApi } from '../../lib/promotionApi';

interface ApplyPromoModalProps {
  visible: boolean;
  orderAmount: number; // in paise
  targetType?: PromotionTarget;
  targetId?: string;
  onClose: () => void;
  onApply: (validation: PromotionValidationResultDTO) => void;
}

export function ApplyPromoModal({
  visible,
  orderAmount,
  targetType = PromotionTarget.ALL,
  targetId,
  onClose,
  onApply,
}: ApplyPromoModalProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<PromotionDTO[]>([]);
  const [validationResult, setValidationResult] = useState<PromotionValidationResultDTO | null>(null);

  useEffect(() => {
    if (visible) {
      promotionApi
        .getAvailableOffers()
        .then(setAvailableOffers)
        .catch(() => {});
      setValidationResult(null);
      setPromoCode('');
    }
  }, [visible]);

  const handleValidate = async (codeToTest?: string) => {
    const code = (codeToTest || promoCode).trim().toUpperCase();
    if (!code) return;

    setValidating(true);
    try {
      const res = await promotionApi.validatePromoCode({
        code,
        amount: orderAmount,
        targetType,
        targetId,
      });
      setValidationResult(res);
      if (res.valid) {
        setPromoCode(code);
      }
    } catch {
      setValidationResult({
        valid: false,
        code,
        discountAmount: 0,
        bonusCredits: 0,
        originalAmount: orderAmount,
        finalAmount: orderAmount,
        message: 'Could not validate promo code',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmApply = () => {
    if (validationResult && validationResult.valid) {
      onApply(validationResult);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply Promo Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          {/* Input Box */}
          <View style={styles.inputRow}>
            <TextInput
              testID="promo-input"
              value={promoCode}
              onChangeText={(t) => {
                setPromoCode(t.toUpperCase());
                setValidationResult(null);
              }}
              placeholder="ENTER PROMO CODE"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              style={styles.input}
            />
            <TouchableOpacity
              testID="validate-promo-btn"
              onPress={() => handleValidate()}
              disabled={validating || !promoCode.trim()}
              style={[styles.applyButton, (!promoCode.trim() || validating) && styles.applyButtonDisabled]}
            >
              {validating ? (
                <ActivityIndicator size="small" color="#030712" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Validation Result Banner */}
          {validationResult && (
            <View
              style={[
                styles.resultBanner,
                validationResult.valid ? styles.resultBannerSuccess : styles.resultBannerError,
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  validationResult.valid ? styles.resultTextSuccess : styles.resultTextError,
                ]}
              >
                {validationResult.message}
              </Text>
              {validationResult.valid && (
                <TouchableOpacity onPress={handleConfirmApply} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Use This Offer →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Available Offers Carousel / List */}
          <Text style={styles.availableSectionTitle}>Available Offers</Text>
          <ScrollView style={styles.offersList} showsVerticalScrollIndicator={false}>
            {availableOffers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                onPress={() => handleValidate(offer.code)}
                style={styles.offerCard}
              >
                <View style={styles.offerHeader}>
                  <Text style={styles.offerCode}>{offer.code}</Text>
                  <Text style={styles.offerBadge}>
                    {offer.discountType === 'percentage'
                      ? `${offer.discountValue}% OFF`
                      : offer.discountType === 'credit_bonus'
                        ? `+${offer.discountValue} BONUS`
                        : `₹${(offer.discountValue / 100).toFixed(0)} OFF`}
                  </Text>
                </View>
                <Text style={styles.offerName}>{offer.name}</Text>
                <Text style={styles.offerDesc}>{offer.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  applyButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.4,
  },
  applyButtonText: {
    color: '#030712',
    fontWeight: '700',
    fontSize: 14,
  },
  resultBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultBannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultBannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultTextSuccess: {
    color: '#10b981',
  },
  resultTextError: {
    color: '#ef4444',
  },
  confirmButton: {
    marginTop: 8,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  availableSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  offersList: {
    maxHeight: 260,
  },
  offerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f59e0b',
    fontFamily: 'monospace',
  },
  offerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  offerDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
