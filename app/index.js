// app/index.js - Auth Home Screen
import { useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function AuthHomeScreen() {
  const { isLoggedIn } = useContext(AuthContext);
  const router = useRouter();

  // If already logged in, redirect to app
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/booking");
    }
  }, [isLoggedIn]);

  return (
    <ImageBackground
      source={require("../assets/images/logo.png")}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Krishna Clinic</Text>
          <Text style={styles.subtitle}>Appointment Booking</Text>
        </View>

        {/* Body - spacer */}
        <View style={styles.spacer} />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Login</Text>
            <Text style={styles.buttonSubtext}>
              Already have an account? Sign in here.
            </Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.buttonGap} />

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerButtonText}>Register</Text>
            <Text style={styles.buttonSubtext}>
              New here? Create an account.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This app requires a valid phone number to proceed.
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 40,
    gap: 16,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  registerButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  buttonGap: {
    height: 8,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textDisabled,
    textAlign: "center",
    lineHeight: 18,
  },
});
