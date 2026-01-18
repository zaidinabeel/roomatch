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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

const ROLES = [
  {
    id: 'seeker',
    title: 'Bedspace Seeker',
    icon: 'search',
    description: 'Looking for a place to stay',
    features: ['Browse listings', 'Save favorites', 'Chat with listers', 'Get matched'],
  },
  {
    id: 'lister',
    title: 'Bedspace Lister',
    icon: 'home',
    description: 'Have a space to rent out',
    features: ['Create listings', 'Receive inquiries', 'Chat with seekers', 'Verified badge'],
    note: 'Requires identity verification',
  },
];

export default function SwitchRoleScreen() {
  const { user, updateRole, refreshUser } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'seeker');
  const [loading, setLoading] = useState(false);

  const handleSwitch = async () => {
    if (selectedRole === user?.role) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      await updateRole(selectedRole);
      await refreshUser();
      
      if (selectedRole === 'lister') {
        Alert.alert(
          'Role Changed',
          'You are now a Lister. Complete identity verification to start listing.',
          [{ text: 'OK', onPress: () => router.replace('/verification') }]
        );
      } else {
        Alert.alert('Role Changed', 'You are now a Seeker.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change role');
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
        <Text style={styles.headerTitle}>Switch Role</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Choose how you want to use RoomMatch
        </Text>

        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.roleCardSelected,
              user?.role === role.id && styles.roleCardCurrent,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            {user?.role === role.id && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
            <View style={[
              styles.roleIcon,
              selectedRole === role.id && styles.roleIconSelected,
            ]}>
              <Ionicons
                name={role.icon as any}
                size={32}
                color={selectedRole === role.id ? colors.white : colors.primary}
              />
            </View>
            <Text style={styles.roleTitle}>{role.title}</Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
            
            <View style={styles.featuresList}>
              {role.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {role.note && (
              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={styles.noteText}>{role.note}</Text>
              </View>
            )}

            <View style={[
              styles.radioOuter,
              selectedRole === role.id && styles.radioOuterSelected,
            ]}>
              {selectedRole === role.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <Button
          title={selectedRole === user?.role ? 'Keep Current Role' : 'Switch Role'}
          onPress={handleSwitch}
          loading={loading}
          style={styles.switchButton}
        />
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
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  roleCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleCardCurrent: {
    borderColor: colors.success + '50',
  },
  currentBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  roleIconSelected: {
    backgroundColor: colors.primary,
  },
  roleTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  noteText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  radioOuter: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
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
  switchButton: {
    marginTop: spacing.lg,
  },
});
