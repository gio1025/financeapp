import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Palette, useBudget } from "./budget";
import { PIN_LENGTH } from "./lock";

type Props = {
  title: string;
  subtitle?: string;
  error?: string;
  disabled?: boolean;
  onComplete: (pin: string) => void;
  onBiometric?: () => void;
  footer?: ReactNode;
};

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["bio", "0", "back"],
];

export default function PinPad({
  title,
  subtitle,
  error,
  disabled,
  onComplete,
  onBiometric,
  footer,
}: Props) {
  const { colors: C } = useBudget();
  const s = useMemo(() => makeStyles(C), [C]);
  const [pin, setPin] = useState("");
  const shake = useRef(new Animated.Value(0)).current;

  // Little shake when something is wrong
  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  const press = (d: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => setPin(""), 150);
      onComplete(next);
    }
  };

  const back = () => {
    if (!disabled) setPin((p) => p.slice(0, -1));
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>
      {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}

      <Animated.View style={[s.dots, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[s.dot, i < pin.length && s.dotFilled]} />
        ))}
      </Animated.View>

      <Text style={s.error} accessibilityLiveRegion="polite">
        {error ?? ""}
      </Text>

      <View style={s.pad}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((k) => {
              if (k === "bio") {
                return onBiometric ? (
                  <Pressable
                    key={k}
                    style={s.key}
                    onPress={onBiometric}
                    accessibilityRole="button"
                    accessibilityLabel="Unlock with biometrics"
                  >
                    <Ionicons name="finger-print" size={30} color={C.ink} />
                  </Pressable>
                ) : (
                  <View key={k} style={s.spacer} />
                );
              }
              if (k === "back") {
                return (
                  <Pressable
                    key={k}
                    style={s.keyPlain}
                    onPress={back}
                    accessibilityRole="button"
                    accessibilityLabel="Delete last digit"
                  >
                    <Ionicons name="backspace-outline" size={28} color={C.ink} />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={k}
                  style={({ pressed }) => [s.key, pressed && { backgroundColor: C.highlight }]}
                  onPress={() => press(k)}
                  accessibilityRole="button"
                  accessibilityLabel={k}
                >
                  <Text style={s.keyText}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {footer}
    </View>
  );
}

const SIZE = 76;

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    wrap: { alignItems: "center", width: "100%" },
    title: { fontSize: 26, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: C.muted, marginTop: 6, textAlign: "center" },
    dots: { flexDirection: "row", gap: 18, marginTop: 28 },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: C.ink,
    },
    dotFilled: { backgroundColor: C.ink },
    error: {
      minHeight: 22,
      marginTop: 14,
      fontSize: 14,
      fontWeight: "600",
      color: C.expense,
      textAlign: "center",
    },
    pad: { marginTop: 18, gap: 14 },
    row: { flexDirection: "row", gap: 22, justifyContent: "center" },
    key: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.line,
      alignItems: "center",
      justifyContent: "center",
    },
    keyPlain: {
      width: SIZE,
      height: SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    spacer: { width: SIZE, height: SIZE },
    keyText: { fontSize: 28, fontWeight: "600", color: C.ink, fontVariant: ["tabular-nums"] },
  });