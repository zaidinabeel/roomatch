import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { savedListingsApi } from '../../src/hooks/useApi';
import { ListingCard } from '../../src/components/ListingCard';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/constants/theme';

export default function SavedScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await savedListingsApi.getAll();
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching saved:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSaved();
  }, []);

  const handleUnsave = async (listingId: string) => {
    try {
      await savedListingsApi.unsave(listingId);
      setListings(listings.filter(l => l.listing_id !== listingId));
    } catch (error) {
      console.error('Error unsaving:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="bookmark-outline" size={64} color={colors.textMuted} />
          <Text style={styles.authTitle}>Save Your Favorites</Text>
          <Text style={styles.authSubtitle}>
            Sign in to save listings and access them anytime
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Listings</Text>
        <Text style={styles.subtitle}>{listings.length} saved</Text>
      </View>

      <ScrollView
        style={styles.content}
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
            <Ionicons name="bookmark-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No saved listings</Text>
            <Text style={styles.emptySubtext}>Start exploring and save your favorites</Text>
            <Button
              title="Explore Listings"
              onPress={() => router.push('/(tabs)')}
              variant="outline"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              onPress={() => router.push(`/listing/${listing.listing_id}`)}
              onSave={() => handleUnsave(listing.listing_id)}
              isSaved={true}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  content: {
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
