import React, { useCallback, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const colorPhase = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const onTapCreate = useCallback(() => {
    // Force a fresh route instance every time to avoid stale scroll state.
    router.replace({ pathname: "/create", params: { entry: String(Date.now()) } });
  }, [router]);

  useEffect(() => {
    const makeLoop = (value: Animated.Value, up: number, down: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: up,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: down,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );

    const anim1 = makeLoop(wave1, 2200, 2100, 0);
    const anim2 = makeLoop(wave2, 2600, 2500, 420);
    const colorLoop = Animated.loop(
      Animated.timing(colorPhase, {
        toValue: 4,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim1.start();
    anim2.start();
    colorLoop.start();
    pulseLoop.start();
    return () => {
      anim1.stop();
      anim2.stop();
      colorLoop.stop();
      pulseLoop.stop();
    };
  }, [wave1, wave2, colorPhase, pulse]);

  const waveScale1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.22] });
  const waveOpacity1 = wave1.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.08] });
  const waveScale2 = wave2.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1.34] });
  const waveOpacity2 = wave2.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.04] });
  const waveColor = colorPhase.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ["#BFE8FF", "#FFE7A8", "#FFC2DC", "#C8F5B2", "#FFD1A6"],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundLayer} />

      <View style={styles.centerOverlay} pointerEvents="box-none">
        <View style={styles.ctaWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.wave,
              styles.waveA,
              {
                backgroundColor: waveColor,
                opacity: waveOpacity1,
                transform: [{ scale: waveScale1 }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.wave,
              styles.waveB,
              {
                backgroundColor: waveColor,
                opacity: waveOpacity2,
                transform: [{ scale: waveScale2 }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <Pressable onPress={onTapCreate} style={styles.ctaCircle}>
              <Text style={styles.ctaPlus}>＋</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundLayer: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  ctaWrap: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    borderRadius: 9999,
  },
  waveA: {
    width: 220,
    height: 220,
  },
  waveB: {
    width: 250,
    height: 250,
  },
  ctaCircle: {
    width: 148,
    height: 148,
    backgroundColor: "#FFF",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  ctaPlus: { fontSize: 72, lineHeight: 76, color: "#5A5A5A", marginBottom: -6 },
});
