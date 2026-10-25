import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Appearance, Platform, useColorScheme } from "react-native";

export type Entry = {
  id: string;
  type: "income" | "expense";
  title: string; // optional: may be empty
  amount: number;
  createdAt: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm (24h)
  tagId?: string; // optional
};

export type EntryInput = {
  type: "income" | "expense";
  title: string;
  amount: number;
  date: string;
  time: string;
  tagId?: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  kind: "income" | "expense";
};
export type TagInput = Omit<Tag, "id">;

export type ThemeChoice = "system" | "light" | "dark";

const ENTRIES_KEY = "budget-entries-v1";
const CURRENCY_KEY = "budget-currency-v1";
const THEME_KEY = "budget-theme-v1";
const TAGS_KEY = "budget-tags-v1";

export const LIGHT = {
  bg: "#F4F6F8",
  ink: "#101B26",
  onInk: "#FFFFFF",
  muted: "#6B7785",
  card: "#FFFFFF",
  line: "#E3E8ED",
  income: "#17805F",
  expense: "#C0264F",
  onFill: "#FFFFFF",
  incomeSoft: "#E3F4EC",
  expenseSoft: "#FBE6EC",
  heroBg: "#101B26",
  heroText: "#FFFFFF",
  heroMuted: "#9FB0C0",
  heroIncome: "#5FD3A8",
  heroExpense: "#FF8DA9",
  highlight: "#EAEFF3",
};

export const DARK: typeof LIGHT = {
  bg: "#090E13",
  ink: "#F4F8FB",
  onInk: "#090E13",
  muted: "#A7B4C1",
  card: "#17212B",
  line: "#364656",
  income: "#4FD1A5",
  expense: "#FF7C9C",
  onFill: "#08120E",
  incomeSoft: "#17402F",
  expenseSoft: "#47212F",
  heroBg: "#1F3144",
  heroText: "#FFFFFF",
  heroMuted: "#B3C2D1",
  heroIncome: "#6FE0B6",
  heroExpense: "#FF9DB5",
  highlight: "#2A3B4C",
};

export type Palette = typeof LIGHT;

export const TAG_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#EF4444",
  "#64748B",
];

export const SUGGESTED_TAGS: TagInput[] = [
  { name: "Food", kind: "expense", color: TAG_COLORS[3] },
  { name: "Groceries", kind: "expense", color: TAG_COLORS[4] },
  { name: "Transport", kind: "expense", color: TAG_COLORS[0] },
  { name: "Bills", kind: "expense", color: TAG_COLORS[6] },
  { name: "Rent", kind: "expense", color: TAG_COLORS[1] },
  { name: "Health", kind: "expense", color: TAG_COLORS[2] },
  { name: "Shopping", kind: "expense", color: TAG_COLORS[2] },
  { name: "Entertainment", kind: "expense", color: TAG_COLORS[1] },
  { name: "Education", kind: "expense", color: TAG_COLORS[5] },
  { name: "Travel", kind: "expense", color: TAG_COLORS[5] },
  { name: "Subscriptions", kind: "expense", color: TAG_COLORS[7] },
  { name: "Salary", kind: "income", color: TAG_COLORS[4] },
  { name: "Freelance", kind: "income", color: TAG_COLORS[0] },
  { name: "Bonus", kind: "income", color: TAG_COLORS[3] },
  { name: "Gift", kind: "income", color: TAG_COLORS[2] },
  { name: "Interest", kind: "income", color: TAG_COLORS[5] },
];

