import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { chatApi } from '../../src/hooks/useApi';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography, borderRadius } from '../../src/constants/theme';

export default function ChatScreen() {
  const { isAuthenticated, hasSubscription, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await chatApi.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getUnreadCount = (conv: any) => {
    if (user?.user_id === conv.seeker_id) {
      return conv.seeker_unread || 0;
    }
    return conv.lister_unread || 0;
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
          <Text style={styles.authTitle}>Chat with Listers</Text>
          <Text style={styles.authSubtitle}>
            Sign in to start conversations with property listers
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

  // Show subscription prompt for seekers without subscription
  if (user?.role === 'seeker' && !hasSubscription && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.subscriptionPrompt}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
          </View>
          <Text style={styles.subscriptionTitle}>Unlock Chat</Text>
          <Text style={styles.subscriptionSubtitle}>
            Subscribe to message listers and schedule viewings
          </Text>
          <View style={styles.subscriptionFeatures}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Unlimited messaging</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>View contact details</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>
          <Button
            title="View Plans - From AED 29/mo"
            onPress={() => router.push('/subscription')}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{conversations.length} conversations</Text>
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
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation from a listing</Text>
          </View>
        ) : (
          conversations.map((conv) => {
            const unread = getUnreadCount(conv);
            return (
              <TouchableOpacity
                key={conv.conversation_id}
                style={styles.conversationCard}
                onPress={() => router.push(`/chat/${conv.conversation_id}`)}
              >
                <Image
                  source={{ uri: conv.other_user?.picture || 'https://via.placeholder.com/50' }}
                  style={styles.avatar}
                />
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {conv.other_user?.name || 'User'}
                    </Text>
                    {conv.last_message_at && (
                      <Text style={styles.timestamp}>
                        {formatTime(conv.last_message_at)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {conv.listing_info?.title} • {conv.listing_info?.area}
                  </Text>
                  <View style={styles.lastMessageRow}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {conv.last_message || 'No messages yet'}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
  subscriptionPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
  },
  subscriptionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subscriptionFeatures: {
    marginTop: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  listingTitle: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
});
