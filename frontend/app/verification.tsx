import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/context/AuthContext';
import { verificationApi } from '../src/hooks/useApi';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

export default function VerificationScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emiratesId, setEmiratesId] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await verificationApi.getStatus();
      setVerification(response.data.verification);
    } catch (error) {
      console.error('Error fetching verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'emirates' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'emirates' ? [16, 9] : [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (type === 'emirates') {
        setEmiratesId(base64Image);
      } else {
        setSelfie(base64Image);
      }
    }
  };

  const handleSubmit = async () => {
    if (!emiratesId || !selfie) {
      Alert.alert('Missing Documents', 'Please upload both Emirates ID and selfie');
      return;
    }

    setSubmitting(true);
    try {
      await verificationApi.submit({
        emirates_id_image: emiratesId,
        selfie_image: selfie,
      });
      await fetchVerificationStatus();
      Alert.alert('Submitted', 'Your verification request has been submitted for review');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isVerified = user?.is_verified || verification?.status === 'approved';
  const isPending = verification?.status === 'pending';
  const isRejected = verification?.status === 'rejected';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        {isVerified ? (
          <Card style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.statusTitle}>Verified</Text>
            <Text style={styles.statusText}>
              Your identity has been verified. You can now create listings.
            </Text>
            <Button
              title="Create Listing"
              onPress={() => router.push('/create-listing')}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        ) : isPending ? (
          <Card style={styles.statusCard}>
            <View style={[styles.statusIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="time" size={48} color={colors.warning} />
            </View>
            <Text style={styles.statusTitle}>Pending Review</Text>
            <Text style={styles.statusText}>
              Your verification request is being reviewed. This usually takes 24-48 hours.
            </Text>
          </Card>
        ) : (
          <>
            {isRejected && (
              <Card style={[styles.statusCard, { borderColor: colors.error + '50' }]}>
                <Ionicons name="close-circle" size={48} color={colors.error} />
                <Text style={[styles.statusTitle, { color: colors.error }]}>Rejected</Text>
                <Text style={styles.statusText}>
                  {verification?.admin_notes || 'Please resubmit with clearer documents.'}
                </Text>
              </Card>
            )}

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Verification Requirements</Text>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.instructionText}>Valid Emirates ID (front side)</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.instructionText}>Clear selfie holding your ID</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.instructionText}>Good lighting, no blur</Text>
              </View>
            </View>

            {/* Upload Emirates ID */}
            <Text style={styles.uploadLabel}>Emirates ID (Front)</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => pickImage('emirates')}
            >
              {emiratesId ? (
                <Image source={{ uri: emiratesId }} style={styles.uploadedImage} />
              ) : (
                <>
                  <Ionicons name="card" size={48} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Tap to upload</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Upload Selfie */}
            <Text style={styles.uploadLabel}>Selfie with ID</Text>
            <TouchableOpacity
              style={[styles.uploadBox, styles.selfieBox]}
              onPress={() => pickImage('selfie')}
            >
              {selfie ? (
                <Image source={{ uri: selfie }} style={styles.uploadedSelfie} />
              ) : (
                <>
                  <Ionicons name="person" size={48} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Tap to upload</Text>
                </>
              )}
            </TouchableOpacity>

            <Button
              title="Submit for Verification"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!emiratesId || !selfie}
              style={styles.submitButton}
            />

            <Text style={styles.disclaimer}>
              Your documents are securely stored and only used for verification purposes.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  instructions: {
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  uploadLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  selfieBox: {
    height: 200,
  },
  uploadText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedSelfie: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
