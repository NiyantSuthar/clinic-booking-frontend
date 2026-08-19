import { useRouter, useSegments } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function AuthGate({ children }) {
  const { isLoggedIn, role, authLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return; // wait for the SecureStore restore to finish before deciding anything

    const inPatientGroup = segments[0] === "(patient)";
    const inAdminGroup = segments[0] === "admin";

    if (!isLoggedIn && (inPatientGroup || inAdminGroup)) {
      router.replace("/");
    } else if (isLoggedIn && role === "PATIENT" && !inPatientGroup) {
      router.replace("/booking");
    } else if (isLoggedIn && role === "ADMIN" && !inAdminGroup) {
      router.replace("/admin");
    }
  }, [isLoggedIn, role, segments, authLoading]);

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
