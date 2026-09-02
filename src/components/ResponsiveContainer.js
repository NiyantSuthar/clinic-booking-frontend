import { StyleSheet, View } from "react-native";
import { MAX_CONTENT_WIDTH } from "../theme/layout";

/**
 * The one reusable wrapper - every screen's top-level content gets
 * wrapped in this instead of duplicating the same three style
 * properties (maxWidth, width, alignSelf) in every screen's
 * StyleSheet. style prop lets each screen still control padding/
 * background/etc. on top of this shared centering behavior.
 */
export default function ResponsiveContainer({ children, style }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
});
