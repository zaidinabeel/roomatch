import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const { login, isLoading } = useAuth();

  const features = [
    { icon: 'search', title: 'Find Bedspaces', description: 'Browse verified listings in top Dubai areas' },
    { icon: 'heart', title: 'Smart Matching', description: 'Get matched with compatible roommates' },
    { icon: 'shield-checkmark', title: 'Verified Listers', description: 'All listers are Emirates ID verified' },
    { icon: 'chatbubbles', title: 'Direct Chat', description: 'Message listers and schedule viewings' },
  ];

  const areas = ['Deira', 'Bur Dubai', 'Karama', 'Al Nahda', 'International City'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={40} color={colors.primary} />
            <Text style={styles.logoText}>RoomMatch</Text>
          </View>
          
          <Text style={styles.heroTitle}>Find Your Perfect{"\n"}Bedspace in Dubai</Text>
          <Text style={styles.heroSubtitle}>
            Connect with verified roommates and discover affordable shared living spaces across Dubai
          </Text>

          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1637747019989-fec01a8d70fa?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose RoomMatch?</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Areas Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Areas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areasScroll}>
            {areas.map((area, index) => (
              <View key={index} style={styles.areaChip}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.areaText}>{area}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pricing Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affordable Plans</Text>
          <View style={styles.pricingRow}>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>Seekers</Text>
              <Text style={styles.pricingPrice}>AED 29</Text>
              <Text style={styles.pricingPeriod}>/month</Text>
            </View>
            <View style={[styles.pricingCard, styles.pricingCardHighlight]}>
              <Text style={styles.pricingLabel}>Listers</Text>
              <Text style={styles.pricingPrice}>AED 99</Text>
              <Text style={styles.pricingPeriod}>/listing</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>Ready to find your perfect roommate?</Text>
          <Button
            title="Get Started with Google"
            onPress={login}
            loading={isLoading}
            size="lg"
            icon={<Ionicons name="logo-google" size={20} color={colors.white} style={{ marginRight: 8 }} />}
            style={styles.ctaButton}
          />
          <Text style={styles.disclaimer}>
            By signing up, you agree to our Terms of Service and Privacy Policy.{"\n"}
            Platform is for discovery only - no rent collection or brokerage.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    ...typography.h2,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heroImage: {
    width: width - spacing.lg * 2,
    height: 200,
    borderRadius: borderRadius.xl,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  areasScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pricingCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingCardHighlight: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  pricingLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pricingPrice: {
    ...typography.h2,
    color: colors.primary,
  },
  pricingPeriod: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ctaSection: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  ctaText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
