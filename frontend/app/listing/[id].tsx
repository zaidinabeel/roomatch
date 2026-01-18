import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { listingsApi, savedListingsApi, chatApi } from '../../src/hooks/useApi';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { CompatibilityBadge } from '../../src/components/CompatibilityBadge';
import { colors, spacing, typography, borderRadius } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, hasSubscription, user } = useAuth();
  
  const [listing, setListing] = useState<any>(null);
  const [lister, setLister] = useState<any>(null);
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchListing();
    checkIfSaved();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await listingsApi.getOne(id as string);
      setListing(response.data.listing);
      setLister(response.data.lister);
      setCompatibilityScore(response.data.compatibility_score);
    } catch (error) {
      console.error('Error fetching listing:', error);
      Alert.alert('Error', 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await savedListingsApi.getAll();
      const saved = (response.data.listings || []).some((l: any) => l.listing_id === id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved:', error);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      router.push('/landing');
      return;
    }

    try {
      if (isSaved) {
        await savedListingsApi.unsave(id as string);
        setIsSaved(false);
      } else {
        await savedListingsApi.save(id as string);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleContact = async () => {
    if (!isAuthenticated) {
      router.push('/landing');
      return;
    }

    if (user?.role === 'seeker' && !hasSubscription) {
      Alert.alert(
        'Subscription Required',
        'Subscribe to contact listers and schedule viewings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/subscription') },
        ]
      );
      return;
    }

    setSending(true);
    try {
      // Send initial message
      await chatApi.sendMessage({
        listing_id: listing.listing_id,
        receiver_id: listing.lister_id,
        content: `Hi! I'm interested in your listing: ${listing.title}`,
      });
      router.push('/(tabs)/chat');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      router.push('/landing');
      return;
    }
    router.push(`/report?type=listing&id=${id}`);
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

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Listing not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1637747019989-fec01a8d70fa?w=800';
  const images = listing.photos && listing.photos.length > 0 ? listing.photos : [defaultImage];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colors.secondary : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
            <Ionicons name="flag-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((img: string, index: number) => (
              <Image
                key={index}
                source={{ uri: img.startsWith('data:') ? img : img }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
          {compatibilityScore !== null && (
            <View style={styles.compatibilityContainer}>
              <CompatibilityBadge score={compatibilityScore} size="lg" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>AED {listing.rent.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.location}>{listing.area}</Text>
            {listing.address && (
              <Text style={styles.address}> • {listing.address}</Text>
            )}
          </View>

          {/* Quick Info Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Ionicons name="bed" size={16} color={colors.primary} />
              <Text style={styles.tagText}>{listing.bed_type}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="home" size={16} color={colors.primary} />
              <Text style={styles.tagText}>{listing.room_type}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons
                name={listing.gender_preference === 'male' ? 'male' : listing.gender_preference === 'female' ? 'female' : 'people'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.tagText}>{listing.gender_preference}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={styles.tagText}>
                {listing.current_occupants}/{listing.max_occupants}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </Card>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* House Rules */}
          {listing.house_rules && listing.house_rules.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>House Rules</Text>
              {listing.house_rules.map((rule: string, index: number) => (
                <View key={index} style={styles.ruleItem}>
                  <Ionicons name="information-circle" size={18} color={colors.warning} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Lister Info */}
          {lister && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Listed By</Text>
              <View style={styles.listerRow}>
                <View style={styles.listerAvatar}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.listerInfo}>
                  <Text style={styles.listerName}>{lister.name}</Text>
                  {lister.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Preferred Roommate */}
          {(listing.preferred_profession || listing.preferred_income_range || Object.keys(listing.preferred_lifestyle || {}).length > 0) && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Roommate</Text>
              {listing.preferred_profession && listing.preferred_profession.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Profession:</Text>
                  <Text style={styles.preferenceValue}>
                    {listing.preferred_profession.join(', ')}
                  </Text>
                </View>
              )}
              {listing.preferred_income_range && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Income:</Text>
                  <Text style={styles.preferenceValue}>
                    AED {listing.preferred_income_range}
                  </Text>
                </View>
              )}
            </Card>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceValue}>AED {listing.rent.toLocaleString()}</Text>
          <Text style={styles.bottomPriceUnit}>/month</Text>
        </View>
        <Button
          title={hasSubscription || user?.role === 'lister' ? 'Contact Lister' : 'Unlock Chat'}
          onPress={handleContact}
          loading={sending}
          icon={<Ionicons name={hasSubscription ? 'chatbubble' : 'lock-closed'} size={20} color={colors.white} style={{ marginRight: 8 }} />}
          style={styles.contactButton}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
  },
  imageDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  compatibilityContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    ...typography.h2,
    color: colors.primary,
  },
  priceUnit: {
    ...typography.body,
    color: colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  location: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  tagText: {
    ...typography.bodySmall,
    color: colors.text,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.xs,
  },
  amenityText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ruleText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  listerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listerInfo: {
    marginLeft: spacing.md,
  },
  listerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  preferenceItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  preferenceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 100,
  },
  preferenceValue: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bottomPriceValue: {
    ...typography.h3,
    color: colors.text,
  },
  bottomPriceUnit: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  contactButton: {
    flex: 1,
    marginLeft: spacing.lg,
  },
});
