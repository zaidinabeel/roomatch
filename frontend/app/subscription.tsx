import React, { useState, useEffect } from 'react';
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
import { subscriptionApi } from '../src/hooks/useApi';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

interface Plan {
  plan_id: string;
  name: string;
  price: number;
  duration_days: number;
  plan_type: string;
  features: string[];
}

export default function SubscriptionScreen() {
  const { user, hasSubscription, subscription, refreshUser } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.getPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select a subscription plan');
      return;
    }

    setSubscribing(true);
    try {
      await subscriptionApi.subscribe(selectedPlan);
      await refreshUser();
      Alert.alert('Success', 'Subscription activated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const seekerPlans = plans.filter(p => p.plan_type === 'seeker');
  const listerPlans = plans.filter(p => p.plan_type === 'lister');

  const displayPlans = user?.role === 'lister' ? listerPlans : seekerPlans;

  const getPlanColor = (planId: string) => {
    if (planId.includes('yearly')) return colors.gold;
    if (planId.includes('quarterly')) return colors.primary;
    return colors.textSecondary;
  };

  const getBestValue = (planId: string) => {
    return planId.includes('yearly');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Current Status */}
        {hasSubscription && subscription && (
          <Card style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <Ionicons name="star" size={24} color={colors.gold} />
              <Text style={styles.currentPlanTitle}>Current Plan</Text>
            </View>
            <Text style={styles.currentPlanName}>
              {subscription.plan_id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={styles.currentPlanExpiry}>
              Expires: {new Date(subscription.end_date).toLocaleDateString()}
            </Text>
          </Card>
        )}

        {/* Header Text */}
        <View style={styles.heroSection}>
          <Ionicons name="rocket" size={48} color={colors.primary} />
          <Text style={styles.heroTitle}>
            {hasSubscription ? 'Upgrade Your Plan' : 'Unlock Premium Features'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {user?.role === 'lister'
              ? 'List your bedspace and connect with verified seekers'
              : 'Unlock chat and connect with verified listers'}
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {displayPlans.map((plan) => (
            <TouchableOpacity
              key={plan.plan_id}
              style={[
                styles.planCard,
                selectedPlan === plan.plan_id && styles.planCardSelected,
                getBestValue(plan.plan_id) && styles.planCardBest,
              ]}
              onPress={() => setSelectedPlan(plan.plan_id)}
            >
              {getBestValue(plan.plan_id) && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <Text style={[styles.planName, { color: getPlanColor(plan.plan_id) }]}>
                {plan.name}
              </Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planCurrency}>AED</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>
                  /{plan.duration_days === 30 ? 'mo' : plan.duration_days === 90 ? '3mo' : 'yr'}
                </Text>
              </View>
              {plan.plan_id.includes('yearly') && (
                <Text style={styles.savingsText}>Save 43%</Text>
              )}
              {plan.plan_id.includes('quarterly') && (
                <Text style={styles.savingsText}>Save 15%</Text>
              )}
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <View style={[
                styles.radioOuter,
                selectedPlan === plan.plan_id && styles.radioOuterSelected,
              ]}>
                {selectedPlan === plan.plan_id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Note */}
        <View style={styles.paymentNote}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.paymentNoteText}>
            Secure payment • Cancel anytime
          </Text>
        </View>

        {/* Subscribe Button */}
        <Button
          title={hasSubscription ? 'Upgrade Plan' : 'Subscribe Now'}
          onPress={handleSubscribe}
          loading={subscribing}
          disabled={!selectedPlan}
          size="lg"
          style={styles.subscribeButton}
        />

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          By subscribing, you agree to our Terms of Service.{"\n"}
          This is a demo - no actual payment will be processed.
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
  currentPlanCard: {
    backgroundColor: colors.gold + '10',
    borderColor: colors.gold + '30',
    marginBottom: spacing.lg,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentPlanTitle: {
    ...typography.bodySmall,
    color: colors.gold,
  },
  currentPlanName: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
  currentPlanExpiry: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  plansContainer: {
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  planCardBest: {
    borderColor: colors.gold,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bestValueText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '700',
  },
  planName: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planCurrency: {
    ...typography.body,
    color: colors.text,
    marginRight: spacing.xs,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  planPeriod: {
    ...typography.body,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  savingsText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  planFeatures: {
    marginTop: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
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
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  paymentNoteText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  subscribeButton: {
    marginTop: spacing.lg,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
