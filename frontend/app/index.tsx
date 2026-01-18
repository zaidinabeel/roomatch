import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';
import LandingScreen from './landing';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (isAuthenticated) {
      // Check if profile is complete
      if (profile && !profile.profile_complete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, mounted, profile]);

  if (isLoading || !mounted) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LandingScreen />;
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
