import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PinPad from "./PinPad";
import { Palette, confirmAction, useBudget } from "./budget";
import { useLock } from "./lock";

export default function LockScreen() {
  const { colors: C } = useBudget();
  const lock = useLock();
  const router = useRouter();
  const s = useMemo(() => makeStyles(C), [C]);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  // Countdown while locked out
  const remaining = Math.max(0, Math.ceil((lock.lockedOutUntil - now) / 1000));
  useEffect(() => {
    if (!lock.lockedOutUntil) return;
    setNow(Date.now());
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= lock.lockedOutUntil) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [lock.lockedOutUntil]);

  // Ask for Face ID / fingerprint as soon as the lock appears
  const prompted = useRef(false);
  useEffect(() => {
    if (!lock.locked) {
      prompted.current = false;
      setError("");
      return;
    }
    // Close any open sheet so the lock screen is never hidden behind one
    try {
      (router as any).dismissAll?.();
    } catch {}
    if (lock.biometricEnabled && !prompted.current && !lock.covered) {
      prompted.current = true;
      const id = setTimeout(() => {
        lock.unlockWithBiometrics();
      }, 350);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock.locked, lock.biometricEnabled, lock.covered]);

  if (!lock.locked && !lock.covered) return null;

  // In the background (app switcher): just a plain cover
  if (!lock.locked) {
    return <View style={[StyleSheet.absoluteFill, s.cover]} pointerEvents="none" />;
  }

  const onComplete = async (pin: string) => {
    const res = await lock.verifyPin(pin);
    if (res.ok) {
      setError("");
      lock.unlock();
    } else {
      setError(res.message.startsWith("Too many") ? "" : res.message);
    }
  };

  const forgot = () =>
    confirmAction(
      "Erase everything?",
      "Without your PIN, the only way back in is to erase all entries on this device. This can't be undone.",
      "Erase all",
      () => lock.eraseAndUnlock()
    );

  const shownError = remaining > 0 ? `Too many attempts. Try again in ${remaining}s.` : error;

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, s.cover]} accessibilityViewIsModal>
      <View style={s.center}>
        <View style={s.iconCircle}>
          <Ionicons name="lock-closed" size={28} color={C.ink} />
        </View>
        <PinPad
          title="Enter your PIN"
          subtitle="Your budget is locked"
          error={shownError}
          disabled={remaining > 0}
          onComplete={onComplete}
          onBiometric={lock.biometricEnabled ? () => lock.unlockWithBiometrics() : undefined}
          footer={
            <Pressable onPress={forgot} hitSlop={12} style={s.forgot} accessibilityRole="button">
              <Text style={s.forgotText}>Forgot PIN?</Text>
            </Pressable>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    cover: { backgroundColor: C.bg, zIndex: 100, elevation: 100 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 18 },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.highlight,
      alignItems: "center",
      justifyContent: "center",
    },
    forgot: { marginTop: 22, padding: 6 },
    forgotText: { fontSize: 15, fontWeight: "600", color: C.muted, textDecorationLine: "underline" },
  });