import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DateField, TimeField } from "./Pickers";
import {
  Entry,
  Palette,
  entryDate,
  parseAmount,
  toDateStr,
  toTimeStr,
  useBudget,
} from "./budget";

type Props = { editing: Entry | null; onDone: () => void };
type Errors = { amount?: string };

function EntryForm({ editing, onDone }: Props) {
  const { addEntry, updateEntry, tags, tagMap, symbol, colors: C, isDark } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const [type, setType] = useState<Entry["type"]>(editing?.type ?? "expense");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [tagId, setTagId] = useState<string | undefined>(editing?.tagId);
  const [date, setDate] = useState(editing ? entryDate(editing) : toDateStr(new Date()));
  const [time, setTime] = useState(
    editing ? editing.time ?? toTimeStr(new Date(editing.createdAt)) : toTimeStr(new Date())
  );
  const [errors, setErrors] = useState<Errors>({});

  const keyboard = isDark ? "dark" : "light";
  const tagsForType = useMemo(() => tags.filter((t) => t.kind === type), [tags, type]);

  const changeType = (t: Entry["type"]) => {
    setType(t);
    // A category only belongs to one type
    if (tagId && tagMap.get(tagId)?.kind !== t) setTagId(undefined);
  };

  const save = () => {
    const value = parseAmount(amount);
    if (!(value > 0)) {
      setErrors({ amount: "Enter an amount above 0" });
      return;
    }
    setErrors({});
    const input = { type, title: title.trim(), amount: value, date, time, tagId };
    if (editing) updateEntry(editing.id, input);
    else addEntry(input);
    onDone();
  };

  return (
    <View style={s.form}>
      <View style={s.toggle}>
        {(["expense", "income"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => changeType(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: type === t }}
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

      <View style={s.field}>
        <Text style={s.fieldLabel}>Amount</Text>
        <View style={[s.amountWrap, errors.amount && s.inputError]}>
          <Text style={s.prefix}>{symbol}</Text>
          <TextInput
            style={s.amountInput}
            placeholder="0.00"
            placeholderTextColor={C.muted}
            keyboardAppearance={keyboard}
            keyboardType="decimal-pad"
            maxLength={12}
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9.,]/g, ""));
              if (errors.amount) setErrors({});
            }}
          />
        </View>
        {!!errors.amount && <Text style={s.errorText}>{errors.amount}</Text>}
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>
          {type === "income" ? "Source" : "Description"} (optional)
        </Text>
        <TextInput
          style={s.input}
          placeholder={type === "income" ? "e.g. October salary" : "e.g. Lunch with friends"}
          placeholderTextColor={C.muted}
          keyboardAppearance={keyboard}
          returnKeyType="done"
          maxLength={60}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Category (optional)</Text>
        {/* One line that scrolls sideways */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={s.catContent}
        >
          {tagsForType.map((t) => {
            const active = tagId === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTagId(active ? undefined : t.id)}
                style={[s.chip, active && s.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[s.dot, { backgroundColor: t.color }]} />
                <Text style={[s.chipText, active && { color: C.onInk }]} numberOfLines={1}>
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => router.push("/categories")}
            style={[s.chip, s.chipNew]}
            accessibilityRole="button"
            accessibilityLabel="Add a category"
          >
            <Ionicons name="add" size={16} color={C.muted} />
            <Text style={s.chipText}>{tagsForType.length === 0 ? "Add category" : "New"}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={s.row2}>
        <View style={[s.field, { flex: 1.3 }]}>
          <Text style={s.fieldLabel}>Date</Text>
          <DateField value={date} onChange={setDate} />
        </View>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={s.fieldLabel}>Time</Text>
          <TimeField value={time} onChange={setTime} />
        </View>
      </View>

      <View style={s.formActions}>
        <Pressable style={s.primaryBtn} onPress={save} accessibilityRole="button">
          <Text style={s.primaryText}>{editing ? "Save changes" : "Add entry"}</Text>
        </Pressable>
        {editing && (
          <Pressable style={s.ghostBtn} onPress={onDone} accessibilityRole="button">
            <Text style={s.ghostText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default memo(EntryForm);

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    form: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      borderColor: C.line,
      shadowColor: "#101B26",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    toggle: {
      flexDirection: "row",
      backgroundColor: C.bg,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: C.line,
    },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    toggleText: { fontSize: 16, fontWeight: "700", color: C.ink },
    field: { gap: 6 },
    row2: { flexDirection: "row", gap: 12 },
    fieldLabel: { fontSize: 14, fontWeight: "600", color: C.muted },
    input: {
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      fontSize: 17,
      color: C.ink,
    },
    inputError: { borderColor: C.expense },
    errorText: { fontSize: 13, color: C.expense, fontWeight: "600" },
    amountWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      gap: 8,
    },
    prefix: { fontSize: 18, fontWeight: "700", color: C.muted },
    amountInput: {
      flex: 1,
      fontSize: 17,
      color: C.ink,
      height: 52,
      fontVariant: ["tabular-nums"],
    },
    catContent: { gap: 8, alignItems: "center", paddingVertical: 2 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.line,
    },
    chipActive: { backgroundColor: C.ink, borderColor: C.ink },
    chipNew: { borderStyle: "dashed", borderColor: C.muted },
    chipText: { fontSize: 14, fontWeight: "600", color: C.ink },
    dot: { width: 10, height: 10, borderRadius: 5 },
    formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    primaryBtn: {
      flex: 1,
      backgroundColor: C.ink,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    primaryText: { color: C.onInk, fontWeight: "700", fontSize: 17 },
    ghostBtn: { paddingVertical: 16, paddingHorizontal: 18, justifyContent: "center" },
    ghostText: { color: C.muted, fontWeight: "700", fontSize: 16 },
  });