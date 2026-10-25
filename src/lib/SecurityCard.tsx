import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Palette, confirmChange, notify, useBudget } from "./budget";
import { useLock } from "./lock";

export default function SecurityCard() {
  const { colors: C } = useBudget();
  const lock = useLock();
  const router = useRouter();
  const s = useMemo(() => makeStyles(C), [C]);

  const bioLabel = Platform.OS === "ios" ? "Face ID or Touch ID" : "Fingerprint or face unlock";

  const toggleLock = () =>
    router.push({ pathname: "/pin", params: { mode: lock.enabled ? "disable" : "setup" } });

  const toggleBio = (on: boolean) => {
    confirmChange(
      on ? "Turn on biometric unlock?" : "Turn off biometric unlock?",
      on
        ? `Use ${bioLabel} to unlock. Your PIN always works too.`
        : "You'll unlock with your PIN only.",
      on ? "Turn on" : "Turn off",
      async () => {
        const ok = await lock.setBiometricEnabled(on);
        if (!ok) {
          notify(
            "Couldn't turn it on",
            "Biometric unlock isn't available here. In Expo Go on iPhone, Face ID isn't supported; it works in a full build. Your PIN still works."
          );
        }
      }
    );
  };

  const track = { false: C.line, true: C.income };

  return (
    <View style={s.card}>
      <Text style={s.title}>Security</Text>

      <View style={s.row}>
        <View style={s.icon}>
          <Ionicons name="lock-closed-outline" size={20} color={C.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>App lock</Text>
          <Text style={s.sub}>Ask for a PIN when the app opens</Text>
        </View>
        <Switch
          value={lock.enabled}
          onValueChange={toggleLock}
          trackColor={track}
          thumbColor="#FFFFFF"
          accessibilityLabel="App lock"
        />
      </View>

      {lock.enabled && (
        <>
          <Pressable
            style={[s.row, s.rowBorder]}
            onPress={() => router.push({ pathname: "/pin", params: { mode: "change" } })}
            accessibilityRole="button"
          >
            <View style={s.icon}>
              <Ionicons name="keypad-outline" size={20} color={C.ink} />
            </View>
            <Text style={[s.label, { flex: 1 }]}>Change PIN</Text>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </Pressable>

          <View style={[s.row, s.rowBorder]}>
            <View style={s.icon}>
              <Ionicons name="finger-print-outline" size={20} color={C.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Unlock with {bioLabel}</Text>
              <Text style={s.sub}>
                {lock.biometricAvailable
                  ? "Your PIN always works too"
                  : "Not set up on this device"}
              </Text>
            </View>
            <Switch
              value={lock.biometricEnabled}
              onValueChange={toggleBio}
              disabled={!lock.biometricAvailable}
              trackColor={track}
              thumbColor="#FFFFFF"
              accessibilityLabel="Biometric unlock"
            />
          </View>
        </>
      )}

      <Text style={s.note}>
        Locks when you reopen the app or after 30 seconds away. If you forget your PIN, the only
        way back in is erasing all entries.
      </Text>
    </View>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      gap: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.line,
      shadowColor: "#101B26",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    title: { fontSize: 17, fontWeight: "700", color: C.ink },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.line,
      paddingTop: 14,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.highlight,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { fontSize: 16, fontWeight: "600", color: C.ink },
    sub: { fontSize: 13, color: C.muted, marginTop: 2 },
    note: { fontSize: 13, color: C.muted, lineHeight: 19 },
  });