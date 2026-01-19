import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../src/components/Card';
import { colors, spacing, typography, borderRadius } from '../src/constants/theme';

export default function HelpScreen() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How does the matching work?',
      answer: 'Our algorithm matches you based on profession, income range, and lifestyle preferences like working hours, food habits, and cleanliness standards.',
    },
    {
      question: 'Is my information safe?',
      answer: 'Yes, we use secure encryption for all data. Your personal details are only shared with potential matches after you approve.',
    },
    {
      question: 'How do I become a verified lister?',
      answer: 'Upload your Emirates ID and a selfie in the verification section. Our team will review and verify within 24-48 hours.',
    },
    {
      question: 'What does the subscription include?',
      answer: 'Subscribers get unlimited chat, view contact details, and priority support. Listers need subscription to keep listings active.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'We offer refunds within 7 days of subscription if you havent used the chat feature. Contact support for assistance.',
    },
  ];

  const contactOptions = [
    { icon: 'mail', label: 'Email Support', value: 'support@roommatch.ae' },
    { icon: 'call', label: 'Phone', value: '+971 4 XXX XXXX' },
    { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+971 5X XXX XXXX' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <Card key={index} style={styles.faqCard}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </Card>
        ))}

        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactOption}
            onPress={() => {
              if (option.icon === 'mail') {
                Linking.openURL(`mailto:${option.value}`);
              }
            }}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name={option.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{option.label}</Text>
              <Text style={styles.contactValue}>{option.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Content Guidelines</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={styles.disclaimerText}>
            RoomMatch is a discovery platform only. We do not collect rent, manage properties, or act as brokers. All transactions are between users.
          </Text>
        </View>

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
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  faqCard: {
    marginBottom: spacing.md,
  },
  question: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  answer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  contactValue: {
    ...typography.body,
    color: colors.text,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legalText: {
    ...typography.body,
    color: colors.text,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});
