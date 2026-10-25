import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { entryLabel, useBudget } from "./budget";

export default function UndoBar() {
  const { undo, undoDelete, tagMap, colors: C } = useBudget();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (undo) {
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      anim.setValue(0);
    }
  }, [undo, anim]);

  if (!undo) return null;

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          bottom: insets.bottom + 66,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <View style={[s.bar, { backgroundColor: C.ink }]}>
        <Text style={[s.msg, { color: C.onInk }]} numberOfLines={1}>
          Deleted “{entryLabel(undo, tagMap)}”
        </Text>
        <Pressable onPress={undoDelete} hitSlop={12} accessibilityRole="button">
          <Text style={[s.action, { color: C.onInk }]}>Undo</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  msg: { flex: 1, fontSize: 15, fontWeight: "500" },
  action: { fontSize: 15, fontWeight: "800", textDecorationLine: "underline" },
});