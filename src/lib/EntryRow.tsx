import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Entry, Palette, Tag, entryDate, showDateTime } from "./budget";

// Styles are built once per palette, not once per row
const cache = new WeakMap<Palette, ReturnType<typeof makeStyles>>();
const getStyles = (C: Palette) => {
  let s = cache.get(C);
  if (!s) {
    s = makeStyles(C);
    cache.set(C, s);
  }
  return s;
};

type Props = {
  item: Entry;
  tag?: Tag;
  C: Palette;
  money: (n: number) => string;
  onPress?: (e: Entry) => void;
  onDelete?: (e: Entry) => void;
};

function EntryRow({ item, tag, C, money, onPress, onDelete }: Props) {
  const s = getStyles(C);
  const isIncome = item.type === "income";
  const tint = isIncome ? C.income : C.expense;
  const hasTitle = item.title.trim().length > 0;
  const label = hasTitle ? item.title.trim() : tag?.name ?? (isIncome ? "Income" : "Expense");
  // The tag name is already the label when there's no description
  const tagPrefix = tag && hasTitle ? `${tag.name} · ` : "";
  const when = showDateTime(entryDate(item), item.time);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ? () => onPress(item) : undefined}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${isIncome ? "Income" : "Expense"} ${label}, ${money(item.amount)}`}
    >
      <View style={[s.badge, { backgroundColor: isIncome ? C.incomeSoft : C.expenseSoft }]}>
        <Ionicons name={isIncome ? "arrow-down" : "arrow-up"} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>
          {label}
        </Text>
        <View style={s.meta}>
          {tag && <View style={[s.dot, { backgroundColor: tag.color }]} />}
          <Text style={s.date} numberOfLines={1}>
            {tagPrefix}
            {when}
          </Text>
        </View>
      </View>
      <Text style={[s.amount, { color: tint }]}>
        {isIncome ? "+" : "-"}
        {money(item.amount)}
      </Text>
      {onDelete && (
        <Pressable
          onPress={() => onDelete(item)}
          hitSlop={12}
          accessibilityLabel={`Delete ${label}`}
        >
          <Ionicons name="trash-outline" size={20} color={C.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default memo(EntryRow);

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.line,
    },
    badge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 17, fontWeight: "600", color: C.ink },
    meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    date: { fontSize: 13, color: C.muted, flexShrink: 1 },
    amount: { fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  });