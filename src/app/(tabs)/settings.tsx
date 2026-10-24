import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CURRENCIES,
  Palette,
  ThemeChoice,
  confirmAction,
  confirmChange,
  useBudget,
} from "../../lib/budget";

const THEMES = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
] as const;

export default function Settings() {
  const { currency, setCurrency, theme, setTheme, entries, clearAll, colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const changeTheme = (key: ThemeChoice, label: string) => {
    if (key === theme) return;
    confirmChange(
      "Change appearance?",
      key === "system"
        ? "Follow your device's light or dark setting?"
        : `Switch to ${label.toLowerCase()} mode?`,
      "Change",
      () => setTheme(key)
    );
  };

  const pickCurrency = (code: string) => {
    setPickerOpen(false);
    if (code === currency) return;
    const c = CURRENCIES.find((x) => x.code === code);
    if (!c) return;
    // Wait for the sheet to close so the prompt shows on top
    setTimeout(() => {
      confirmChange(
        "Change currency?",
        `Switch to ${c.name} (${c.code})? Amounts you already entered won't be converted.`,
        "Change",
        () => setCurrency(code)
      );
    }, 350);
  };

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.title}>Settings</Text>

        <View style={[s.card, s.cardPad]}>
          <Text style={s.cardTitle}>Appearance</Text>
          <View style={s.segment}>
            {THEMES.map((t) => {
              const active = theme === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => changeTheme(t.key, t.label)}
                  style={[s.segBtn, active && s.segBtnActive]}
                >
                  <Ionicons name={t.icon} size={18} color={active ? C.onInk : C.ink} />
                  <Text style={[s.segText, active && { color: C.onInk }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[s.card, s.cardPad]}>
          <Text style={s.cardTitle}>Currency</Text>
          <Pressable style={s.currencyField} onPress={() => setPickerOpen(true)}>
            <Text style={s.flag}>{current.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.currencyName}>{current.name}</Text>
              <Text style={s.currencySub}>
                {current.country}, {current.code}
              </Text>
            </View>
            <Text style={s.symbol}>{current.symbol.trim()}</Text>
            <Ionicons name="chevron-down" size={18} color={C.muted} />
          </Pressable>
        </View>

        <View style={[s.card, s.cardPad]}>
          <Text style={s.cardTitle}>Your data</Text>
          <Text style={s.note}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"} saved on this device
            only.
          </Text>
          <Pressable
            style={s.dangerBtn}
            onPress={() =>
              confirmAction(
                "Delete all entries",
                "This removes every entry and can't be undone.",
                "Delete all",
                clearAll
              )
            }
          >
            <Text style={s.dangerText}>Delete all entries</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.grabber} />
            <View style={s.sheetHead}>
              <Text style={s.cardTitle}>Choose currency</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={C.muted} />
              </Pressable>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => {
                const active = item.code === currency;
                return (
                  <Pressable
                    onPress={() => pickCurrency(item.code)}
                    style={[s.currencyRow, active && { backgroundColor: C.bg }]}
                  >
                    <Text style={s.flag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.currencyName}>{item.name}</Text>
                      <Text style={s.currencySub}>
                        {item.country}, {item.code}
                      </Text>
                    </View>
                    <Text style={s.symbol}>{item.symbol.trim()}</Text>
                    {active && <Ionicons name="checkmark-circle" size={22} color={C.income} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    title: { fontSize: 32, fontWeight: "800", color: C.ink, marginBottom: 16 },
    card: {
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.line,
      marginBottom: 16,
    },
    cardPad: { padding: 16, gap: 12 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
    note: { color: C.muted, lineHeight: 20 },
    segment: { flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 3, gap: 3 },
    segBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    segBtnActive: { backgroundColor: C.ink },
    segText: { fontWeight: "700", color: C.ink },
    currencyField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: C.line,
    },
    flag: { fontSize: 26 },
    currencyName: { fontSize: 16, fontWeight: "600", color: C.ink },
    currencySub: { fontSize: 12, color: C.muted, marginTop: 2 },
    symbol: { fontSize: 18, fontWeight: "700", color: C.ink, minWidth: 32, textAlign: "right" },
    dangerBtn: {
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.expense,
      alignItems: "center",
    },
    dangerText: { color: C.expense, fontWeight: "700" },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "75%",
      paddingBottom: 28,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.line,
      marginTop: 8,
    },
    sheetHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
  });