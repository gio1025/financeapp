import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
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
  Palette,
  SUGGESTED_TAGS,
  TAG_COLORS,
  Tag,
  confirmAction,
  confirmChange,
  useBudget,
} from "../lib/budget";

type Draft = { id: string | null; name: string; kind: Tag["kind"]; color: string };

export default function Categories() {
  const router = useRouter();
  const { tags, entries, addTag, updateTag, deleteTag, colors: C, isDark } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [kind, setKind] = useState<Tag["kind"]>("expense");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  // How many entries use each category
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) if (e.tagId) m.set(e.tagId, (m.get(e.tagId) ?? 0) + 1);
    return m;
  }, [entries]);

  const list = useMemo(() => tags.filter((t) => t.kind === kind), [tags, kind]);
  const expenseCount = tags.filter((t) => t.kind === "expense").length;
  const incomeCount = tags.length - expenseCount;

  // Suggested names you don't have yet (for the selected type)
  const suggestions = useMemo(
    () =>
      SUGGESTED_TAGS.filter(
        (sg) =>
          sg.kind === kind &&
          !tags.some((t) => t.kind === kind && t.name.toLowerCase() === sg.name.toLowerCase())
      ),
    [tags, kind]
  );

  const original = draft?.id ? tags.find((t) => t.id === draft.id) : undefined;

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const changeKind = (k: Tag["kind"]) => {
    setKind(k);
    setDraft(null);
    setError("");
  };

  const openNew = () => {
    setError("");
    setDraft({ id: null, name: "", kind, color: TAG_COLORS[list.length % TAG_COLORS.length] });
  };

  const openEdit = (t: Tag) => {
    setError("");
    setDraft({ id: t.id, name: t.name, kind: t.kind, color: t.color });
  };

  const closeEditor = () => {
    setDraft(null);
    setError("");
  };

  const save = () => {
    if (!draft) return;
    const d = draft;
    const name = d.name.trim();
    if (!name) {
      setError("Enter a category name");
      return;
    }
    const duplicate = tags.some(
      (t) => t.id !== d.id && t.kind === d.kind && t.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setError(`You already have a ${d.kind} category named “${name}”`);
      return;
    }
    const isNew = d.id === null;
    confirmChange(
      isNew ? "Add category?" : "Save changes?",
      isNew ? `Add “${name}” as ${d.kind} category?` : `Update the category “${name}”?`,
      isNew ? "Add" : "Save",
      () => {
        const input = { name, kind: d.kind, color: d.color };
        if (d.id) updateTag(d.id, input);
        else addTag(input);
        setKind(d.kind);
        closeEditor();
      }
    );
  };

  const remove = (t: Tag) => {
    const n = usage.get(t.id) ?? 0;
    confirmAction(
      "Delete category",
      n > 0
        ? `“${t.name}” is used by ${n} ${n === 1 ? "entry" : "entries"}. They stay, but lose this category.`
        : `Delete “${t.name}”?`,
      "Delete",
      () => {
        deleteTag(t.id);
        if (draft?.id === t.id) closeEditor();
      }
    );
  };

  const addSuggestion = (sg: (typeof SUGGESTED_TAGS)[number]) => {
    confirmChange("Add category?", `Add “${sg.name}” as ${sg.kind} category?`, "Add", () =>
      addTag(sg)
    );
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.top}>
          <Text style={s.title}>Categories</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
            <Text style={s.done}>Done</Text>
          </Pressable>
        </View>

        <View style={s.segmentWrap}>
          <View style={s.segment}>
            {(
              [
                { key: "expense", label: "Expenses", count: expenseCount },
                { key: "income", label: "Income", count: incomeCount },
              ] as const
            ).map((o) => {
              const active = kind === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => changeKind(o.key)}
                  style={[s.segBtn, active && s.segBtnActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.segText, active && { color: C.onInk }]}>
                    {o.label} · {o.count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
        >
          {draft && (
            <View style={s.editor}>
              <Text style={s.editorTitle}>{draft.id ? "Edit category" : "New category"}</Text>

              <View style={s.field}>
                <Text style={s.label}>Name</Text>
                <TextInput
                  style={[s.input, !!error && { borderColor: C.expense }]}
                  placeholder="e.g. Food"
                  placeholderTextColor={C.muted}
                  keyboardAppearance={isDark ? "dark" : "light"}
                  maxLength={24}
                  autoFocus
                  value={draft.name}
                  onChangeText={(name) => {
                    setDraft({ ...draft, name });
                    setError("");
                  }}
                />
                {!!error && <Text style={s.error}>{error}</Text>}
                <Text style={s.hint}>Name the category, not the shop. Food, not Starbucks.</Text>
              </View>

              <View style={s.field}>
                <Text style={s.label}>Used for</Text>
                <View style={s.miniSegment}>
                  {(["expense", "income"] as const).map((k) => {
                    const active = draft.kind === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => {
                          setDraft({ ...draft, kind: k });
                          setError("");
                        }}
                        style={[
                          s.miniBtn,
                          active && { backgroundColor: k === "income" ? C.income : C.expense },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[s.miniText, active && { color: C.onFill }]}>
                          {k === "income" ? "Income" : "Expenses"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {original && original.kind !== draft.kind && (
                  <Text style={s.hint}>
                    Entries of the other type will lose this category when you save.
                  </Text>
                )}
              </View>

              <View style={s.field}>
                <Text style={s.label}>Color</Text>
                <View style={s.swatches}>
                  {TAG_COLORS.map((c) => {
                    const active = draft.color === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setDraft({ ...draft, color: c })}
                        style={[s.swatch, { backgroundColor: c }, active && s.swatchActive]}
                        accessibilityRole="button"
                        accessibilityLabel={`Color ${c}`}
                        accessibilityState={{ selected: active }}
                      >
                        {active && <Ionicons name="checkmark" size={18} color="#fff" />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={s.actions}>
                <Pressable style={s.saveBtn} onPress={save} accessibilityRole="button">
                  <Text style={s.saveText}>{draft.id ? "Save changes" : "Add category"}</Text>
                </Pressable>
                <Pressable style={s.cancelBtn} onPress={closeEditor} accessibilityRole="button">
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={s.card}>
            {list.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="pricetags-outline" size={34} color={C.muted} />
                <Text style={s.empty}>
                  No {kind} categories yet. Add one, or pick a suggestion below.
                </Text>
              </View>
            ) : (
              list.map((t, i) => {
                const n = usage.get(t.id) ?? 0;
                return (
                  <View key={t.id} style={[s.row, i > 0 && s.rowBorder]}>
                    <View style={[s.dot, { backgroundColor: t.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={s.rowSub}>
                        {n} {n === 1 ? "entry" : "entries"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => openEdit(t)}
                      hitSlop={10}
                      accessibilityLabel={`Edit ${t.name}`}
                    >
                      <Ionicons name="create-outline" size={22} color={C.muted} />
                    </Pressable>
                    <Pressable
                      onPress={() => remove(t)}
                      hitSlop={10}
                      accessibilityLabel={`Delete ${t.name}`}
                    >
                      <Ionicons name="trash-outline" size={22} color={C.muted} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          {!draft && (
            <Pressable style={s.addBtn} onPress={openNew} accessibilityRole="button">
              <Ionicons name="add" size={22} color={C.onInk} />
              <Text style={s.addText}>Add category</Text>
            </Pressable>
          )}

          {suggestions.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={s.groupTitle}>Suggested names</Text>
              <View style={s.chips}>
                {suggestions.map((sg) => (
                  <Pressable
                    key={sg.name}
                    onPress={() => addSuggestion(sg)}
                    style={s.chip}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${sg.kind} category ${sg.name}`}
                  >
                    <View style={[s.dot, { backgroundColor: sg.color }]} />
                    <Text style={s.chipText}>{sg.name}</Text>
                    <Ionicons name="add" size={16} color={C.muted} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 30, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
    done: { fontSize: 17, fontWeight: "700", color: C.ink },
    segmentWrap: { paddingHorizontal: 20 },
    segment: {
      flexDirection: "row",
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: C.line,
    },
    segBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    segBtnActive: { backgroundColor: C.ink },
    segText: { fontSize: 15, fontWeight: "700", color: C.ink },
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: C.line,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
    dot: { width: 12, height: 12, borderRadius: 6 },
    rowName: { fontSize: 17, fontWeight: "600", color: C.ink },
    rowSub: { fontSize: 13, color: C.muted, marginTop: 1 },
    emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 28 },
    empty: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22 },
    addBtn: {
      flexDirection: "row",
      gap: 6,
      backgroundColor: C.ink,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    addText: { color: C.onInk, fontWeight: "700", fontSize: 17 },
    editor: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      borderColor: C.line,
    },
    editorTitle: { fontSize: 17, fontWeight: "700", color: C.ink },
    field: { gap: 6 },
    label: { fontSize: 14, fontWeight: "600", color: C.muted },
    input: {
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      fontSize: 17,
      color: C.ink,
    },
    error: { fontSize: 13, fontWeight: "600", color: C.expense },
    hint: { fontSize: 13, color: C.muted },
    miniSegment: {
      flexDirection: "row",
      backgroundColor: C.bg,
      borderRadius: 12,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: C.line,
    },
    miniBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
    miniText: { fontSize: 15, fontWeight: "700", color: C.ink },
    swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    swatchActive: { borderWidth: 3, borderColor: C.ink },
    actions: { flexDirection: "row", gap: 10 },
    saveBtn: {
      flex: 1,
      backgroundColor: C.ink,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: "center",
    },
    saveText: { color: C.onInk, fontWeight: "700", fontSize: 16 },
    cancelBtn: { paddingVertical: 15, paddingHorizontal: 16, justifyContent: "center" },
    cancelText: { color: C.muted, fontWeight: "700", fontSize: 16 },
    groupTitle: { fontSize: 14, fontWeight: "700", color: C.muted },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.card,
    },
    chipText: { fontSize: 14, fontWeight: "600", color: C.ink },
  });