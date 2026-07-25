// ─────────────────────────────────────────────────────────────
// THE FORGE — RadarPulse Component
// Animated radar circle with rotating scan line and center content
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Colors, Radius } from '../../constants/tokens';

interface RadarPulseProps {
  size?: number;
  children?: React.ReactNode;
  pulseColor?: string;
}

export default function RadarPulse({
  size = 200,
  children,
  pulseColor = Colors.primary,
}: RadarPulseProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();
    return () => rotation.stop();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ring */}
      <View
        style={[
          styles.ring,
          styles.ringOuter,
          {
            width: size,
            height: size,
            borderColor: pulseColor + '33',
          },
        ]}
      />
      
      {/* Middle ring */}
      <View
        style={[
          styles.ring,
          styles.ringMiddle,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderColor: pulseColor + '44',
          },
        ]}
      />
      
      {/* Inner ring */}
      <View
        style={[
          styles.ring,
          styles.ringInner,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderColor: pulseColor + '55',
          },
        ]}
      />

      {/* Rotating scan line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            width: size,
            height: size,
            transform: [{ rotate }],
          },
        ]}
      >
        <View
          style={[
            styles.scanLineGradient,
            {
              width: size / 2,
              height: 2,
              backgroundColor: pulseColor,
            },
          ]}
        />
      </Animated.View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
  },
  ring: {
    position:     'absolute',
    borderRadius: 9999,
    borderWidth:  1,
  },
  ringOuter: {
    opacity: 0.6,
  },
  ringMiddle: {
    opacity: 0.7,
  },
  ringInner: {
    opacity: 0.8,
  },
  scanLine: {
    position:       'absolute',
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  scanLineGradient: {
    opacity:      0.8,
    borderRadius: Radius.xs,
  },
  centerContent: {
    zIndex:         10,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
