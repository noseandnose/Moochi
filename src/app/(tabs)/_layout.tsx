import { Tabs } from 'expo-router';
import { CalendarCheck, Map, PawPrint } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

import { colors } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingTop: 8,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarAccessibilityLabel: 'Today tab',
          tabBarIcon: ({ color, focused }) => <CalendarCheck color={color} size={26} strokeWidth={focused ? 2.6 : 2} />,
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: 'My pet',
          tabBarAccessibilityLabel: 'My pet tab',
          tabBarIcon: ({ color, focused }) => <PawPrint color={color} size={26} strokeWidth={focused ? 2.6 : 2} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarAccessibilityLabel: 'Journey tab',
          tabBarIcon: ({ color, focused }) => <Map color={color} size={26} strokeWidth={focused ? 2.6 : 2} />,
        }}
      />
    </Tabs>
  );
}
