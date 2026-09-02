// src/utils/ProxyDetection.js
import { getProxySettings } from "expo-network";
import { Platform } from "react-native";

/**
 * Detects if device has proxy enabled (Android & iOS)
 * Returns { hasProxy: boolean, proxyHost?: string, proxyPort?: number }
 */
export const detectProxy = async () => {
  try {
    if (Platform.OS === "android") {
      // Android: check system proxy settings
      const proxySettings = await getProxySettings();
      if (proxySettings && proxySettings.host) {
        return {
          hasProxy: true,
          proxyHost: proxySettings.host,
          proxyPort: proxySettings.port,
        };
      }
    }

    // iOS & fallback: check environment variables that proxy tools set
    // Charles, Fiddler, Burp Suite all set these
    const proxyEnvVars = [
      "http_proxy",
      "HTTP_PROXY",
      "https_proxy",
      "HTTPS_PROXY",
      "ALL_PROXY",
    ];

    for (const envVar of proxyEnvVars) {
      if (process.env[envVar]) {
        return {
          hasProxy: true,
          proxyHost: process.env[envVar],
        };
      }
    }

    // Additional check: look for proxy in device settings (iOS)
    if (Platform.OS === "ios") {
      try {
        const response = await fetch("http://proxy.test/", {
          timeout: 2000,
        }).catch(() => null);
        // If this weird URL responds, proxy is likely intercepting
        if (response) {
          return {
            hasProxy: true,
            proxyHost: "System Proxy",
          };
        }
      } catch (e) {
        // Expected to fail, just checking
      }
    }

    return { hasProxy: false };
  } catch (error) {
    // If detection fails, assume no proxy for safety
    console.warn("Proxy detection error:", error);
    return { hasProxy: false };
  }
};
