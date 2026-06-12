// ─────────────────────────────────────────────────────────────
// THE FORGE — Tab Navigator
// app/(tabs)/_layout.tsx
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Fonts, FontSizes } from '../../src/constants/tokens';

function TabIcon({
  glyph,
  label,
  focused,
}: {
  glyph:   string;
  label:   string;
  focused: boolean;
}) {
  const color = focused ? Colors.primary : Colors.textTertiary;
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.glyph, { color }]} maxFontSizeMultiplier={1}>
        {glyph}
      </Text>
      <Text style={[styles.iconLabel, { color }]} maxFontSizeMultiplier={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             styles.tabBar,
        tabBarShowLabel:         false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="⌂" label="HOME" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="▣" label="DOSSIER" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgSurface,
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  Colors.outlineVar,
    height:          Platform.OS === 'ios' ? 84 : 62,
    paddingBottom:   Platform.OS === 'ios' ? 24 : 4,
    paddingTop:      8,
    elevation:       0,
    shadowOpacity:   0,
  },
  iconWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
    paddingTop:     2,
  },
  glyph: {
    fontSize:   18,
    lineHeight: 22,
  },
  iconLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      7,
    letterSpacing: 0.8,
  },
});
