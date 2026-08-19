import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { STATUS_LABELS } from '../utils/bookingStatus';

const STATUS_STYLES = {
  TODAY: { backgroundColor: '#dbeafe', textColor: colors.primaryDark },
  UPCOMING: { backgroundColor: '#d1fae5', textColor: colors.success },
  COMPLETED: { backgroundColor: '#f3f4f6', textColor: colors.textSecondary },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.COMPLETED;

  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.text, { color: style.textColor }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});