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

const LIFESTYLE_OPTIONS = {
  working_hours: ['Day shift', 'Night shift', 'Flexible', 'Remote'],
  food_habits: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Any'],
  smoking: ['Non-smoker', 'Smoker', 'Outdoor only'],
  cleanliness: ['Very clean', 'Moderately clean', 'Flexible'],
};

export default function EditProfileScreen() {
  const { profile, updateProfile, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    profession: profile?.profession || '',
    income_range: profile?.income_range || '',
    nationality: profile?.nationality || '',
    age: profile?.age?.toString() || '',
    bio: profile?.bio || '',
    lifestyle_tags: profile?.lifestyle_tags || {},
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        profession: form.profession,
        income_range: form.income_range,
        nationality: form.nationality,
        age: form.age ? parseInt(form.age) : undefined,
        bio: form.bio,
        lifestyle_tags: form.lifestyle_tags,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profession */}
        <Text style={styles.sectionTitle}>Profession</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {PROFESSIONS.map((prof) => (
            <TouchableOpacity
              key={prof}
              style={[
                styles.chip,
                form.profession === prof && styles.chipSelected,
              ]}
              onPress={() => setForm({ ...form, profession: prof })}
            >
              <Text style={[
                styles.chipText,
                form.profession === prof && styles.chipTextSelected,
              ]}>{prof}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Income */}
        <Text style={styles.sectionTitle}>Income Range</Text>
        <View style={styles.optionsGrid}>
          {INCOME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.optionButton,
                form.income_range === range.id && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, income_range: range.id })}
            >
              <Text style={[
                styles.optionText,
                form.income_range === range.id && styles.optionTextSelected,
              ]}>{range.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <Input
          label="Nationality"
          value={form.nationality}
          onChangeText={(text) => setForm({ ...form, nationality: text })}
          placeholder="e.g., Indian, Pakistani, Filipino"
        />
        <Input
          label="Age"
          value={form.age}
          onChangeText={(text) => setForm({ ...form, age: text.replace(/[^0-9]/g, '') })}
          placeholder="Your age"
          keyboardType="numeric"
        />
        <Input
          label="Bio"
          value={form.bio}
          onChangeText={(text) => setForm({ ...form, bio: text })}
          placeholder="Tell others about yourself..."
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Lifestyle */}
        <Text style={styles.sectionTitle}>Lifestyle</Text>
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
                    form.lifestyle_tags[key] === option && styles.chipSelected,
                  ]}
                  onPress={() => setForm({
                    ...form,
                    lifestyle_tags: { ...form.lifestyle_tags, [key]: option },
                  })}
                >
                  <Text style={[
                    styles.chipText,
                    form.lifestyle_tags[key] === option && styles.chipTextSelected,
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          size="lg"
          style={styles.saveButton}
        />

        <View style={{ height: 50 }} />
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  lifestyleSection: {
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
