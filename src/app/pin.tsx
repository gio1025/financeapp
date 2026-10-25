import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PinPad from "../lib/PinPad";
import { Palette, confirmChange, useBudget } from "../lib/budget";
import { PIN_LENGTH, useLock } from "../lib/lock";

type Step = "current" | "new" | "confirm";

export default function PinScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const { colors: C } = useBudget();
  const lock = useLock();
  const s = useMemo(() => makeStyles(C), [C]);

  const flow = mode === "change" ? "change" : mode === "disable" ? "disable" : "setup";
  const [step, setStep] = useState<Step>(flow === "setup" ? "new" : "current");
  const [first, setFirst] = useState("");
  const [error, setError] = useState("");

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const onComplete = async (pin: string) => {
    setError("");

    if (step === "current") {
      const res = await lock.verifyPin(pin);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (flow === "disable") {
        confirmChange(
          "Turn off app lock?",
          "Your entries will open without a PIN.",
          "Turn off",
          async () => {
            await lock.removePin();
            close();
          }
        );
        return;
      }
      setStep("new");
      return;
    }

    if (step === "new") {
      setFirst(pin);
      setStep("confirm");
      return;
    }

    // confirm
    if (pin !== first) {
      setFirst("");
      setStep("new");
      setError("PINs didn't match. Try again.");
      return;
    }
    await lock.setPin(pin);
    close();
  };

  const copy: Record<Step, { title: string; subtitle: string }> = {
    current: {
      title: "Enter your PIN",
      subtitle:
        flow === "disable"
          ? "Confirm it's you to turn off app lock"
          : "Enter your current PIN to continue",
    },
    new: { title: "Create a PIN", subtitle: `Choose ${PIN_LENGTH} digits` },
    confirm: { title: "Confirm your PIN", subtitle: "Enter it once more" },
  };

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.top}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
          <Text style={s.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <View style={s.center}>
        <PinPad
          title={copy[step].title}
          subtitle={copy[step].subtitle}
          error={error}
          onComplete={onComplete}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    top: { alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 16 },
    cancel: { fontSize: 17, fontWeight: "700", color: C.ink },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  });