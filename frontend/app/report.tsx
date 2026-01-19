import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reportsApi } from '../src/hooks/useApi';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'fraud', label: 'Suspected fraud' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'fake', label: 'Fake listing/profile' },
  { id: 'other', label: 'Other' },
];

export default function ReportScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Select Reason', 'Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      await reportsApi.create({
        reported_type: type || 'listing',
        reported_id: id || '',
        reason,
        description: description || undefined,
      });
      Alert.alert('Report Submitted', 'Thank you for reporting. We will review this shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report {type === 'user' ? 'User' : 'Listing'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Your report helps keep RoomMatch safe. All reports are reviewed by our team.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for reporting *</Text>
        {REPORT_REASONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.reasonOption,
              reason === item.id && styles.reasonOptionSelected,
            ]}
            onPress={() => setReason(item.id)}
          >
            <Text style={[
              styles.reasonText,
              reason === item.id && styles.reasonTextSelected,
            ]}>{item.label}</Text>
            <View style={[
              styles.radioOuter,
              reason === item.id && styles.radioOuterSelected,
            ]}>
              {reason === item.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <Input
          label="Additional details (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Provide more information about your report..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
          containerStyle={{ marginTop: spacing.lg }}
        />

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          disabled={!reason}
          style={styles.submitButton}
        />

        <Text style={styles.disclaimer}>
          False reports may result in account suspension. Please only report genuine concerns.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonText: {
    ...typography.body,
    color: colors.text,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
