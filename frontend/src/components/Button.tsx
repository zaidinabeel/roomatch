import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = spacing.sm;
        base.paddingHorizontal = spacing.md;
        break;
      case 'lg':
        base.paddingVertical = spacing.lg;
        base.paddingHorizontal = spacing.xl;
        break;
      default:
        base.paddingVertical = spacing.md;
        base.paddingHorizontal = spacing.lg;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        base.backgroundColor = colors.secondary;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 2;
        base.borderColor = colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      default:
        base.backgroundColor = colors.primary;
    }

    if (disabled) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
    };

    switch (size) {
      case 'sm':
        base.fontSize = 14;
        break;
      case 'lg':
        base.fontSize = 18;
        break;
      default:
        base.fontSize = 16;
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        base.color = colors.primary;
        break;
      default:
        base.color = colors.white;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), icon && { marginLeft: spacing.sm }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
