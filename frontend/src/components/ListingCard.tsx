import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../constants/theme';

interface Listing {
  listing_id: string;
  title: string;
  area: string;
  rent: number;
  bed_type: string;
  room_type: string;
  gender_preference: string;
  photos: string[];
  compatibility_score?: number;
}

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onSave,
  isSaved = false,
}) => {
  const defaultImage = 'https://images.unsplash.com/photo-1637747019989-fec01a8d70fa?w=400';
  const imageSource = listing.photos && listing.photos.length > 0
    ? (listing.photos[0].startsWith('data:') ? { uri: listing.photos[0] } : { uri: listing.photos[0] })
    : { uri: defaultImage };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {listing.compatibility_score !== undefined && (
          <View style={styles.compatibilityBadge}>
            <Ionicons name="heart" size={14} color={colors.white} />
            <Text style={styles.compatibilityText}>{listing.compatibility_score}%</Text>
          </View>
        )}
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colors.secondary : colors.white}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.location}>{listing.area}</Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{listing.bed_type}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{listing.room_type}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons
              name={listing.gender_preference === 'male' ? 'male' : listing.gender_preference === 'female' ? 'female' : 'people'}
              size={12}
              color={colors.textSecondary}
            />
          </View>
        </View>
        <Text style={styles.price}>
          AED {listing.rent.toLocaleString()}
          <Text style={styles.priceUnit}>/month</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibilityText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  saveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  location: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  price: {
    ...typography.h3,
    color: colors.primary,
  },
  priceUnit: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '400',
  },
});
