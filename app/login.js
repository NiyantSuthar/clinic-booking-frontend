// app/login.js - Updated Login Screen
import { useContext, useState } from "react";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";
import { login } from "../src/api/authApi";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState(""); // Can be phone or username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    // Validation
    if (!identifier.trim()) {
      setError("Phone number or username is required");
      return;
    }

    // Check if it's phone or username
    const isPhone = /^\d{10}$/.test(identifier);
    const isAdmin = identifier.toLowerCase() === "clinicadmin";

    if (!isPhone && !isAdmin) {
      setError(
        "Enter a valid 10-digit phone number or 'clinicadmin' for admin login"
      );
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For admin, pass identifier as-is. For patient, it's the phone number.
      const response = await login(identifier, password);

      if (response.requiresPassword) {
        // User exists but password not provided - shouldn't happen here since we provided it
        setError("Invalid credentials");
        return;
      }

      if (response.requiresOtp) {
        // Phone number not registered, redirect to register
        Alert.alert(
          "Not Registered",
          "This phone number is not registered. Please register first.",
          [
            {
              text: "Go to Register",
              onPress: () => {
                router.push({
                  pathname: "/register",
                  params: { phoneNumber: identifier },
                });
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      // Login successful
      await authLogin({
        token: response.token,
        role: response.role,
        accountId: response.accountId,
        phoneNumber: isPhone ? identifier : null,
      });

      // Redirect based on role
      if (response.role === "ADMIN") {
        router.replace("/admin");
      } else if (response.role === "PATIENT") {
        router.replace("/booking");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Identifier Input (Phone or Username) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number or Username</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="10-digit phone or 'clinicadmin'"
              placeholderTextColor={colors.textDisabled}
              keyboardType="default"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setError(null);
              }}
              editable={!loading}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Enter your phone number or admin username
            </Text>
          </View>

          {/* Password Input with Show/Hide Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  error && styles.inputError,
                ]}
                placeholder="Your password"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.togglePasswordButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/register")}
            >
              Register here
            </Text>
          </Text>
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
    marginBottom: 32,
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  togglePasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordText: {
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
    color: colors.textPrimary,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});