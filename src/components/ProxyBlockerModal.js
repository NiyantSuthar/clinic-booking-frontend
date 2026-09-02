// src/components/ProxyBlockerModal.js
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { detectProxy } from "../utils/ProxyDetection";
import { colors } from "../theme/colors";

/**
 * ProxyBlockerModal - Detects proxy at startup and blocks app if found
 * User MUST disable proxy and restart app to proceed
 * Call this in your App root component before anything else
 */
export default function ProxyBlockerModal({
  onProxyCheckComplete,
  children,
}) {
  const [proxyDetected, setProxyDetected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkProxyOnStartup();
  }, []);

  const checkProxyOnStartup = async () => {
    setChecking(true);
    try {
      const result = await detectProxy();
      if (result.hasProxy) {
        setProxyDetected(true);
      } else {
        setProxyDetected(false);
        onProxyCheckComplete?.();
      }
    } catch (error) {
      console.error("Proxy check error:", error);
      // On error, allow app to load (but could change to be strict)
      onProxyCheckComplete?.();
    } finally {
      setChecking(false);
    }
  };

  const handleRetryCheck = async () => {
    setRetryCount((prev) => prev + 1);
    await checkProxyOnStartup();
  };

  // Show loading while checking
  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
        <Text style={styles.checkingText}>Checking security settings...</Text>
      </View>
    );
  }

  // Show blocking modal if proxy detected
  if (proxyDetected) {
    return (
      <Modal
        visible={proxyDetected}
        transparent={true}
        animationType="fade"
        hardwareAccelerated={false}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Proxy Detected</Text>

            <Text style={styles.message}>
              This app detected an active proxy connection on your device.
            </Text>

            <Text style={styles.message}>
              For security reasons, the app cannot proceed while a proxy is
              active.
            </Text>

            <View style={styles.steps}>
              <Text style={styles.stepTitle}>Please:</Text>
              <Text style={styles.step}>
                1. Disable your proxy in device settings
              </Text>
              <Text style={styles.step}>
                2. Close any VPN or proxy apps (Burp Suite, Charles, Fiddler,
                etc.)
              </Text>
              <Text style={styles.step}>3. Tap "Retry" below</Text>
              <Text style={styles.step}>
                4. If the message persists, restart the app
              </Text>
            </View>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryCheck}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>

            {retryCount > 0 && (
              <Text style={styles.hintText}>
                Retried {retryCount} time(s). If proxy still detected, restart
                the app.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // If no proxy, render children (app content)
  return children;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    marginBottom: 16,
  },
  checkingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.error,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  steps: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginVertical: 20,
    width: "100%",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  step: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
