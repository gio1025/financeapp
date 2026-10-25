import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EntryForm from "../../lib/EntryForm";
import EntryRow from "../../lib/EntryRow";
import { Entry, Palette, useBudget } from "../../lib/budget";

type Filter = "all" | "income" | "expense";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expenses" },
];

export default function Transactions() {
  const { sorted, tags, tagMap, money, deleteEntry, colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [nonce, setNonce] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  // null = all tags, "none" = untagged, otherwise a tag id
  const [tagFilterRaw, setTagFilter] = useState<string | null>(null);
  const listRef = useRef<FlatList<Entry>>(null);

  // If the filtered tag was deleted, fall back to all tags
  const tagFilter =
    tagFilterRaw && tagFilterRaw !== "none" && !tagMap.has(tagFilterRaw) ? null : tagFilterRaw;

  const data = useMemo(
    () =>
      sorted.filter(
        (e) =>
          (filter === "all" || e.type === filter) &&
          (tagFilter === null || (tagFilter === "none" ? !e.tagId : e.tagId === tagFilter))
      ),
    [sorted, filter, tagFilter]
  );

  const visibleTags = useMemo(
    () => (filter === "all" ? tags : tags.filter((t) => t.kind === filter)),
    [tags, filter]
  );

  const changeFilter = (f: Filter) => {
    setFilter(f);
    if (tagFilter && tagFilter !== "none" && f !== "all" && tagMap.get(tagFilter)?.kind !== f) {
      setTagFilter(null);
    }
  };

  const startEdit = useCallback((e: Entry) => {
    setEditing(e);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // After adding or saving: reset the form
  const done = useCallback(() => {
    setEditing(null);
    setNonce((n) => n + 1);
  }, []);

  const remove = useCallback(
    (e: Entry) => {
      deleteEntry(e);
      setEditing((cur) => (cur?.id === e.id ? null : cur));
    },
    [deleteEntry]
  );

  const renderItem: ListRenderItem<Entry> = useCallback(
    ({ item }) => (
      <EntryRow
        item={item}
        tag={item.tagId ? tagMap.get(item.tagId) : undefined}
        C={C}
        money={money}
        onPress={startEdit}
        onDelete={remove}
      />
    ),
    [C, money, tagMap, startEdit, remove]
  );

  const header = (
    <View>
      <Text style={s.title}>Transactions</Text>
      <Text style={s.subtitle}>{editing ? "Editing an entry" : "Add money in or out"}</Text>

      <EntryForm key={editing?.id ?? `new-${nonce}`} editing={editing} onDone={done} />

      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>History</Text>
        <Text style={s.count}>
          {data.length} {data.length === 1 ? "entry" : "entries"}
        </Text>
      </View>

      <View style={s.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => changeFilter(f.key)}
              style={[s.chip, active && s.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.chipText, active && { color: C.onInk }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.tagFilters}
          style={{ marginHorizontal: -20 }}
        >
          {[
            { id: null, label: "All categories", color: undefined },
            { id: "none", label: "Uncategorized", color: undefined },
            ...visibleTags.map((t) => ({ id: t.id, label: t.name, color: t.color })),
          ].map((t) => {
            const active = tagFilter === t.id;
            return (
              <Pressable
                key={t.id ?? "all"}
                onPress={() => setTagFilter(t.id)}
                style={[s.chip, active && s.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {t.color && <View style={[s.dot, { backgroundColor: t.color }]} />}
                <Text style={[s.chipText, active && { color: C.onInk }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={9}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color={C.muted} />
              <Text style={s.empty}>
                {sorted.length > 0
                  ? "No entries match these filters."
                  : "No entries yet. Add your salary or your first expense above."}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    title: { fontSize: 30, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: C.muted, marginTop: 2, marginBottom: 20 },
    sectionHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 19, fontWeight: "700", color: C.ink },
    count: { fontSize: 14, color: C.muted },
    filters: { flexDirection: "row", gap: 8, marginBottom: 10 },
    tagFilters: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 14 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.card,
    },
    chipActive: { backgroundColor: C.ink, borderColor: C.ink },
    chipText: { fontSize: 14, fontWeight: "600", color: C.ink },
    dot: { width: 10, height: 10, borderRadius: 5 },
    emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 24 },
    empty: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22 },
  });