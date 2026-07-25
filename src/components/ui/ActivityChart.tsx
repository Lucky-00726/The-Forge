// ─────────────────────────────────────────────────────────────
// THE FORGE — ActivityChart Component
// 7-day vertical bar chart showing activity levels
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, LetterSpacing } from '../../constants/tokens';

interface ActivityChartProps {
  days?: number;
  currentStreak: number;
  label?: string;
}

export default function ActivityChart({
  days = 7,
  currentStreak,
  label = 'LAST 7 DAYS',
}: ActivityChartProps) {
  // Generate bar heights based on streak
  // If streak >= 7, all bars are full height
  // Otherwise, show streak active bars + inactive bars
  const generateBars = () => {
    const bars: number[] = [];
    for (let i = 0; i < days; i++) {
      if (i < currentStreak && currentStreak <= days) {
        // Active streak days: varying heights for visual interest
        bars.push(0.6 + (Math.random() * 0.4)); // 60-100%
      } else if (currentStreak > days) {
        // All days active if streak > 7
        bars.push(0.7 + (Math.random() * 0.3)); // 70-100%
      } else {
        // Inactive days
        bars.push(0.2 + (Math.random() * 0.2)); // 20-40%
      }
    }
    return bars;
  };

  const bars = generateBars();
  const maxBarHeight = 48;

  return (
    <View style={styles.container}>
      <Text style={styles.label} maxFontSizeMultiplier={1}>
        {label}
      </Text>
      
      <View style={styles.barsContainer}>
        {bars.map((height, idx) => {
          const isActive = 
            (currentStreak <= days && idx < currentStreak) ||
            currentStreak > days;
          
          return (
            <View key={idx} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: height * maxBarHeight,
                    backgroundColor: isActive 
                      ? Colors.success 
                      : Colors.bgHighest,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {currentStreak > 0 && (
        <Text style={styles.status} maxFontSizeMultiplier={1}>
          MAINTAINED: OPTIMAL PERFORMANCE
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
    textAlign:     'center',
  },
  barsContainer: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    height:         48,
    gap:            Spacing.xs - 2,
  },
  barWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width:        '100%',
    borderRadius: Radius.xs,
    minHeight:    4,
  },
  status: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.success,
    letterSpacing: LetterSpacing.wide,
    textAlign:     'center',
  },
});
