import * as SecureStore from "expo-secure-store";
import { createContext, useEffect, useState } from "react";

/**
 * Now persists the session on-device via expo-secure-store (encrypted
 * keystore on Android) - this is what makes "stay logged in until
 * explicit logout" actually work across app restarts, not just within
 * one running session like before.
 *
 * authLoading starts true and flips false once the SecureStore read
 * completes - AuthGate waits for this before making any redirect
 * decision, so a returning logged-in user never flashes the Login
 * screen for a moment before landing on their tabs.
 */
export const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token: "auth_token",
  role: "auth_role",
  accountId: "auth_account_id",
  phoneNumber: "auth_phone_number",
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: null,
    token: null,
    accountId: null,
    phoneNumber: null,
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, role, accountId, phoneNumber] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEYS.token),
          SecureStore.getItemAsync(STORAGE_KEYS.role),
          SecureStore.getItemAsync(STORAGE_KEYS.accountId),
          SecureStore.getItemAsync(STORAGE_KEYS.phoneNumber),
        ]);

        if (token && role) {
          setAuthState({
            isLoggedIn: true,
            role,
            token,
            accountId: accountId ? Number(accountId) : null,
            phoneNumber: phoneNumber || null,
          });
        }
      } catch (err) {
        console.log("[Auth] Could not restore session:", err.message);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const login = async ({
    token,
    role,
    accountId = null,
    phoneNumber = null,
  }) => {
    setAuthState({ isLoggedIn: true, role, token, accountId, phoneNumber });
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.token, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.role, role);
      if (accountId != null)
        await SecureStore.setItemAsync(
          STORAGE_KEYS.accountId,
          String(accountId),
        );
      if (phoneNumber != null)
        await SecureStore.setItemAsync(STORAGE_KEYS.phoneNumber, phoneNumber);
    } catch (err) {
      console.log("[Auth] Could not persist session:", err.message);
    }
  };

  const logout = async () => {
    setAuthState({
      isLoggedIn: false,
      role: null,
      token: null,
      accountId: null,
      phoneNumber: null,
    });
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map((key) =>
          SecureStore.deleteItemAsync(key),
        ),
      );
    } catch (err) {
      console.log("[Auth] Could not clear persisted session:", err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
