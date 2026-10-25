import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ComponentProps } from "react";
import { ColorValue, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBudget } from "../../lib/budget";

type IconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  focused,
  color,
  active,
  inactive,
  pill,
}: {
  focused: boolean;
  color: ColorValue;
  active: IconName;
  inactive: IconName;
  pill: string;
}) {
  return (
    <View
      style={{
        width: 60,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? pill : "transparent",
      }}
    >
      <Ionicons name={focused ? active : inactive} size={24} color={color as any} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors: C } = useBudget();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: 66 + bottom,
          paddingTop: 8,
          paddingBottom: bottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              active="home"
              inactive="home-outline"
              pill={C.highlight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              active="swap-vertical"
              inactive="swap-vertical-outline"
              pill={C.highlight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              active="settings"
              inactive="settings-outline"
              pill={C.highlight}
            />
          ),
        }}
      />
    </Tabs>
  );
}