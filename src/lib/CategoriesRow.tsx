import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Palette, useBudget } from "./budget";

export default function CategoriesRow() {
  const { tags, colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const expense = tags.filter((t) => t.kind === "expense").length;
  const income = tags.length - expense;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
      onPress={() => router.push("/categories")}
      accessibilityRole="button"
      accessibilityLabel="Manage categories"
    >
      <View style={s.icon}>
        <Ionicons name="pricetags-outline" size={22} color={C.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Categories</Text>
        <Text style={s.sub}>
          {expense} expense · {income} income
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.muted} />
    </Pressable>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.line,
      shadowColor: "#101B26",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    icon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.highlight,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 17, fontWeight: "700", color: C.ink },
    sub: { fontSize: 14, color: C.muted, marginTop: 2 },
  });