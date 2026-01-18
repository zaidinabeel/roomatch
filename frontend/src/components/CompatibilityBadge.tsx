import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../constants/theme';

interface CompatibilityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({
  score,
  size = 'md',
}) => {
  const getColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  const sizeStyles = {
    sm: { padding: spacing.xs, fontSize: 10, iconSize: 12 },
    md: { padding: spacing.sm, fontSize: 14, iconSize: 16 },
    lg: { padding: spacing.md, fontSize: 18, iconSize: 20 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, { backgroundColor: getColor() + '20', padding: currentSize.padding }]}>
      <Ionicons name="heart" size={currentSize.iconSize} color={getColor()} />
      <Text style={[styles.score, { color: getColor(), fontSize: currentSize.fontSize }]}>
        {score}%
      </Text>
      {size !== 'sm' && (
        <Text style={[styles.label, { color: getColor(), fontSize: currentSize.fontSize - 2 }]}>
          {getLabel()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  score: {
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  label: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});
