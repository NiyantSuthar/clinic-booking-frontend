// app/forgot-password.js - Forgot Password Screen (Reset via OTP)
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { forgotPassword, verifyOtpAndSetPassword } from "../src/api/authApi";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Steps: "phone", "otp", "password"
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useContext(AuthContext);

  // STEP 1: Request OTP
  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await forgotPassword(phoneNumber);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Verify OTP & Set Password
  const handleResetPassword = async () => {
    if (!otpCode.trim()) {
      setError("OTP is required");
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setError("OTP must be 6 digits");
      return;
    }
    if (!newPassword.trim()) {
      setError("Password is required");
      return;
    }
    if (!confirmPassword.trim()) {
      setError("Confirm password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyOtpAndSetPassword(
        phoneNumber,
        otpCode,
        newPassword,
        confirmPassword,
      );

      // Password reset successful
      await authLogin({
        token: response.token,
        role: "PATIENT",
        accountId: response.accountId,
        phoneNumber: phoneNumber,
      });

      router.replace("/booking");
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "phone") {
      router.back();
    } else {
      setStep("phone");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === "phone" && "Enter your registered phone number"}
            {step === "otp" && "Enter the OTP sent to your phone"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* STEP 1: Phone */}
          {step === "phone" && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="10-digit number"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setError(null);
                  }}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2: OTP & New Password */}
          {step === "otp" && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text);
                    setError(null);
                  }}
                  editable={!loading}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError(null);
                  }}
                  editable={!loading}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={true}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendContainer}
                onPress={() => handleRequestOtp()}
                disabled={loading}
              >
                <Text style={styles.resendText}>
                  Didn't receive OTP? Resend
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 20,
    marginBottom: 28,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.error + "15",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "500",
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
});
