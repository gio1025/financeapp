import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Entry,
  Palette,
  confirmAction,
  entryDate,
  isValidDate,
  notify,
  showDate,
  toDateStr,
  useBudget,
} from "../../lib/budget";

export default function Transactions() {
  const { sorted, money, addEntry, updateEntry, deleteEntry, colors: C, isDark } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [type, setType] = useState<Entry["type"]>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateStr(new Date()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const keyboard = isDark ? "dark" : "light";

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setDate(toDateStr(new Date()));
    setEditingId(null);
  };

  const save = () => {
    const value = parseFloat(amount.replace(/,/g, ""));
    if (!title.trim() || !isFinite(value) || value <= 0 || !isValidDate(date)) {
      notify("Check your entry", "Add a name, an amount above 0, and a date like 2026-10-24.");
      return;
    }
    const input = { type, title: title.trim(), amount: value, date };
    if (editingId) updateEntry(editingId, input);
    else addEntry(input);
    resetForm();
  };

  const startEdit = (e: Entry) => {
    setEditingId(e.id);
    setType(e.type);
    setTitle(e.title);
    setAmount(String(e.amount));
    setDate(entryDate(e));
  };

  const remove = (e: Entry) => {
    confirmAction("Delete entry", `Delete "${e.title}"?`, "Delete", () => {
      deleteEntry(e.id);
      if (editingId === e.id) resetForm();
    });
  };

  const header = (
    <View>
      <View style={s.form}>
        <View style={s.toggle}>
          {(["expense", "income"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                s.toggleBtn,
                type === t && { backgroundColor: t === "income" ? C.income : C.expense },
              ]}
            >
              <Text style={[s.toggleText, type === t && { color: C.onFill }]}>
                {t === "income" ? "Income" : "Expense"}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={s.input}
          placeholder={type === "income" ? "Source (e.g. Salary)" : "What for (e.g. Groceries)"}
          placeholderTextColor={C.muted}
          keyboardAppearance={keyboard}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={s.input}
          placeholder="Amount"
          placeholderTextColor={C.muted}
          keyboardAppearance={keyboard}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={s.input}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={C.muted}
          keyboardAppearance={keyboard}
          keyboardType="numbers-and-punctuation"
          value={date}
          onChangeText={setDate}
        />
        <View style={s.formActions}>
          <Pressable style={s.primaryBtn} onPress={save}>
            <Text style={s.primaryText}>{editingId ? "Save changes" : "Add entry"}</Text>
          </Pressable>
          {editingId && (
            <Pressable style={s.ghostBtn} onPress={resetForm}>
              <Text style={s.ghostText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={[s.label, { marginTop: 24, marginBottom: 8 }]}>History</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={sorted}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={s.empty}>
              No entries yet. Add your salary or your first expense above.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => startEdit(item)}>
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
              <Pressable onPress={() => remove(item)} hitSlop={10} style={s.deleteBtn}>
                <Text style={s.deleteText}>Delete</Text>
              </Pressable>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    label: { fontSize: 13, color: C.muted, fontWeight: "600" },
    form: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: C.line,
    },
    toggle: { flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 3 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
    toggleText: { fontWeight: "700", color: C.ink },
    input: {
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: C.ink,
    },
    formActions: { flexDirection: "row", gap: 10 },
    primaryBtn: {
      flex: 1,
      backgroundColor: C.ink,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    primaryText: { color: C.onInk, fontWeight: "700", fontSize: 16 },
    ghostBtn: { paddingVertical: 14, paddingHorizontal: 18, justifyContent: "center" },
    ghostText: { color: C.muted, fontWeight: "700" },
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
    deleteBtn: { paddingLeft: 6 },
    deleteText: { color: C.muted, fontSize: 12, fontWeight: "600" },
    empty: { color: C.muted, textAlign: "center", marginTop: 20, lineHeight: 20 },
  });