import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import LockScreen from "../lib/LockScreen";
import UndoBar from "../lib/UndoBar";
import { BudgetProvider, useBudget } from "../lib/budget";
import { LockProvider, useLock } from "../lib/lock";

// Keep the splash screen up until saved settings are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const { isDark, colors, loaded } = useBudget();
  const { ready } = useLock();
  const all = loaded && ready;

  useEffect(() => {
    if (all) SplashScreen.hideAsync().catch(() => {});
  }, [all]);

  // Wait for saved settings and the lock state so nothing flashes
  if (!all) return null;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories" options={{ presentation: "modal" }} />
        <Stack.Screen name="pin" options={{ presentation: "modal" }} />
      </Stack>
      <UndoBar />
      <LockScreen />
    </>
  );
}

export default function RootLayout() {
  return (
    <BudgetProvider>
      <LockProvider>
        <ThemedStack />
      </LockProvider>
    </BudgetProvider>
  );
}