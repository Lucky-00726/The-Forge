// ─────────────────────────────────────────────────────────────
// THE FORGE — Corner Markers Component
// Tactical L-shaped corner accents (Stitch design system)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, CornerMarker } from '../../constants/tokens';

interface CornerMarkersProps {
  position?: 'tl' | 'tr' | 'bl' | 'br' | 'all';
  color?: string;
  size?: number;
  borderWidth?: number;
}

export function CornerMarkers({
  position = 'all',
  color = Colors.primary,
  size = CornerMarker.size,
  borderWidth = CornerMarker.borderWidth,
}: CornerMarkersProps) {
  const showTL = position === 'all' || position === 'tl';
  const showTR = position === 'all' || position === 'tr';
  const showBL = position === 'all' || position === 'bl';
  const showBR = position === 'all' || position === 'br';

  const markerStyle = {
    width: size,
    height: size,
  };

  return (
    <>
      {showTL && (
        <View
          style={[
            styles.corner,
            styles.topLeft,
            markerStyle,
            {
              borderTopWidth: borderWidth,
              borderLeftWidth: borderWidth,
              borderColor: color,
            },
          ]}
        />
      )}
      {showTR && (
        <View
          style={[
            styles.corner,
            styles.topRight,
            markerStyle,
            {
              borderTopWidth: borderWidth,
              borderRightWidth: borderWidth,
              borderColor: color,
            },
          ]}
        />
      )}
      {showBL && (
        <View
          style={[
            styles.corner,
            styles.bottomLeft,
            markerStyle,
            {
              borderBottomWidth: borderWidth,
              borderLeftWidth: borderWidth,
              borderColor: color,
            },
          ]}
        />
      )}
      {showBR && (
        <View
          style={[
            styles.corner,
            styles.bottomRight,
            markerStyle,
            {
              borderBottomWidth: borderWidth,
              borderRightWidth: borderWidth,
              borderColor: color,
            },
          ]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
  },
  topLeft: {
    top: -1,
    left: -1,
  },
  topRight: {
    top: -1,
    right: -1,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
  },
});
