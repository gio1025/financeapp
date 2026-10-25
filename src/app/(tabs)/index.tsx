import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EntryRow from "../../lib/EntryRow";
import { Palette, entryDate, toDateStr, useBudget } from "../../lib/budget";

export default function Home() {
  const { sorted, totals, money, tagMap, colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dateLine = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // This month's totals in a single pass
  const month = useMemo(() => {
    const key = toDateStr(new Date()).slice(0, 7);
    let income = 0;
    let expense = 0;
    for (const e of sorted) {
      if (!entryDate(e).startsWith(key)) continue;
      if (e.type === "income") income += e.amount;
      else expense += e.amount;
    }
    return { income, expense };
  }, [sorted]);

  const recent = useMemo(() => sorted.slice(0, 5), [sorted]);

  const spentShare =
    month.income > 0 ? Math.min(month.expense / month.income, 1) : month.expense > 0 ? 1 : 0;
  const pct = Math.round(spentShare * 100);
  const saved = month.income - month.expense;

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.title}>Overview</Text>
        <Text style={s.subtitle}>{dateLine}</Text>

        <View style={s.hero}>
          <Text style={s.heroLabel}>Total balance</Text>
          <Text
            style={[s.heroBalance, totals.balance < 0 && { color: C.heroExpense }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {money(totals.balance)}
          </Text>
          <View style={s.pills}>
            <View style={s.pill}>
              <View style={s.pillTop}>
                <Ionicons name="arrow-down-circle" size={18} color={C.heroIncome} />
                <Text style={s.pillLabel}>Money in</Text>
              </View>
              <Text
                style={[s.pillValue, { color: C.heroIncome }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {money(totals.income)}
              </Text>
            </View>
            <View style={s.pill}>
              <View style={s.pillTop}>
                <Ionicons name="arrow-up-circle" size={18} color={C.heroExpense} />
                <Text style={s.pillLabel}>Money out</Text>
              </View>
              <Text
                style={[s.pillValue, { color: C.heroExpense }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {money(totals.expense)}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>{monthName}</Text>
            <Text style={s.cardMeta}>
              {month.income > 0 ? `${pct}% of income spent` : "No income yet"}
            </Text>
          </View>
          <Text style={[s.saved, saved < 0 && { color: C.expense }]}>{money(saved)}</Text>
          <Text style={s.cardMeta}>Saved this month</Text>
          <View style={s.track}>
            <View style={[s.fill, { width: `${pct}%` as `${number}%` }]} />
          </View>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Money in</Text>
            <Text style={[s.cardValue, { color: C.income }]}>{money(month.income)}</Text>
          </View>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Money out</Text>
            <Text style={[s.cardValue, { color: C.expense }]}>{money(month.expense)}</Text>
          </View>
        </View>

        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Recent</Text>
          <Pressable onPress={() => router.push("/transactions")} hitSlop={10}>
            <Text style={s.link}>See all</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <Text style={s.empty}>
            No entries yet. Open Transactions to add your salary or your first expense.
          </Text>
        ) : (
          recent.map((item) => (
            <EntryRow
              key={item.id}
              item={item}
              tag={item.tagId ? tagMap.get(item.tagId) : undefined}
              C={C}
              money={money}
            />
          ))
        )}

        <Pressable
          style={s.primaryBtn}
          onPress={() => router.push("/transactions")}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={C.onInk} />
          <Text style={s.primaryText}>Add transaction</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) => {
  const shadow = {
    shadowColor: "#101B26",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    title: { fontSize: 30, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: C.muted, marginTop: 2, marginBottom: 20 },
    hero: { backgroundColor: C.heroBg, borderRadius: 24, padding: 22, ...shadow },
    heroLabel: { fontSize: 15, color: C.heroMuted, fontWeight: "600" },
    heroBalance: {
      fontSize: 44,
      fontWeight: "800",
      color: C.heroText,
      marginTop: 6,
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    pills: { flexDirection: "row", gap: 12, marginTop: 20 },
    pill: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 14,
      gap: 8,
    },
    pillTop: { flexDirection: "row", alignItems: "center", gap: 6 },
    pillLabel: { fontSize: 14, color: C.heroMuted, fontWeight: "600" },
    pillValue: { fontSize: 19, fontWeight: "700", fontVariant: ["tabular-nums"] },
    card: {
      marginTop: 16,
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.line,
      ...shadow,
    },
    cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardTitle: { fontSize: 17, fontWeight: "700", color: C.ink },
    cardMeta: { fontSize: 14, color: C.muted },
    saved: {
      fontSize: 30,
      fontWeight: "800",
      color: C.ink,
      marginTop: 10,
      letterSpacing: -0.5,
      fontVariant: ["tabular-nums"],
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: C.bg,
      marginTop: 16,
      overflow: "hidden",
    },
    fill: { height: 8, borderRadius: 4, backgroundColor: C.expense },
    cardRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    cardLabel: { fontSize: 16, color: C.muted },
    cardValue: { fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
    sectionHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 19, fontWeight: "700", color: C.ink },
    link: { fontSize: 15, fontWeight: "700", color: C.ink },
    empty: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22 },
    primaryBtn: {
      marginTop: 18,
      flexDirection: "row",
      gap: 6,
      backgroundColor: C.ink,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { color: C.onInk, fontWeight: "700", fontSize: 17 },
  });
};