import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Palette, isValidDate, isValidTime, pad, showDate, toDateStr, useBudget } from "./budget";

type Styles = ReturnType<typeof makeStyles>;

const ITEM = 44;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: "short" })
);

// 12-hour or 24-hour, following the phone's setting
const IS_12H = (() => {
  try {
    return !!new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  } catch {
    return false;
  }
})();
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/* ---------- shared bottom sheet ---------- */

function Sheet({
  visible,
  onClose,
  title,
  C,
  s,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  C: Palette;
  s: Styles;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.grabber} />
          <View style={s.head}>
            <Text style={s.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={C.muted} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------- date ---------- */

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "months">("days");
  const [view, setView] = useState({ y: 2000, m: 0 });

  const valid = isValidDate(value);
  const today = toDateStr(new Date());

  const openPicker = () => {
    const base = valid ? new Date(value + "T00:00:00") : new Date();
    setView({ y: base.getFullYear(), m: base.getMonth() });
    setMode("days");
    setOpen(true);
  };

  const shift = (d: number) =>
    setView((v) => {
      const t = v.y * 12 + v.m + d;
      return { y: Math.floor(t / 12), m: t % 12 };
    });

  const weeks = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const count = new Date(view.y, view.m + 1, 0).getDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  }, [view]);

  const monthTitle = new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const selected = valid ? new Date(value + "T00:00:00") : null;

  const pick = (ds: string) => {
    onChange(ds);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={s.field}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`Choose date, currently ${valid ? showDate(value) : "none"}`}
      >
        <Text style={[s.fieldText, !valid && { color: C.muted }]} numberOfLines={1}>
          {valid ? showDate(value) : "Select date"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={C.muted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Select date" C={C} s={s}>
        {mode === "days" ? (
          <View>
            <View style={s.calHead}>
              <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityLabel="Previous month">
                <Ionicons name="chevron-back" size={24} color={C.ink} />
              </Pressable>
              <Pressable onPress={() => setMode("months")} style={s.monthBtn}>
                <Text style={s.monthTitle}>{monthTitle}</Text>
                <Ionicons name="chevron-down" size={16} color={C.muted} />
              </Pressable>
              <Pressable onPress={() => shift(1)} hitSlop={12} accessibilityLabel="Next month">
                <Ionicons name="chevron-forward" size={24} color={C.ink} />
              </Pressable>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={s.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            {weeks.map((wk, wi) => (
              <View key={wi} style={s.weekRow}>
                {wk.map((d, di) => {
                  if (d === null) return <View key={di} style={s.cell} />;
                  const ds = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
                  const isSel = ds === value;
                  const isToday = ds === today;
                  return (
                    <Pressable
                      key={di}
                      style={s.cell}
                      onPress={() => pick(ds)}
                      accessibilityRole="button"
                      accessibilityLabel={showDate(ds)}
                      accessibilityState={{ selected: isSel }}
                    >
                      <View
                        style={[s.dayInner, isSel && s.daySel, isToday && !isSel && s.dayToday]}
                      >
                        <Text style={[s.dayText, isSel && { color: C.onInk }]}>{d}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <Pressable style={s.ghostBtn} onPress={() => pick(today)} accessibilityRole="button">
              <Text style={s.ghostText}>Today</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={s.calHead}>
              <Pressable
                onPress={() => setView((v) => ({ ...v, y: v.y - 1 }))}
                hitSlop={12}
                accessibilityLabel="Previous year"
              >
                <Ionicons name="chevron-back" size={24} color={C.ink} />
              </Pressable>
              <Text style={s.monthTitle}>{view.y}</Text>
              <Pressable
                onPress={() => setView((v) => ({ ...v, y: v.y + 1 }))}
                hitSlop={12}
                accessibilityLabel="Next year"
              >
                <Ionicons name="chevron-forward" size={24} color={C.ink} />
              </Pressable>
            </View>
            <View style={s.monthGrid}>
              {MONTHS.map((name, i) => {
                const isSel = !!selected && selected.getFullYear() === view.y && selected.getMonth() === i;
                return (
                  <Pressable
                    key={i}
                    style={s.monthCell}
                    onPress={() => {
                      setView((v) => ({ ...v, m: i }));
                      setMode("days");
                    }}
                    accessibilityRole="button"
                  >
                    <View style={[s.monthInner, isSel && s.daySel]}>
                      <Text style={[s.dayText, isSel && { color: C.onInk }]}>{name}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </Sheet>
    </>
  );
}

/* ---------- time ---------- */

function Column({
  items,
  selected,
  onSelect,
  s,
  flex = 1,
}: {
  items: string[];
  selected: number;
  onSelect: (i: number) => void;
  s: Styles;
  flex?: number;
}) {
  const ref = useRef<any>(null);
  const done = useRef(false);
  return (
    <ScrollView
      ref={ref}
      style={[s.col, { flex }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onLayout={() => {
        // Start with the chosen value near the middle
        if (!done.current) {
          done.current = true;
          ref.current?.scrollTo({ y: Math.max(0, selected - 2) * ITEM, animated: false });
        }
      }}
    >
      {items.map((label, i) => {
        const active = i === selected;
        return (
          <Pressable
            key={label}
            style={[s.item, active && s.itemActive]}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.itemText, active && s.itemTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const HOURS = IS_12H
  ? Array.from({ length: 12 }, (_, i) => String(i + 1))
  : Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(0); // 0-23
  const [m, setM] = useState(0);

  const valid = isValidTime(value);

  const openPicker = () => {
    const hh = valid ? parseInt(value.slice(0, 2), 10) : new Date().getHours();
    const mm = valid ? parseInt(value.slice(3, 5), 10) : new Date().getMinutes();
    setH(hh);
    setM(mm);
    setOpen(true);
  };

  const hourIndex = IS_12H ? (h % 12 || 12) - 1 : h;
  const isPM = h >= 12;

  const selectHour = (i: number) => setH(IS_12H ? ((i + 1) % 12) + (isPM ? 12 : 0) : i);
  const selectPeriod = (pm: boolean) => setH((prev) => (prev % 12) + (pm ? 12 : 0));

  const now = () => {
    const d = new Date();
    setH(d.getHours());
    setM(d.getMinutes());
  };

  const commit = () => {
    onChange(`${pad(h)}:${pad(m)}`);
    setOpen(false);
  };

  const text = valid
    ? timeFmt.format(new Date(2000, 0, 1, parseInt(value.slice(0, 2), 10), parseInt(value.slice(3, 5), 10)))
    : "Select time";

  return (
    <>
      <Pressable
        style={s.field}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`Choose time, currently ${valid ? text : "none"}`}
      >
        <Text style={[s.fieldText, !valid && { color: C.muted }]} numberOfLines={1}>
          {text}
        </Text>
        <Ionicons name="time-outline" size={20} color={C.muted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Select time" C={C} s={s}>
        <View style={s.timeCols}>
          <Column items={HOURS} selected={hourIndex} onSelect={selectHour} s={s} />
          <Text style={s.colon}>:</Text>
          <Column items={MINUTES} selected={m} onSelect={setM} s={s} />
          {IS_12H && (
            <View style={s.period}>
              {(["AM", "PM"] as const).map((p) => {
                const active = (p === "PM") === isPM;
                return (
                  <Pressable
                    key={p}
                    style={[s.item, active && s.itemActive]}
                    onPress={() => selectPeriod(p === "PM")}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[s.itemText, active && s.itemTextActive]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={s.timeActions}>
          <Pressable style={s.ghostBtn} onPress={now} accessibilityRole="button">
            <Text style={s.ghostText}>Now</Text>
          </Pressable>
          <Pressable style={s.primaryBtn} onPress={commit} accessibilityRole="button">
            <Text style={s.primaryText}>Set time</Text>
          </Pressable>
        </View>
      </Sheet>
    </>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    // field that looks like an input
    field: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
    },
    fieldText: { flex: 1, fontSize: 17, color: C.ink, fontVariant: ["tabular-nums"] },

    // sheet
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: C.line,
      paddingHorizontal: 20,
      paddingBottom: 28,
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
    head: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 14,
      paddingBottom: 12,
    },
    sheetTitle: { fontSize: 19, fontWeight: "700", color: C.ink },

    // calendar
    calHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    monthBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
    monthTitle: { fontSize: 18, fontWeight: "700", color: C.ink },
    weekRow: { flexDirection: "row" },
    weekday: {
      width: "14.2857%",
      textAlign: "center",
      fontSize: 13,
      fontWeight: "600",
      color: C.muted,
      paddingVertical: 8,
    },
    cell: {
      width: "14.2857%",
      aspectRatio: 1,
      padding: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    dayInner: {
      flex: 1,
      alignSelf: "stretch",
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    daySel: { backgroundColor: C.ink },
    dayToday: { borderWidth: 1.5, borderColor: C.ink },
    dayText: { fontSize: 16, fontWeight: "600", color: C.ink, fontVariant: ["tabular-nums"] },
    monthGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
    monthCell: { width: "33.3333%", padding: 4 },
    monthInner: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    // time
    timeCols: { flexDirection: "row", alignItems: "center", gap: 8 },
    col: { height: ITEM * 5, flexGrow: 0 },
    colon: { fontSize: 24, fontWeight: "800", color: C.ink },
    period: { width: 76, gap: 6 },
    item: {
      height: ITEM,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    itemActive: { backgroundColor: C.ink },
    itemText: { fontSize: 20, fontWeight: "600", color: C.ink, fontVariant: ["tabular-nums"] },
    itemTextActive: { color: C.onInk, fontWeight: "800" },
    timeActions: { flexDirection: "row", gap: 10, marginTop: 16 },
    primaryBtn: {
      flex: 1,
      backgroundColor: C.ink,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: "center",
    },
    primaryText: { color: C.onInk, fontWeight: "700", fontSize: 17 },
    ghostBtn: { paddingVertical: 15, paddingHorizontal: 18, alignItems: "center" },
    ghostText: { color: C.ink, fontWeight: "700", fontSize: 16 },
  });