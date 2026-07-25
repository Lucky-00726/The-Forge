// ─────────────────────────────────────────────────────────────
// THE FORGE — Segmented Progress Bar Component
// Visual progress with gaps between segments (Stitch design)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface SegmentedProgressBarProps {
  segments?: number;
  progress: number; // 0-100
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  gap?: number;
}

export function SegmentedProgressBar({
  segments = 5,
  progress,
  height = 6,
  activeColor = Colors.primary,
  inactiveColor = Colors.bgHighest,
  gap = 2,
}: SegmentedProgressBarProps) {
  const filledSegments = Math.floor((progress / 100) * segments);
  const partialFill = ((progress / 100) * segments) % 1;

  return (
    <View style={styles.container}>
      {Array.from({ length: segments }).map((_, index) => {
        const isFilled = index < filledSegments;
        const isPartial = index === filledSegments && partialFill > 0;
        
        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                height,
                backgroundColor: isFilled ? activeColor : inactiveColor,
                marginRight: index < segments - 1 ? gap : 0,
              },
            ]}
          >
            {isPartial && (
              <View
                style={[
                  styles.partialFill,
                  {
                    width: `${partialFill * 100}%`,
                    backgroundColor: activeColor,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  partialFill: {
    height: '100%',
    borderRadius: Radius.xs,
  },
});
