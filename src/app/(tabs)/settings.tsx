import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CURRENCIES,
  Palette,
  confirmAction,
  confirmChange,
  useBudget
} from "../../lib/budget";
import CategoriesRow from "../../lib/CategoriesRow";
import SecurityCard from "../../lib/SecurityCard";

const THEMES = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
] as const;

export default function Settings() {
  const {
    currency,
    setCurrency,
    theme,
    setTheme,
    entries,
    clearAll,
    colors: C,
    isDark,
  } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  // Matches name, country, code, or symbol
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  const closePicker = () => {
    setPickerOpen(false);
    setQuery("");
  };

  const pickCurrency = (code: string) => {
    closePicker();
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Appearance applies instantly. Other changes ask first.</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Appearance</Text>
          <View style={s.segment}>
            {THEMES.map((t) => {
              const active = theme === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTheme(t.key)}
                  style={[s.segBtn, active && s.segBtnActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={t.icon} size={18} color={active ? C.onInk : C.ink} />
                  <Text style={[s.segText, active && { color: C.onInk }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Currency</Text>
          <Pressable
            style={s.currencyField}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
          >
            <Text style={s.flag}>{current.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.currencyName}>{current.name}</Text>
              <Text style={s.currencySub}>
                {current.country}, {current.code}
              </Text>
            </View>
            <Text style={s.symbol}>{current.symbol.trim()}</Text>
            <Ionicons name="chevron-down" size={20} color={C.muted} />
          </Pressable>
        </View>

        <CategoriesRow />
        <SecurityCard />

        <View style={s.card}>
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
            <Ionicons name="trash-outline" size={18} color={C.expense} />
            <Text style={s.dangerText}>Delete all entries</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={s.backdrop} onPress={closePicker}>
            <Pressable style={s.sheet} onPress={() => {}}>
              <View style={s.grabber} />
              <View style={s.sheetHead}>
                <Text style={s.sheetTitle}>Choose currency</Text>
                <Pressable onPress={closePicker} hitSlop={12} accessibilityLabel="Close">
                  <Ionicons name="close" size={26} color={C.muted} />
                </Pressable>
              </View>

              <View style={s.search}>
                <Ionicons name="search" size={20} color={C.muted} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search currency, country, or code"
                  placeholderTextColor={C.muted}
                  keyboardAppearance={isDark ? "dark" : "light"}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={20} color={C.muted} />
                  </Pressable>
                )}
              </View>

              <FlatList
                style={{ flex: 1 }}
                data={results}
                keyExtractor={(c) => c.code}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                  <View style={s.emptyWrap}>
                    <Ionicons name="search-outline" size={36} color={C.muted} />
                    <Text style={s.emptyText}>No currency found for “{query.trim()}”.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const active = item.code === currency;
                  return (
                    <Pressable
                      onPress={() => pickCurrency(item.code)}
                      style={[s.currencyRow, active && { backgroundColor: C.highlight }]}
                    >
                      <Text style={s.flag}>{item.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.currencyName}>{item.name}</Text>
                        <Text style={s.currencySub}>
                          {item.country}, {item.code}
                        </Text>
                      </View>
                      <Text style={s.symbol}>{item.symbol.trim()}</Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={24} color={C.income} />
                      )}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      gap: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.line,
      ...shadow,
    },
    cardTitle: { fontSize: 17, fontWeight: "700", color: C.ink },
    note: { fontSize: 15, color: C.muted, lineHeight: 22 },
    segment: {
      flexDirection: "row",
      backgroundColor: C.bg,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: C.line,
    },
    segBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
    },
    segBtnActive: { backgroundColor: C.ink },
    segText: { fontSize: 15, fontWeight: "700", color: C.ink },
    currencyField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: C.line,
    },
    flag: { fontSize: 28 },
    currencyName: { fontSize: 17, fontWeight: "600", color: C.ink },
    currencySub: { fontSize: 13, color: C.muted, marginTop: 2 },
    symbol: { fontSize: 19, fontWeight: "700", color: C.ink, minWidth: 34, textAlign: "right" },
    dangerBtn: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.expense,
      alignItems: "center",
      justifyContent: "center",
    },
    dangerText: { color: C.expense, fontWeight: "700", fontSize: 16 },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      height: "80%",
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: C.line,
      paddingBottom: 20,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.muted,
      opacity: 0.6,
      marginTop: 10,
    },
    sheetHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 12,
    },
    sheetTitle: { fontSize: 19, fontWeight: "700", color: C.ink },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 14,
      height: 48,
    },
    searchInput: { flex: 1, fontSize: 17, color: C.ink, height: 48 },
    emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 20 },
    emptyText: { fontSize: 15, color: C.muted, textAlign: "center" },
  });
};