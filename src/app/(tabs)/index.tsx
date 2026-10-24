import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Palette, entryDate, pad, showDate, useBudget } from "../../lib/budget";

export default function Home() {
  const { entries, sorted, totals, money, colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthEntries = entries.filter((e) => entryDate(e).startsWith(monthKey));
  const monthIn = monthEntries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const monthOut = monthEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.label}>Balance</Text>
        <Text style={[s.balance, totals.balance < 0 && { color: C.expense }]}>
          {money(totals.balance)}
        </Text>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.label}>Money in</Text>
            <Text style={[s.statValue, { color: C.income }]}>{money(totals.income)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.label}>Money out</Text>
            <Text style={[s.statValue, { color: C.expense }]}>{money(totals.expense)}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{monthName}</Text>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Money in</Text>
            <Text style={[s.cardValue, { color: C.income }]}>{money(monthIn)}</Text>
          </View>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Money out</Text>
            <Text style={[s.cardValue, { color: C.expense }]}>{money(monthOut)}</Text>
          </View>
          <View style={[s.cardRow, s.cardTotal]}>
            <Text style={s.cardLabel}>Saved this month</Text>
            <Text style={s.cardValue}>{money(monthIn - monthOut)}</Text>
          </View>
        </View>

        <View style={s.sectionHead}>
          <Text style={s.label}>Recent</Text>
          <Pressable onPress={() => router.push("/transactions")} hitSlop={10}>
            <Text style={s.link}>See all</Text>
          </Pressable>
        </View>

        {sorted.length === 0 ? (
          <Text style={s.empty}>
            No entries yet. Open Transactions to add your salary or your first expense.
          </Text>
        ) : (
          sorted.slice(0, 5).map((item) => (
            <View key={item.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{item.title}</Text>
                <Text style={s.rowDate}>{showDate(entryDate(item))}</Text>
              </View>
              <Text
                style={[
                  s.rowAmount,
                  { color: item.type === "income" ? C.income : C.expense },
                ]}
              >
                {item.type === "income" ? "+" : "-"}
                {money(item.amount)}
              </Text>
            </View>
          ))
        )}

        <Pressable style={s.primaryBtn} onPress={() => router.push("/transactions")}>
          <Text style={s.primaryText}>Add transaction</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    label: { fontSize: 13, color: C.muted, fontWeight: "600" },
    balance: { fontSize: 44, fontWeight: "800", color: C.ink, marginTop: 2 },
    statsRow: { flexDirection: "row", gap: 24, marginTop: 12 },
    stat: { flex: 1 },
    statValue: { fontSize: 20, fontWeight: "700", marginTop: 2 },
    card: {
      marginTop: 24,
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: C.line,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
    cardRow: { flexDirection: "row", justifyContent: "space-between" },
    cardTotal: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
    cardLabel: { color: C.muted, fontSize: 15 },
    cardValue: { fontSize: 15, fontWeight: "700", color: C.ink },
    sectionHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },
    link: { color: C.ink, fontWeight: "700", fontSize: 13 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.line,
      gap: 10,
    },
    rowTitle: { fontSize: 16, fontWeight: "600", color: C.ink },
    rowDate: { fontSize: 12, color: C.muted, marginTop: 2 },
    rowAmount: { fontSize: 16, fontWeight: "700" },
    empty: { color: C.muted, textAlign: "center", marginTop: 8, lineHeight: 20 },
    primaryBtn: {
      marginTop: 16,
      backgroundColor: C.ink,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    primaryText: { color: C.onInk, fontWeight: "700", fontSize: 16 },
  });