import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BudgetProvider, useBudget } from "../lib/budget";

function ThemedStack() {
  const { isDark, colors } = useBudget();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      />
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