import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Alert, Appearance, Platform, useColorScheme } from "react-native";

export type Entry = {
  id: string;
  type: "income" | "expense";
  title: string;
  amount: number;
  createdAt: number;
  date?: string; // YYYY-MM-DD
};

export type EntryInput = {
  type: "income" | "expense";
  title: string;
  amount: number;
  date: string;
};

export type ThemeChoice = "system" | "light" | "dark";

const ENTRIES_KEY = "budget-entries-v1";
const CURRENCY_KEY = "budget-currency-v1";
const THEME_KEY = "budget-theme-v1";

export const LIGHT = {
  bg: "#F2F5F7",
  ink: "#14202B",
  onInk: "#FFFFFF",
  muted: "#7B8794",
  card: "#FFFFFF",
  line: "#DDE3E8",
  income: "#1B7F5C",
  expense: "#B4234A",
  onFill: "#FFFFFF",
};

export const DARK: typeof LIGHT = {
  bg: "#0F161D",
  ink: "#E8EEF3",
  onInk: "#0F161D",
  muted: "#8A97A5",
  card: "#18222C",
  line: "#2A3846",
  income: "#3DBE92",
  expense: "#F2698A",
  onFill: "#0B1218",
};

export type Palette = typeof LIGHT;

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
];

export const pad = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isValidDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateStr(new Date(s + "T00:00:00")) === s;
export const entryDate = (e: Entry) => e.date ?? toDateStr(new Date(e.createdAt));
export const showDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
  entries: Entry[];
  sorted: Entry[];
  totals: { income: number; expense: number; balance: number };
  currency: string; // currency code, e.g. "USD"
  setCurrency: (code: string) => void;
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  isDark: boolean;
  colors: Palette;
  money: (n: number) => string;
  addEntry: (input: EntryInput) => void;
  updateEntry: (id: string, input: EntryInput) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [loaded, setLoaded] = useState(false);
  const system = useColorScheme();

  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  const colors = isDark ? DARK : LIGHT;

  // Load saved data once
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ENTRIES_KEY),
      AsyncStorage.getItem(CURRENCY_KEY),
      AsyncStorage.getItem(THEME_KEY),
    ])
      .then(([rawEntries, rawCurrency, rawTheme]) => {
        if (rawEntries) setEntries(JSON.parse(rawEntries));
        // Accepts a saved code ("PHP") or an older saved symbol ("₱")
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
    if (loaded) AsyncStorage.setItem(CURRENCY_KEY, currency).catch(() => {});
  }, [currency, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
    // Also makes keyboards and system alerts match your choice (not available on web)
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(theme === "system" ? null : theme);
    }
  }, [theme, loaded]);

  const totals = useMemo(() => {
    const income = entries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
    const expense = entries
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => entryDate(b).localeCompare(entryDate(a)) || b.createdAt - a.createdAt
      ),
    [entries]
  );

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";
  const money = (n: number) =>
    `${symbol}${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const value: BudgetContextValue = {
    entries,
    sorted,
    totals,
    currency,
    setCurrency,
    theme,
    setTheme,
    isDark,
    colors,
    money,
    addEntry: (input) =>
      setEntries((list) => [
        { id: Date.now().toString(), createdAt: Date.now(), ...input },
        ...list,
      ]),
    updateEntry: (id, input) =>
      setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...input } : e))),
    deleteEntry: (id) => setEntries((list) => list.filter((e) => e.id !== id)),
    clearAll: () => setEntries([]),
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}