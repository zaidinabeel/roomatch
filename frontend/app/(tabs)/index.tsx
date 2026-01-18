import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { listingsApi, savedListingsApi } from '../../src/hooks/useApi';
import { ListingCard } from '../../src/components/ListingCard';
import { colors, spacing, typography, borderRadius } from '../../src/constants/theme';

const AREAS = ['All', 'Deira', 'Bur Dubai', 'Karama', 'Al Nahda', 'International City'];
const BED_TYPES = ['All', 'single', 'bunk', 'partition'];
const ROOM_TYPES = ['All', 'shared', 'private'];

export default function ExploreScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    area: 'All',
    bed_type: 'All',
    room_type: 'All',
    min_rent: '',
    max_rent: '',
  });

  const fetchListings = async () => {
    try {
      const params: Record<string, any> = {};
      if (filters.area !== 'All') params.area = filters.area;
      if (filters.bed_type !== 'All') params.bed_type = filters.bed_type;
      if (filters.room_type !== 'All') params.room_type = filters.room_type;
      if (filters.min_rent) params.min_rent = parseInt(filters.min_rent);
      if (filters.max_rent) params.max_rent = parseInt(filters.max_rent);

      const response = await listingsApi.getAll(params);
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSavedIds = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await savedListingsApi.getAll();
      const ids = (response.data.listings || []).map((l: any) => l.listing_id);
      setSavedIds(ids);
    } catch (error) {
      console.error('Error fetching saved:', error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchSavedIds();
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
    fetchSavedIds();
  }, [filters]);

  const handleSave = async (listingId: string) => {
    if (!isAuthenticated) {
      router.push('/landing');
      return;
    }

    try {
      if (savedIds.includes(listingId)) {
        await savedListingsApi.unsave(listingId);
        setSavedIds(savedIds.filter(id => id !== listingId));
      } else {
        await savedListingsApi.save(listingId);
        setSavedIds([...savedIds, listingId]);
      }
    } catch (error) {
      console.error('Error saving listing:', error);
    }
  };

  const handleViewListing = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const renderFilterChips = (options: string[], current: string, key: string) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.filterChip,
            current === option && styles.filterChipActive,
          ]}
          onPress={() => setFilters({ ...filters, [key]: option })}
        >
          <Text style={[
            styles.filterChipText,
            current === option && styles.filterChipTextActive,
          ]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Find Your Space</Text>
          <Text style={styles.subtitle}>Discover bedspaces in Dubai</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Area Filter */}
      {renderFilterChips(AREAS, filters.area, 'area')}

      {/* Extended Filters */}
      {showFilters && (
        <View style={styles.extendedFilters}>
          <Text style={styles.filterLabel}>Bed Type</Text>
          {renderFilterChips(BED_TYPES, filters.bed_type, 'bed_type')}
          
          <Text style={styles.filterLabel}>Room Type</Text>
          {renderFilterChips(ROOM_TYPES, filters.room_type, 'room_type')}
        </View>
      )}

      {/* Listings */}
      <ScrollView
        style={styles.listingsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No listings found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              onPress={() => handleViewListing(listing.listing_id)}
              onSave={() => handleSave(listing.listing_id)}
              isSaved={savedIds.includes(listing.listing_id)}
            />
          ))
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChips: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  extendedFilters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
