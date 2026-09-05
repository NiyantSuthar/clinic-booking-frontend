// app/register.js - Register Screen (New User: Phone → OTP → Password)
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();
  const { phoneNumber: paramPhoneNumber } = useLocalSearchParams();

  // Step 1: Phone Number
  const [step, setStep] = useState("phone"); // "phone", "otp", "password"
  const [phoneNumber, setPhoneNumber] = useState(paramPhoneNumber || "");
  const [phoneError, setPhoneError] = useState(null);

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // Step 3: Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);

  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useContext(AuthContext);

  // STEP 1: Request OTP
  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setPhoneError("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setPhoneError(null);

    try {
      await forgotPassword(phoneNumber);
      setOtpSent(true);
      setStep("otp");
    } catch (err) {
      setPhoneError(err.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Set Password
  const handleVerifyOtpAndSetPassword = async () => {
    if (!otpCode.trim()) {
      setOtpError("OTP is required");
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError("OTP must be 6 digits");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("Password is required");
      return;
    }
    if (!confirmPassword.trim()) {
      setPasswordError("Confirm password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setOtpError(null);
    setPasswordError(null);

    try {
      const response = await verifyOtpAndSetPassword(
        phoneNumber,
        otpCode,
        newPassword,
        confirmPassword,
      );

      // Registration successful
      await authLogin({
        token: response.token,
        role: "PATIENT",
        accountId: response.accountId,
        phoneNumber: phoneNumber,
      });

      router.replace("/booking");
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "phone") {
      router.back();
    } else if (step === "otp") {
      setStep("phone");
      setOtpCode("");
      setOtpError(null);
      setOtpSent(false);
    } else if (step === "password") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {step === "phone" && "Enter your phone number"}
            {step === "otp" && "Enter the OTP sent to your phone"}
            {step === "password" && "Set your password"}
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressStep,
              step !== "phone" && styles.progressStepComplete,
            ]}
          >
            <Text style={styles.progressStepText}>1</Text>
          </View>
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressStep,
              step === "password" && styles.progressStepActive,
              (step === "otp" || step === "password") &&
                styles.progressStepComplete,
            ]}
          >
            <Text style={styles.progressStepText}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressStep,
              step === "password" && styles.progressStepActive,
            ]}
          >
            <Text style={styles.progressStepText}>3</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* STEP 1: Phone Number */}
          {step === "phone" && (
            <>
              {phoneError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{phoneError}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, phoneError && styles.inputError]}
                  placeholder="10-digit number"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setPhoneError(null);
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

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              {otpError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={[styles.input, otpError && styles.inputError]}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text);
                    setOtpError(null);
                  }}
                  editable={!loading}
                />
                <Text style={styles.hint}>
                  Check SMS for the code. Expires in 5 minutes.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => setStep("password")}
                disabled={loading || !otpCode.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
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

          {/* STEP 3: Password */}
          {step === "password" && (
            <>
              {passwordError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, passwordError && styles.inputError]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setPasswordError(null);
                  }}
                  editable={!loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, passwordError && styles.inputError]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={true}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setPasswordError(null);
                  }}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtpAndSetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        {step === "phone" && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => router.push("/login")}
              >
                Login here
              </Text>
            </Text>
          </View>
        )}
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
    marginBottom: 20,
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  progressStepActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressStepComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
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
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
