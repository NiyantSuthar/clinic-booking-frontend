// src/components/PrivacyAndTermsSection.js
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme/colors";

const PRIVACY_POLICY_TEXT = `Krishna Clinic Appointment Booking System

PRIVACY POLICY
Last Updated: September 2026
Version: 1.0

INFORMATION WE COLLECT
This application collects the following information:
- Phone number (used to create and log into your account)
- Name and village for you and any family members (beneficiaries) you add
- Appointment booking details: date, queue number, and booking history
- Device notification tokens (for push notifications)

HOW WE USE THIS INFORMATION
- To create your account and verify your identity via OTP
- To manage appointment bookings for you and your beneficiaries
- To send booking confirmation and appointment reminders
- To allow clinic staff to identify and assist patients on arrival
- To improve app functionality and user experience

DATA SHARING
We do not sell or share your personal information with third parties for advertising or marketing purposes. Your phone number is shared only with our SMS delivery provider solely to send you one-time login codes.

DATA STORAGE & SECURITY
Your information is stored securely on PostgreSQL databases and is only accessible to authorized clinic staff for managing appointments. We use industry-standard encryption and authentication mechanisms to protect your data.

DATA RETENTION & DELETION
You may request deletion of your account and associated data at any time by contacting the clinic. Upon deletion, all personal information will be permanently removed from our systems.

CHILDREN'S PRIVACY
This app is not directed at children under 13. If you believe a child has provided us with personal information, please contact us and we will remove it immediately.

CHANGES TO THIS POLICY
We may update this policy occasionally. Any significant changes will be announced in the app. Your continued use of the app after updates means you accept the new policy.

CONTACT US
If you have questions about this privacy policy or your data, please contact:
Krishna Clinic, Bhalej
Email: [krishnaclinic4u@gmail.com]`;

const TERMS_AND_CONDITIONS_TEXT = `Krishna Clinic Appointment Booking System

TERMS AND CONDITIONS
Last Updated: September 2026
Version: 1.0

1. ACCEPTANCE OF TERMS
By using this application, you agree to these terms and conditions. If you do not agree, do not use this application.

2. USE LICENSE
You are granted a limited, non-exclusive, non-transferable license to use this app for booking appointments at Krishna Clinic. You may not:
- Reproduce, distribute, or transmit any content
- Attempt to gain unauthorized access to the app or its systems
- Use the app for any illegal or fraudulent purpose
- Interfere with the normal operation of the app

3. USER RESPONSIBILITIES
You are responsible for:
- Maintaining the confidentiality of your account credentials
- Providing accurate and complete information
- Canceling appointments through the app if you cannot attend
- Complying with clinic policies and procedures

4. APPOINTMENT POLICY
- Appointments are subject to availability
- Queue numbers are assigned based on booking order
- Late arrivals may not be accommodated
- Cancellations should be made 24 hours in advance when possible
- The clinic reserves the right to reschedule appointments if necessary

5. LIMITATION OF LIABILITY
The clinic is not liable for:
- Any indirect, incidental, or consequential damages
- Loss of data or interruptions in app service
- Missed appointments due to technical issues (though we take all precautions)
- Personal injury or property damage

6. INTELLECTUAL PROPERTY
All content, features, and functionality of this app are owned by Krishna Clinic or its licensors and are protected by copyright and other laws.

7. TERMINATION
We reserve the right to terminate your account if you violate these terms or engage in harmful behavior.

8. MODIFICATIONS
We may update these terms at any time. Your continued use of the app constitutes acceptance of changes.

9. GOVERNING LAW
These terms are governed by applicable local laws.

10. CONTACT FOR LEGAL INQUIRIES
For any legal questions regarding these terms, please contact:
Krishna Clinic, Bhalej
Email: [contact-email-here]`;

export default function PrivacyAndTermsSection() {
  const [activeTab, setActiveTab] = useState("privacy"); // "privacy" or "terms"
  const [expanded, setExpanded] = useState(false);

  const content =
    activeTab === "privacy" ? PRIVACY_POLICY_TEXT : TERMS_AND_CONDITIONS_TEXT;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Privacy & Terms</Text>

      {/* Tab Buttons */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "privacy" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("privacy")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "privacy" && styles.tabButtonTextActive,
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "terms" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("terms")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "terms" && styles.tabButtonTextActive,
            ]}
          >
            Terms & Conditions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Content */}
      {!expanded ? (
        <TouchableOpacity
          style={styles.previewCard}
          onPress={() => setExpanded(true)}
        >
          <Text style={styles.previewText} numberOfLines={3}>
            {content}
          </Text>
          <Text style={styles.expandPrompt}>Tap to read full document</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.expandedCard}>
          <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.fullContent}>{content}</Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.collapseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Copyright Notice */}
      <View style={styles.copyrightCard}>
        <Text style={styles.copyrightText}>
          © 2026 Krishna Clinic. All rights reserved.
        </Text>
        <Text style={styles.copyrightSubtext}>
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  previewCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  expandPrompt: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    fontStyle: "italic",
  },
  expandedCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    maxHeight: 400,
  },
  contentScroll: {
    marginBottom: 12,
  },
  fullContent: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  collapseButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  collapseButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  copyrightCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  copyrightText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
