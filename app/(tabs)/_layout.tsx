import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="SummaryScreen"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="graph-pie" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="receiptScreen"
        options={{
          title: 'Receipt',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="receipt-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'photograph',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
