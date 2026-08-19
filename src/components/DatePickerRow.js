import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from "react-native";
import { colors } from "../theme/colors";
import { getBookableDates } from "../utils/date";

/** A row of the next 7 bookable days. Sundays are shown but disabled/unselectable - matches the backend's rejection, not a substitute for it. */
export default function DatePickerRow({ selectedDate, onSelect }) {
  const dates = getBookableDates();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {dates.map((d) => {
        const isSelected = d.iso === selectedDate;
        const disabled = d.isSunday;

        return (
          <TouchableOpacity
            key={d.iso}
            disabled={disabled}
            onPress={() => onSelect(d.iso)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                isSelected && styles.textSelected,
                disabled && styles.textDisabled,
              ]}
            >
              {d.dayLabel}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                isSelected && styles.textSelected,
                disabled && styles.textDisabled,
              ]}
            >
              {d.dayNumber}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 4, gap: 8 },
  chip: {
    width: 52,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.surfaceMuted,
  },
  dayLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  dayNumber: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  textSelected: { color: "#fff" },
  textDisabled: { color: colors.textDisabled },
});