const DEFAULT_TAG_NAMES = ["Food", "Transport", "Bills", "Shopping", "Salary"];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const makeTag = (input: TagInput): Tag => ({ id: `t${newId()}`, ...input });

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", country: "Eurozone", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", country: "Japan", flag: "🇯🇵" },
  { code: "CNY", symbol: "CN¥", name: "Chinese Yuan", country: "China", flag: "🇨🇳" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", country: "South Korea", flag: "🇰🇷" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", flag: "🇮🇳" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", country: "Philippines", flag: "🇵🇭" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", country: "Singapore", flag: "🇸🇬" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", country: "Australia", flag: "🇦🇺" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", country: "Canada", flag: "🇨🇦" },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc", country: "Switzerland", flag: "🇨🇭" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", country: "Mexico", flag: "🇲🇽" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", country: "Brazil", flag: "🇧🇷" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", country: "Hong Kong", flag: "🇭🇰" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar", country: "Taiwan", flag: "🇹🇼" },
  { code: "THB", symbol: "฿", name: "Thai Baht", country: "Thailand", flag: "🇹🇭" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", country: "Malaysia", flag: "🇲🇾" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", country: "Indonesia", flag: "🇮🇩" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", country: "Vietnam", flag: "🇻🇳" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", country: "New Zealand", flag: "🇳🇿" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa", flag: "🇿🇦" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", country: "Turkey", flag: "🇹🇷" },
  { code: "SEK", symbol: "kr ", name: "Swedish Krona", country: "Sweden", flag: "🇸🇪" },
  { code: "NOK", symbol: "kr ", name: "Norwegian Krone", country: "Norway", flag: "🇳🇴" },
  { code: "DKK", symbol: "kr ", name: "Danish Krone", country: "Denmark", flag: "🇩🇰" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", country: "Poland", flag: "🇵🇱" },
];

export const pad = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const isValidDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateStr(new Date(s + "T00:00:00")) === s;
export const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const entryDate = (e: Entry) => e.date ?? toDateStr(new Date(e.createdAt));

// What to show as the entry's name: description, else tag, else the type
export const entryLabel = (e: Entry, tags: Map<string, Tag>) =>
  e.title.trim() ||
  (e.tagId ? tags.get(e.tagId)?.name : undefined) ||
  (e.type === "income" ? "Income" : "Expense");

// Formatters are created once and reused (much cheaper than toLocale* per row)
const numberFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateCache = new Map<string, string>();
export const showDate = (s: string) => {
  let v = dateCache.get(s);
  if (!v) {
    v = dateFmt.format(new Date(s + "T00:00:00"));
    dateCache.set(s, v);
  }
  return v;
};
export const showDateTime = (date: string, time?: string) => {
  if (!time) return showDate(date);
  const key = `${date} ${time}`;
  let v = dateCache.get(key);
  if (!v) {
    v = dateTimeFmt.format(new Date(`${date}T${time}:00`));
    dateCache.set(key, v);
  }
  return v;
};

// "1,250.50" -> 1250.5, "12,5" -> 12.5
export const parseAmount = (s: string) => {
  let t = s.trim();
  if (/^\d+,\d{1,2}$/.test(t)) t = t.replace(",", ".");
  else t = t.replace(/,/g, "");
  const v = parseFloat(t);
  return isFinite(v) ? v : NaN;
};

