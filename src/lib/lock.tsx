import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
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
import { AppState, Platform } from "react-native";
import { useBudget } from "./budget";

export const PIN_LENGTH = 4;
const LOCK_AFTER_MS = 30_000; // ask for the PIN again after 30 seconds away
const MAX_TRIES = 5;
const COOLDOWN_MS = 30_000;

const PIN_KEY = "budget-pin-v1";
const BIO_KEY = "budget-lock-biometric-v1";
const FAIL_KEY = "budget-lock-fails-v1"; // "count|until"

// The PIN lives in the phone's secure storage (the browser preview falls back to normal storage)
const secureGet = (k: string) =>
  Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k);
const secureSet = (k: string, v: string) =>
  Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
const secureDel = (k: string) =>
  Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k);

async function hasBiometrics() {
  if (Platform.OS === "web") return false;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

async function authenticate(promptMessage: string) {
  if (Platform.OS === "web") return false;
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      disableDeviceFallback: true,
    });
    return r.success;
  } catch {
    return false;
  }
}

type VerifyResult = { ok: boolean; message: string };

type LockValue = {
  ready: boolean;
  enabled: boolean; // a PIN is set
  locked: boolean;
  covered: boolean; // app is in the background: hide the contents
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  lockedOutUntil: number; // ms timestamp, 0 if none
  verifyPin: (pin: string) => Promise<VerifyResult>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  unlock: () => void;
  setBiometricEnabled: (on: boolean) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  eraseAndUnlock: () => Promise<void>;
};

const LockContext = createContext<LockValue | null>(null);

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock must be used inside LockProvider");
  return ctx;
}

export function LockProvider({ children }: { children: ReactNode }) {
  const { clearAll } = useBudget();
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [lockedOutUntil, setLockedOutUntil] = useState(0);

  const enabledRef = useRef(false);
  const failsRef = useRef(0);
  const untilRef = useRef(0);
  const leftAt = useRef<number | null>(null);

  // Start up: is there a PIN? If so, begin locked
  useEffect(() => {
    (async () => {
      try {
        const [pin, bio, fails] = await Promise.all([
          secureGet(PIN_KEY).catch(() => null),
          AsyncStorage.getItem(BIO_KEY).catch(() => null),
          secureGet(FAIL_KEY).catch(() => null),
        ]);
        const has = !!pin;
        enabledRef.current = has;
        setEnabled(has);
        setLocked(has);
        setBiometricEnabledState(has && bio === "1");
        if (fails) {
          const [c, u] = fails.split("|").map(Number);
          failsRef.current = c || 0;
          untilRef.current = u || 0;
          setLockedOutUntil(u > Date.now() ? u : 0);
        }
        setBiometricAvailable(await hasBiometrics());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Lock again after time away, and hide the contents while in the background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setInactive(state !== "active");
      if (state === "background") leftAt.current = Date.now();
      if (state === "active") {
        const away = leftAt.current ? Date.now() - leftAt.current : 0;
        leftAt.current = null;
        if (enabledRef.current && away > LOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const saveFails = useCallback((count: number, until: number) => {
    failsRef.current = count;
    untilRef.current = until;
    setLockedOutUntil(until > Date.now() ? until : 0);
    secureSet(FAIL_KEY, `${count}|${until}`).catch(() => {});
  }, []);

  const verifyPin = useCallback(
    async (pin: string): Promise<VerifyResult> => {
      const wait = untilRef.current - Date.now();
      if (wait > 0) {
        return {
          ok: false,
          message: `Too many attempts. Try again in ${Math.ceil(wait / 1000)}s.`,
        };
      }
      let saved: string | null = null;
      try {
        saved = await secureGet(PIN_KEY);
      } catch {}
      if (saved && saved === pin) {
        saveFails(0, 0);
        return { ok: true, message: "" };
      }
      const count = failsRef.current + 1;
      if (count >= MAX_TRIES) {
        saveFails(0, Date.now() + COOLDOWN_MS);
        return {
          ok: false,
          message: `Too many attempts. Try again in ${COOLDOWN_MS / 1000}s.`,
        };
      }
      saveFails(count, 0);
      const left = MAX_TRIES - count;
      return {
        ok: false,
        message: `Incorrect PIN. ${left} ${left === 1 ? "try" : "tries"} left.`,
      };
    },
    [saveFails]
  );

  const setPin = useCallback(
    async (pin: string) => {
      await secureSet(PIN_KEY, pin);
      saveFails(0, 0);
      enabledRef.current = true;
      setEnabled(true);
    },
    [saveFails]
  );

  const removePin = useCallback(async () => {
    await secureDel(PIN_KEY).catch(() => {});
    await secureDel(FAIL_KEY).catch(() => {});
    AsyncStorage.removeItem(BIO_KEY).catch(() => {});
    failsRef.current = 0;
    untilRef.current = 0;
    enabledRef.current = false;
    setLockedOutUntil(0);
    setEnabled(false);
    setLocked(false);
    setBiometricEnabledState(false);
  }, []);

  const unlock = useCallback(() => setLocked(false), []);

  const setBiometricEnabled = useCallback(async (on: boolean) => {
    if (on) {
      const ok = await authenticate("Confirm to turn on biometric unlock");
      if (!ok) return false;
    }
    setBiometricEnabledState(on);
    AsyncStorage.setItem(BIO_KEY, on ? "1" : "0").catch(() => {});
    return true;
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    if (!biometricEnabled) return false;
    const ok = await authenticate("Unlock your budget");
    if (ok) setLocked(false);
    return ok;
  }, [biometricEnabled]);

  // Forgot the PIN: the only way back in is to erase the entries on this device
  const eraseAndUnlock = useCallback(async () => {
    clearAll();
    await removePin();
  }, [clearAll, removePin]);

  const value = useMemo<LockValue>(
    () => ({
      ready,
      enabled,
      locked,
      covered: enabled && inactive,
      biometricAvailable,
      biometricEnabled,
      lockedOutUntil,
      verifyPin,
      setPin,
      removePin,
      unlock,
      setBiometricEnabled,
      unlockWithBiometrics,
      eraseAndUnlock,
    }),
    [
      ready,
      enabled,
      locked,
      inactive,
      biometricAvailable,
      biometricEnabled,
      lockedOutUntil,
      verifyPin,
      setPin,
      removePin,
      unlock,
      setBiometricEnabled,
      unlockWithBiometrics,
      eraseAndUnlock,
    ]
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}