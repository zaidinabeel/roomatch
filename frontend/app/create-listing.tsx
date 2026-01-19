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
import { listingsApi } from '../src/hooks/useApi';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { Card } from '../src/components/Card';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

const AREAS = ['Deira', 'Bur Dubai', 'Karama', 'Al Nahda', 'International City'];
const BED_TYPES = ['single', 'bunk', 'partition'];
const ROOM_TYPES = ['shared', 'private'];
const GENDERS = ['male', 'female', 'any'];
const AMENITIES = [
  'WiFi', 'AC', 'Washing Machine', 'Kitchen Access', 'Parking',
  'Gym', 'Pool', 'Security', 'CCTV', 'Furnished'
];

export default function CreateListingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    area: '',
    address: '',
    rent: '',
    bed_type: '',
    room_type: '',
    gender_preference: '',
    max_occupants: '1',
    current_occupants: '0',
    amenities: [] as string[],
    house_rules: [] as string[],
  });

  const [newRule, setNewRule] = useState('');

  // Check verification status
  useEffect(() => {
    if (!user?.is_verified) {
      Alert.alert(
        'Verification Required',
        'Please complete identity verification before creating a listing.',
        [{ text: 'Verify Now', onPress: () => router.replace('/verification') }]
      );
    }
  }, [user]);

  const pickImage = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (form.amenities.includes(amenity)) {
      setForm({ ...form, amenities: form.amenities.filter(a => a !== amenity) });
    } else {
      setForm({ ...form, amenities: [...form.amenities, amenity] });
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setForm({ ...form, house_rules: [...form.house_rules, newRule.trim()] });
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setForm({ ...form, house_rules: form.house_rules.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.title || !form.description || !form.area || !form.rent || 
        !form.bed_type || !form.room_type || !form.gender_preference) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Photos Required', 'Please add at least one photo');
      return;
    }

    setLoading(true);
    try {
      await listingsApi.create({
        ...form,
        rent: parseFloat(form.rent),
        max_occupants: parseInt(form.max_occupants),
        current_occupants: parseInt(form.current_occupants),
        photos,
      });
      Alert.alert('Success', 'Listing created! It will be reviewed before going live.', [
        { text: 'OK', onPress: () => router.replace('/my-listings') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create listing');
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
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photos */}
        <Text style={styles.sectionTitle}>Photos *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Input
          label="Title *"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          placeholder="e.g., Cozy bedspace in Karama"
        />

        <Input
          label="Description *"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          placeholder="Describe your space..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Input
          label="Monthly Rent (AED) *"
          value={form.rent}
          onChangeText={(text) => setForm({ ...form, rent: text.replace(/[^0-9]/g, '') })}
          placeholder="e.g., 1500"
          keyboardType="numeric"
        />

        {/* Location */}
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.fieldLabel}>Area *</Text>
        <View style={styles.optionsGrid}>
          {AREAS.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.optionButton,
                form.area === area && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, area })}
            >
              <Text style={[
                styles.optionText,
                form.area === area && styles.optionTextSelected,
              ]}>{area}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Address (Optional)"
          value={form.address}
          onChangeText={(text) => setForm({ ...form, address: text })}
          placeholder="Building name, street..."
        />

        {/* Room Details */}
        <Text style={styles.sectionTitle}>Room Details</Text>
        
        <Text style={styles.fieldLabel}>Bed Type *</Text>
        <View style={styles.optionsRow}>
          {BED_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                form.bed_type === type && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, bed_type: type })}
            >
              <Text style={[
                styles.optionText,
                form.bed_type === type && styles.optionTextSelected,
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Room Type *</Text>
        <View style={styles.optionsRow}>
          {ROOM_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                form.room_type === type && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, room_type: type })}
            >
              <Text style={[
                styles.optionText,
                form.room_type === type && styles.optionTextSelected,
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Gender Preference *</Text>
        <View style={styles.optionsRow}>
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                form.gender_preference === gender && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, gender_preference: gender })}
            >
              <Ionicons
                name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'people'}
                size={16}
                color={form.gender_preference === gender ? colors.white : colors.text}
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.optionText,
                form.gender_preference === gender && styles.optionTextSelected,
              ]}>{gender}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Max Occupants"
              value={form.max_occupants}
              onChangeText={(text) => setForm({ ...form, max_occupants: text.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Current Occupants"
              value={form.current_occupants}
              onChangeText={(text) => setForm({ ...form, current_occupants: text.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Amenities */}
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityChip,
                form.amenities.includes(amenity) && styles.amenityChipSelected,
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Ionicons
                name={form.amenities.includes(amenity) ? 'checkmark-circle' : 'add-circle-outline'}
                size={16}
                color={form.amenities.includes(amenity) ? colors.white : colors.primary}
              />
              <Text style={[
                styles.amenityText,
                form.amenities.includes(amenity) && styles.amenityTextSelected,
              ]}>{amenity}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* House Rules */}
        <Text style={styles.sectionTitle}>House Rules</Text>
        <View style={styles.ruleInputRow}>
          <TextInput
            style={styles.ruleInput}
            value={newRule}
            onChangeText={setNewRule}
            placeholder="Add a rule..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.addRuleButton} onPress={addRule}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        {form.house_rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleText}>{rule}</Text>
            <TouchableOpacity onPress={() => removeRule(index)}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Submit */}
        <Button
          title="Create Listing"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitButton}
        />

        <Text style={styles.note}>
          Your listing will be reviewed before going live. This usually takes 24-48 hours.
        </Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

import { TextInput } from 'react-native';

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
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  photosScroll: {
    marginBottom: spacing.md,
  },
  photoContainer: {
    width: 120,
    height: 80,
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 80,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  amenityChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amenityText: {
    ...typography.caption,
    color: colors.text,
  },
  amenityTextSelected: {
    color: colors.white,
  },
  ruleInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ruleInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addRuleButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  ruleText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