// Dialogs that also work in the browser preview
export function notify(title: string, message: string) {
  if (Platform.OS === "web") (globalThis as any).alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  if (Platform.OS === "web") {
    if ((globalThis as any).confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Keep", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
}

// Confirmation for normal (non-destructive) changes
export function confirmChange(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  if (Platform.OS === "web") {
    if ((globalThis as any).confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmText, onPress: onConfirm },
  ]);
}

type BudgetContextValue = {
  loaded: boolean;
  entries: Entry[];
  sorted: Entry[];
  totals: { income: number; expense: number; balance: number };
  tags: Tag[];
  tagMap: Map<string, Tag>;
  addTag: (input: TagInput) => void;
  updateTag: (id: string, input: TagInput) => void;
  deleteTag: (id: string) => void;
  currency: string; // currency code, e.g. "USD"
  setCurrency: (code: string) => void;
  symbol: string; // short symbol, e.g. "$"
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  isDark: boolean;
  colors: Palette;
  money: (n: number) => string;
  addEntry: (input: EntryInput) => void;
  updateEntry: (id: string, input: EntryInput) => void;
  deleteEntry: (entry: Entry) => void;
  clearAll: () => void;
  undo: Entry | null;
  undoDelete: () => void;
  dismissUndo: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [loaded, setLoaded] = useState(false);
  const [undo, setUndo] = useState<Entry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const system = useColorScheme();

  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  const colors = isDark ? DARK : LIGHT;

  // Load saved data once
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ENTRIES_KEY),
      AsyncStorage.getItem(CURRENCY_KEY),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(TAGS_KEY),
    ])
      .then(([rawEntries, rawCurrency, rawTheme, rawTags]) => {
        if (rawEntries) {
          const parsed: Entry[] = JSON.parse(rawEntries);
          // Give older entries a real date once, so sorting stays cheap
          setEntries(
            parsed.map((e) => ({
              ...e,
              title: e.title ?? "",
              date: e.date ?? toDateStr(new Date(e.createdAt)),
            }))
          );
        }
        // First run with tags: start with a few useful ones
        let loadedTags: Tag[] | null = null;
        if (rawTags) {
          try {
            loadedTags = JSON.parse(rawTags);
          } catch {}
        }
        setTags(
          loadedTags ??
            SUGGESTED_TAGS.filter((t) => DEFAULT_TAG_NAMES.includes(t.name)).map(makeTag)
        );
        const found = CURRENCIES.find(
          (c) => c.code === rawCurrency || c.symbol === rawCurrency
        );
        if (found) setCurrency(found.code);
        if (rawTheme === "system" || rawTheme === "light" || rawTheme === "dark") {
          setTheme(rawTheme);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Save when data changes (after the first load)
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)).catch(() => {});
  }, [entries, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(TAGS_KEY, JSON.stringify(tags)).catch(() => {});
  }, [tags, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CURRENCY_KEY, currency).catch(() => {});
  }, [currency, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
    // Also makes keyboards and system alerts match your choice (not available on web)
    (Appearance as any).setColorScheme?.(theme === "system" ? null : theme);
  }, [theme, loaded]);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    []
  );

  // One pass over the entries instead of several filters
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      if (e.type === "income") income += e.amount;
      else expense += e.amount;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  // Newest first: date, then time, then creation order
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          entryDate(b).localeCompare(entryDate(a)) ||
          (b.time ?? "").localeCompare(a.time ?? "") ||
          b.createdAt - a.createdAt
      ),
    [entries]
  );

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const fullSymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";
  const symbol = fullSymbol.trim();
  const money = useCallback((n: number) => fullSymbol + numberFmt.format(n), [fullSymbol]);

  const addEntry = useCallback((input: EntryInput) => {
    const entry: Entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      ...input,
    };
    setEntries((list) => [entry, ...list]);
  }, []);

  const updateEntry = useCallback((id: string, input: EntryInput) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...input } : e)));
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  }, []);

  const deleteEntry = useCallback((entry: Entry) => {
    setEntries((list) => list.filter((e) => e.id !== entry.id));
    setUndo(entry);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  }, []);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    setEntries((list) => [undo, ...list]);
    dismissUndo();
  }, [undo, dismissUndo]);

  const clearAll = useCallback(() => {
    setEntries([]);
    dismissUndo();
  }, [dismissUndo]);

  const addTag = useCallback((input: TagInput) => {
    setTags((list) => [...list, makeTag(input)]);
  }, []);

  const updateTag = useCallback((id: string, input: TagInput) => {
    setTags((list) => list.map((t) => (t.id === id ? { ...t, ...input } : t)));
    // If the tag switched between income and expense, entries of the other type lose it
    setEntries((list) =>
      list.map((e) => (e.tagId === id && e.type !== input.kind ? { ...e, tagId: undefined } : e))
    );
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((list) => list.filter((t) => t.id !== id));
    setEntries((list) => list.map((e) => (e.tagId === id ? { ...e, tagId: undefined } : e)));
  }, []);

  const value = useMemo<BudgetContextValue>(
    () => ({
      loaded,
      entries,
      sorted,
      totals,
      tags,
      tagMap,
      addTag,
      updateTag,
      deleteTag,
      currency,
      setCurrency,
      symbol,
      theme,
      setTheme,
      isDark,
      colors,
      money,
      addEntry,
      updateEntry,
      deleteEntry,
      clearAll,
      undo,
      undoDelete,
      dismissUndo,
    }),
    [
      loaded,
      entries,
      sorted,
      totals,
      tags,
      tagMap,
      addTag,
      updateTag,
      deleteTag,
      currency,
      symbol,
      theme,
      isDark,
      colors,
      money,
      addEntry,
      updateEntry,
      deleteEntry,
      clearAll,
      undo,
      undoDelete,
      dismissUndo,
    ]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}