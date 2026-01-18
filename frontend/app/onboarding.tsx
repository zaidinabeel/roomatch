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
import { Input } from '../src/components/Input';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

const STEPS = [
  { id: 'role', title: 'Choose Your Role', subtitle: 'What brings you to RoomMatch?' },
  { id: 'basic', title: 'Basic Info', subtitle: 'Tell us about yourself' },
  { id: 'lifestyle', title: 'Lifestyle', subtitle: 'Help us find your perfect match' },
  { id: 'preferences', title: 'Preferences', subtitle: 'What are you looking for?' },
];

const ROLES = [
  { id: 'seeker', title: 'Looking for a Bedspace', icon: 'search', description: 'Browse and connect with verified listers' },
  { id: 'lister', title: 'List My Bedspace', icon: 'home', description: 'Rent out your available space' },
];

const PROFESSIONS = [
  'IT Professional', 'Healthcare Worker', 'Teacher', 'Engineer',
  'Sales & Marketing', 'Hospitality', 'Construction', 'Driver',
  'Retail', 'Finance', 'Student', 'Other'
];

const INCOME_RANGES = [
  { id: '2500-4000', label: 'AED 2,500 - 4,000' },
  { id: '4000-6000', label: 'AED 4,000 - 6,000' },
  { id: '6000-8000', label: 'AED 6,000 - 8,000' },
  { id: '8000+', label: 'AED 8,000+' },
];

const GENDERS = ['Male', 'Female'];

const AREAS = ['Deira', 'Bur Dubai', 'Karama', 'Al Nahda', 'International City'];

const LIFESTYLE_OPTIONS = {
  working_hours: ['Day shift', 'Night shift', 'Flexible', 'Remote'],
  food_habits: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Any'],
  smoking: ['Non-smoker', 'Smoker', 'Outdoor only'],
  visitors: ['No visitors', 'Occasional', 'Frequent'],
  cleanliness: ['Very clean', 'Moderately clean', 'Flexible'],
  noise_level: ['Quiet', 'Moderate', 'Social'],
};

export default function OnboardingScreen() {
  const { updateProfile, updateRole, refreshUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: '',
    profession: '',
    income_range: '',
    gender: '',
    nationality: '',
    age: '',
    preferred_areas: [] as string[],
    lifestyle_tags: {} as Record<string, string>,
    bio: '',
  });

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update role
      await updateRole(formData.role);

      // Update profile
      await updateProfile({
        profession: formData.profession,
        income_range: formData.income_range,
        gender: formData.gender.toLowerCase(),
        nationality: formData.nationality,
        age: formData.age ? parseInt(formData.age) : undefined,
        preferred_areas: formData.preferred_areas,
        lifestyle_tags: formData.lifestyle_tags,
        bio: formData.bio,
      });

      await refreshUser();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'role':
        return (
          <View style={styles.stepContent}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  formData.role === role.id && styles.roleCardSelected,
                ]}
                onPress={() => setFormData({ ...formData, role: role.id })}
              >
                <View style={[
                  styles.roleIcon,
                  formData.role === role.id && styles.roleIconSelected,
                ]}>
                  <Ionicons
                    name={role.icon as any}
                    size={32}
                    color={formData.role === role.id ? colors.white : colors.primary}
                  />
                </View>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'basic':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Profession</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {PROFESSIONS.map((prof) => (
                <TouchableOpacity
                  key={prof}
                  style={[
                    styles.chip,
                    formData.profession === prof && styles.chipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, profession: prof })}
                >
                  <Text style={[
                    styles.chipText,
                    formData.profession === prof && styles.chipTextSelected,
                  ]}>{prof}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Income Range</Text>
            <View style={styles.optionsGrid}>
              {INCOME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.optionButton,
                    formData.income_range === range.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, income_range: range.id })}
                >
                  <Text style={[
                    styles.optionText,
                    formData.income_range === range.id && styles.optionTextSelected,
                  ]}>{range.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.genderButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Ionicons
                    name={gender === 'Male' ? 'male' : 'female'}
                    size={24}
                    color={formData.gender === gender ? colors.white : colors.primary}
                  />
                  <Text style={[
                    styles.genderText,
                    formData.gender === gender && styles.genderTextSelected,
                  ]}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Nationality"
              value={formData.nationality}
              onChangeText={(text) => setFormData({ ...formData, nationality: text })}
              placeholder="e.g., Indian, Pakistani, Filipino"
            />

            <Input
              label="Age"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text.replace(/[^0-9]/g, '') })}
              placeholder="Your age"
              keyboardType="numeric"
            />
          </View>
        );

      case 'lifestyle':
        return (
          <View style={styles.stepContent}>
            {Object.entries(LIFESTYLE_OPTIONS).map(([key, options]) => (
              <View key={key} style={styles.lifestyleSection}>
                <Text style={styles.fieldLabel}>
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.chip,
                        formData.lifestyle_tags[key] === option && styles.chipSelected,
                      ]}
                      onPress={() => setFormData({
                        ...formData,
                        lifestyle_tags: { ...formData.lifestyle_tags, [key]: option },
                      })}
                    >
                      <Text style={[
                        styles.chipText,
                        formData.lifestyle_tags[key] === option && styles.chipTextSelected,
                      ]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        );

      case 'preferences':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Preferred Areas</Text>
            <View style={styles.optionsGrid}>
              {AREAS.map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.areaButton,
                    formData.preferred_areas.includes(area) && styles.areaButtonSelected,
                  ]}
                  onPress={() => setFormData({
                    ...formData,
                    preferred_areas: toggleSelection(formData.preferred_areas, area),
                  })}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={formData.preferred_areas.includes(area) ? colors.white : colors.primary}
                  />
                  <Text style={[
                    styles.areaText,
                    formData.preferred_areas.includes(area) && styles.areaTextSelected,
                  ]}>{area}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Bio (Optional)"
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Tell potential roommates about yourself..."
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'role':
        return !!formData.role;
      case 'basic':
        return !!formData.profession && !!formData.income_range && !!formData.gender;
      case 'lifestyle':
        return Object.keys(formData.lifestyle_tags).length >= 2;
      case 'preferences':
        return formData.preferred_areas.length > 0;
      default:
        return true;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{STEPS[currentStep].subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.navButton}
          />
        )}
        <Button
          title={currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          onPress={handleNext}
          disabled={!canProceed()}
          loading={loading}
          style={[styles.navButton, currentStep === 0 && styles.navButtonFull]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    paddingBottom: spacing.xl,
  },
  roleCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
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
    textAlign: 'center',
  },
  fieldLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipScroll: {
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.white,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  genderButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    ...typography.body,
    color: colors.text,
  },
  genderTextSelected: {
    color: colors.white,
  },
  lifestyleSection: {
    marginBottom: spacing.sm,
  },
  areaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  areaButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  areaText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  areaTextSelected: {
    color: colors.white,
  },
  navigation: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  navButtonFull: {
    flex: 1,
  },
});
