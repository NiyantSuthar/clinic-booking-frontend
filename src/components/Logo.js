import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * Reused on the Login and Admin screens (the two "entry point" screens
 * where showing clinic branding matters most). Reads from
 * assets/images/logo.png - place your logo file there for this to render;
 * until then this will show a broken-image icon, which is expected.
 */
export default function Logo({ size = 96, style }) {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={[{ width: size, height: size }, styles.image, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});