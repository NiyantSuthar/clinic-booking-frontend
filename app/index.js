import { Ionicons } from "@expo/vector-icons";
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
import {
  forgotPassword as forgotPasswordApi,
  login as loginApi,
  verifyOtpAndSetPassword as verifyOtpAndSetPasswordApi,
} from "../src/api/authApi";
import Logo from "../src/components/Logo";
import ResponsiveContainer from "../src/components/ResponsiveContainer";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

const PHONE_REGEX = /^[0-9]{10}$/;
const OTP_REGEX = /^[0-9]{6}$/;

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [screen, setScreen] = useState("PHONE");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleContinue = async () => {
    setFormError(null);
    setPhoneError(null);
    setPasswordError(null);

    const trimmedPhone = phoneNumber.trim();
    const trimmedPassword = password.trim();

    if (!trimmedPhone) {
      setPhoneError("Phone number is required.");
      return;
    }
    if (!trimmedPassword && !PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginApi(trimmedPhone, trimmedPassword);

      if (result.requiresOtp) {
        setScreen("COMPLETE");
        startCooldown();
      } else if (result.requiresPassword) {
        setPasswordError("This number is registered - enter your password.");
      } else if (result.token) {
        await login({ token: result.token, role: result.role });
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes("incorrect password")) {
        setPasswordError(err.message);
      } else {
        setFormError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Enter your 10-digit phone number first.");
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      await forgotPasswordApi(trimmedPhone);
      setScreen("COMPLETE");
      startCooldown();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCompleteError(null);
    try {
      await forgotPasswordApi(phoneNumber.trim());
      startCooldown();
    } catch (err) {
      setCompleteError(err.message);
    }
  };

  const handleCompleteSubmit = async () => {
    setCompleteError(null);

    const trimmedOtp = otpCode.trim();
    if (!OTP_REGEX.test(trimmedOtp)) {
      setCompleteError("Enter the 6-digit code.");
      return;
    }
    if (newPassword.length < 6) {
      setCompleteError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setCompleteError("Passwords do not match.");
      return;
    }

    setCompleteLoading(true);
    try {
      const result = await verifyOtpAndSetPasswordApi(
        phoneNumber.trim(),
        trimmedOtp,
        newPassword,
        confirmPassword,
      );
      await login({
        token: result.token,
        role: "PATIENT",
        accountId: result.accountId,
        phoneNumber: result.phoneNumber,
      });
    } catch (err) {
      setCompleteError(err.message);
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setScreen("PHONE");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCompleteError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer style={styles.formArea}>
          <Logo size={100} />
          <Text style={styles.title}>Clinic Booking</Text>

          {screen === "PHONE" ? (
            <>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, phoneError && styles.inputError]}
                placeholder="10-digit phone number, or admin username"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setPhoneError(null);
                }}
                autoCapitalize="none"
                editable={!loading}
              />
              {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  key={`password-${passwordVisible}`}
                  style={[
                    styles.passwordInput,
                    passwordError && styles.inputError,
                  ]}
                  placeholder="Leave blank if this is your first time"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(null);
                  }}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setPasswordVisible((prev) => !prev)}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}

              {formError && (
                <Text style={styles.formErrorText}>{formError}</Text>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                Enter the code sent to {phoneNumber}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                keyboardType="number-pad"
                value={otpCode}
                onChangeText={setOtpCode}
                editable={!completeLoading}
                maxLength={6}
              />

              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  key={`new-password-${newPasswordVisible}`}
                  style={styles.passwordInput}
                  placeholder="At least 6 characters"
                  secureTextEntry={!newPasswordVisible}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!completeLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setNewPasswordVisible((prev) => !prev)}
                >
                  <Ionicons
                    name={newPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  key={`confirm-password-${confirmPasswordVisible}`}
                  style={styles.passwordInput}
                  placeholder="Re-type your password"
                  secureTextEntry={!confirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!completeLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setConfirmPasswordVisible((prev) => !prev)}
                >
                  <Ionicons
                    name={confirmPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {completeError && (
                <Text style={styles.formErrorText}>{completeError}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  completeLoading && styles.buttonDisabled,
                ]}
                onPress={handleCompleteSubmit}
                disabled={completeLoading}
              >
                {completeLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Set Password & Log In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryRow}>
                <TouchableOpacity
                  onPress={handleBackToPhone}
                  disabled={completeLoading}
                >
                  <Text style={styles.linkText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || completeLoading}
                >
                  <Text
                    style={[
                      styles.linkText,
                      (resendCooldown > 0 || completeLoading) &&
                        styles.linkTextDisabled,
                    ]}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.reminderText}>
                Write your password down somewhere safe - you'll need it to log
                in on a new device or after logging out.
              </Text>
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  formArea: { padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    textAlign: "center",
    color: colors.textPrimary,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  // color added explicitly - fixes stars/typed text rendering
  // invisible on some Android devices that were falling back to a
  // near-white default text color instead of inheriting a dark one.
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: { paddingHorizontal: 12 },
  inputError: { borderColor: colors.borderError },
  errorText: { color: colors.error, fontSize: 13, marginTop: 4 },
  formErrorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  linkTextDisabled: { color: colors.textDisabled },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  reminderText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
