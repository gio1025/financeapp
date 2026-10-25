import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import UndoBar from "../lib/UndoBar";
import { BudgetProvider, useBudget } from "../lib/budget";

function ThemedStack() {
  const { isDark, colors, loaded } = useBudget();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories" options={{ presentation: "modal" }} />
      </Stack>
      <UndoBar />
      {/* Covers the screen until saved data is loaded, so nothing flashes */}
      {!loaded && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <BudgetProvider>
      <ThemedStack />
    </BudgetProvider>
  );
}