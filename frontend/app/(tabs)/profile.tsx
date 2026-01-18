import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { colors, spacing, typography, borderRadius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, profile, subscription, hasSubscription, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-outline" size={64} color={colors.textMuted} />
          <Text style={styles.authTitle}>Your Profile</Text>
          <Text style={styles.authSubtitle}>
            Sign in to manage your profile and preferences
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/landing')}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { icon: 'person', label: 'Edit Profile', route: '/profile/edit' },
    { icon: 'card', label: 'Subscription', route: '/subscription' },
    ...(user?.role === 'lister' ? [
      { icon: 'home', label: 'My Listings', route: '/my-listings' },
      { icon: 'shield-checkmark', label: 'Verification', route: '/verification' },
    ] : []),
    { icon: 'settings', label: 'Settings', route: '/settings' },
    { icon: 'help-circle', label: 'Help & Support', route: '/help' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.roleBadge]}>
              <Ionicons
                name={user?.role === 'lister' ? 'home' : 'search'}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.badgeText}>
                {user?.role === 'lister' ? 'Lister' : 'Seeker'}
              </Text>
            </View>
            {user?.is_verified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.badgeText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Card */}
        <View style={styles.section}>
          <Card style={styles.subscriptionCard}>
            {hasSubscription ? (
              <>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="star" size={24} color={colors.gold} />
                  <Text style={styles.subscriptionTitle}>Premium Member</Text>
                </View>
                <Text style={styles.subscriptionInfo}>
                  Your {subscription?.plan_id.replace('_', ' ')} plan is active
                </Text>
                <Text style={styles.subscriptionExpiry}>
                  Expires: {new Date(subscription?.end_date || '').toLocaleDateString()}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="lock-closed" size={24} color={colors.textMuted} />
                  <Text style={styles.subscriptionTitle}>Free Plan</Text>
                </View>
                <Text style={styles.subscriptionInfo}>
                  Upgrade to unlock chat and more features
                </Text>
                <Button
                  title="View Plans"
                  onPress={() => router.push('/subscription')}
                  size="sm"
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}
          </Card>
        </View>

        {/* Profile Completion */}
        {profile && !profile.profile_complete && (
          <View style={styles.section}>
            <Card style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Ionicons name="alert-circle" size={24} color={colors.warning} />
                <Text style={styles.completionTitle}>Complete Your Profile</Text>
              </View>
              <Text style={styles.completionText}>
                Complete your profile to improve match accuracy
              </Text>
              <Button
                title="Complete Now"
                onPress={() => router.push('/onboarding')}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </View>
        )}

        {/* Switch Role */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.switchRoleButton}
            onPress={() => router.push('/switch-role')}
          >
            <View style={styles.switchRoleContent}>
              <Ionicons
                name={user?.role === 'lister' ? 'search' : 'home'}
                size={24}
                color={colors.primary}
              />
              <View style={styles.switchRoleText}>
                <Text style={styles.switchRoleTitle}>
                  {user?.role === 'lister' ? 'Switch to Seeker' : 'Become a Lister'}
                </Text>
                <Text style={styles.switchRoleSubtitle}>
                  {user?.role === 'lister'
                    ? 'Browse bedspaces instead'
                    : 'List your available space'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="ghost"
            loading={loggingOut}
            icon={<Ionicons name="log-out" size={20} color={colors.error} />}
            textStyle={{ color: colors.error }}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Platform is for discovery only.{"\n"}No rent collection or brokerage.
          </Text>
        </View>

        <View style={{ height: 100 }} />
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
  },
  verifiedBadge: {
    backgroundColor: colors.success + '20',
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subscriptionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  subscriptionInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  subscriptionExpiry: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.xs,
  },
  completionCard: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '30',
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completionTitle: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
  },
  completionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  switchRoleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchRoleText: {
    flex: 1,
  },
  switchRoleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  switchRoleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuItem: {
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
  },
  disclaimer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
  },
  authSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
