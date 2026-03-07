import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MoodBlob from "../../components/MoodBlob";
import { useLogs } from "../../hooks/useLogs";
import { MoodLog } from "../../types/mood";

type SimItem = {
  id: string;
  log: MoodLog;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  r: number;
  weight: number;
};

type WindVector = {
  sourceX: number;
  sourceY: number;
  dirX: number;
  dirY: number;
};

const COLLISION_PADDING = 8;
const PRE_CONTACT_BUFFER = 2;
const COLLISION_ITERATIONS = 1;
const MAX_SEPARATION_STEP = 1.2;
const NO_OVERLAP_PASSES = 4;
const BASE_VISIBLE = 24;
const HARD_MAX_VISIBLE = 96;
const MIN_SIZE_SCALE = 0.45;
const BOUNCE = 0.7;
const MAX_SPEED = 17;
const BASE_GRAVITY = 44;
const WIND_DURATION_MS = 1800;
const WIND_SOURCE_MARGIN = 22;
const WIND_BASE_STRENGTH = 2200;
const WIND_TAP_MULTIPLIER = 2.0;
const AMBIENT_DRIFT_STRENGTH = 0;
const AMBIENT_MAX_SPEED = 0;
const SHOW_PALETTE = [
  "#FF6B6B",
  "#FF9F1C",
  "#FFD166",
  "#06D6A0",
  "#4CC9F0",
  "#4361EE",
  "#3A0CA3",
  "#F72585",
  "#B8F2E6",
  "#90DBF4",
  "#A9DEF9",
  "#E4C1F9",
] as const;
const TEST_DISPLAY_MULTIPLIER = 1; // 1 = normal, >1 = pseudo load test (visual only)
const TEST_RENDER_LIMIT = 180;

export default function ShapeCloudScreen() {
  const router = useRouter();
  const { logs, recolor } = useLogs();
  const sizeScale = useMemo(() => getSizeScale(logs.length), [logs.length]);
  const visibleCount = useMemo(
    () => getVisibleCount(logs.length, sizeScale),
    [logs.length, sizeScale]
  );
  const baseItems = useMemo(() => logs.slice(0, visibleCount), [logs, visibleCount]);
  const items = useMemo(() => {
    if (TEST_DISPLAY_MULTIPLIER <= 1) return baseItems;
    const expanded: MoodLog[] = [];
    for (let i = 0; i < TEST_DISPLAY_MULTIPLIER; i += 1) {
      for (const log of baseItems) {
        if (expanded.length >= TEST_RENDER_LIMIT) break;
        expanded.push({
          ...log,
          id: `${log.id}__sim_${i}`,
          // slight variance to avoid perfect overlap in test mode
          impact: Math.max(0.05, Math.min(1, log.impact + (i % 3 - 1) * 0.03)),
        });
      }
      if (expanded.length >= TEST_RENDER_LIMIT) break;
    }
    return expanded;
  }, [baseItems]);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const [simItems, setSimItems] = useState<SimItem[]>([]);
  const recoloredRef = useRef(false);
  const [windStrength, setWindStrength] = useState(0);
  const [weightedMode, setWeightedMode] = useState(false);
  const simRef = useRef<SimItem[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const windStartRef = useRef<number | null>(null);
  const windBoostRef = useRef(1);
  const pendingWindRef = useRef(false);
  const windVectorRef = useRef<WindVector>({
    sourceX: 0,
    sourceY: 0,
    dirX: -1,
    dirY: 0,
  });

  useEffect(() => {
    if (!baseItems.length) return;
    if (recoloredRef.current) return;
    const updates = baseItems
      .map((log, index) => {
        const nextColor = pickShowColor(log.id, index);
        if (log.color_hex.toLowerCase() === nextColor.toLowerCase()) return null;
        return { id: log.id, color_hex: nextColor };
      })
      .filter(Boolean) as Array<{ id: string; color_hex: string }>;
    recoloredRef.current = true;
    if (updates.length) {
      void recolor(updates);
    }
  }, [baseItems, recolor]);

  useEffect(() => {
    if (!fieldSize.width || !fieldSize.height) return;
    const initialized = initializeItems(items, fieldSize.width, fieldSize.height, sizeScale);
    simRef.current = initialized;
    setSimItems(initialized);
  }, [items, fieldSize.width, fieldSize.height, sizeScale]);

  useEffect(() => {
    if (!simRef.current.length || !fieldSize.width || !fieldSize.height) return;

    const step = (timestamp: number) => {
      const prev = lastTimeRef.current ?? timestamp;
      const dt = Math.min(0.033, (timestamp - prev) / 1000);
      lastTimeRef.current = timestamp;

      if (pendingWindRef.current) {
        windStartRef.current = timestamp;
        pendingWindRef.current = false;
      }

      const nextWindStrength = computeWindStrength(timestamp, windStartRef.current);
      if (nextWindStrength <= 0.001) {
        windBoostRef.current = 1;
      }
      setWindStrength(nextWindStrength);

      const next = simulateStep(
        simRef.current,
        fieldSize.width,
        fieldSize.height,
        dt,
        nextWindStrength,
        windBoostRef.current,
        windVectorRef.current,
        weightedMode,
        sizeScale
      );
      simRef.current = next;
      setSimItems(next);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [fieldSize.width, fieldSize.height, weightedMode, sizeScale]);

  const onFieldLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== fieldSize.width || height !== fieldSize.height) {
      setFieldSize({ width, height });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>きもちの図形</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/protected")} style={styles.warnBtn}>
            <Text style={styles.warnText}>!</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setWeightedMode(false);
              if (fieldSize.width && fieldSize.height) {
                windVectorRef.current = pickRandomWind(fieldSize.width, fieldSize.height);
              }
              windBoostRef.current = WIND_TAP_MULTIPLIER;
              pendingWindRef.current = true;
            }}
            style={[styles.mouthBtn, !weightedMode && styles.modeActive]}
          >
            <FontAwesome6 name="kiss" size={13} color="#667080" />
          </Pressable>
          <Pressable
            onPress={() => {
              setWeightedMode(true);
              pendingWindRef.current = false;
              windStartRef.current = null;
              setWindStrength(0);
            }}
            style={[styles.mouthBtn, weightedMode && styles.modeActive]}
          >
            <FontAwesome6 name="apple-whole" size={13} color="#667080" />
          </Pressable>
          <Pressable onPress={() => router.replace("/")} style={styles.closeBtn}>
            <Text style={styles.closeText}>閉じる</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.field} onLayout={onFieldLayout}>
        {items.length === 0 ? <Text style={styles.empty}>まだ図形がありません</Text> : null}
        {simItems.map((item) => (
          <FloatingShape key={item.id} item={item} onPress={() => router.push(`/detail/${item.log.id}`)} />
        ))}
        {windStrength > 0.01 ? <WindLines wind={windVectorRef.current} strength={windStrength} /> : null}
      </View>
    </SafeAreaView>
  );
}

function FloatingShape({ item, onPress }: { item: SimItem; onPress: () => void }) {
  return (
    <View
      style={[
        styles.item,
        {
          left: item.x - item.r,
          top: item.y - item.r,
        },
      ]}
    >
      <Pressable onPress={onPress} hitSlop={8}>
        <MoodBlob color={item.log.color_hex} impact={Math.max(0.22, item.log.impact)} shape={item.log.shape} />
      </Pressable>
    </View>
  );
}

function initializeItems(logs: MoodLog[], width: number, height: number, sizeScale: number): SimItem[] {
  const placed: SimItem[] = [];
  const spacing = COLLISION_PADDING * Math.max(0.62, sizeScale);
  const cols = Math.max(1, Math.ceil(Math.sqrt((logs.length * width) / Math.max(height, 1))));
  const rows = Math.max(1, Math.ceil(logs.length / cols));
  const cellW = width / cols;
  const cellH = height / rows;

  for (let index = 0; index < logs.length; index += 1) {
    const log = logs[index];
    const r = estimateRadius(log, sizeScale);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const jitterX = cellW * 0.26;
    const jitterY = cellH * 0.26;
    let x = (col + 0.5) * cellW + randomInRange(-jitterX, jitterX);
    let y = (row + 0.5) * cellH + randomInRange(-jitterY, jitterY);
    x = Math.max(r + 4, Math.min(width - r - 4, x));
    y = Math.max(r + 4, Math.min(height - r - 4, y));
    let tries = 0;
    while (tries < 120) {
      const overlap = placed.some((p) => {
        const minDist = p.r + r + spacing;
        const dx = p.x - x;
        const dy = p.y - y;
        return dx * dx + dy * dy < minDist * minDist;
      });
      if (!overlap) break;
      x = randomInRange(r + 4, Math.max(r + 4, width - r - 4));
      y = randomInRange(r + 4, Math.max(r + 4, height - r - 4));
      tries += 1;
    }

    placed.push({
      id: log.id,
      log,
      x,
      y,
      homeX: x,
      homeY: y,
      vx: randomInRange(-3.5, 3.5),
      vy: randomInRange(-2.9, 2.9),
      r,
      weight: getWeightFromImpact(log.impact),
    });
  }
  return placed;
}

function simulateStep(
  items: SimItem[],
  width: number,
  height: number,
  dt: number,
  windStrength: number,
  windBoost: number,
  wind: WindVector,
  weightedMode: boolean,
  sizeScale: number
): SimItem[] {
  const crowdSlowdown = getCrowdSlowdown(items.length);
  const next = items.map((item) => ({
    ...item,
    x: item.x + item.vx * dt,
    y: item.y + item.vy * dt,
    vx: item.vx * (weightedMode ? 0.987 + (2.2 - item.weight) * 0.001 : 0.989) * crowdSlowdown,
    vy:
      (item.vy + (weightedMode ? BASE_GRAVITY * item.weight * dt : 0)) *
      (weightedMode ? 0.987 + (2.2 - item.weight) * 0.001 : 0.989) *
      crowdSlowdown,
  }));

  applyAmbientDrift(next, dt);
  applyWindForce(next, width, height, dt, windStrength, windBoost, wind, weightedMode);

  for (const item of next) {
    const bounce =
      (weightedMode ? getBounceForWeight(item.weight) : BOUNCE) + getSizeBounceBoost(item.r);
    if (item.x - item.r < 0) {
      item.x = item.r;
      item.vx = Math.abs(item.vx) * bounce;
    } else if (item.x + item.r > width) {
      item.x = width - item.r;
      item.vx = -Math.abs(item.vx) * bounce;
    }

    if (item.y - item.r < 0) {
      item.y = item.r;
      item.vy = Math.abs(item.vy) * bounce;
    } else if (item.y + item.r > height) {
      item.y = height - item.r;
      item.vy = -Math.abs(item.vy) * bounce;
    }
  }

  const spacing = COLLISION_PADDING * Math.max(0.62, sizeScale);
  const preContact = PRE_CONTACT_BUFFER * Math.max(0.55, sizeScale);

  for (let it = 0; it < COLLISION_ITERATIONS; it += 1) {
    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const a = next[i];
        const b = next[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.r + b.r + spacing + preContact;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const invMassA = weightedMode ? 1 / a.weight : 1;
        const invMassB = weightedMode ? 1 / b.weight : 1;
        const invMassSum = invMassA + invMassB || 1;

        // Cap per-frame separation so dense scenes don't "snap" too fast.
        const correction = Math.min(overlap * 0.6, MAX_SEPARATION_STEP);
        a.x -= nx * correction * (invMassA / invMassSum);
        a.y -= ny * correction * (invMassA / invMassSum);
        b.x += nx * correction * (invMassB / invMassSum);
        b.y += ny * correction * (invMassB / invMassSum);

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const relVel = rvx * nx + rvy * ny;
        if (relVel > 0) continue;

        const pairBounce = Math.min(
          0.9,
          BOUNCE + (getSizeBounceBoost(a.r) + getSizeBounceBoost(b.r)) * 0.5
        );
        const impulse = (-(1 + pairBounce) * relVel) / invMassSum;
        a.vx -= impulse * nx * invMassA;
        a.vy -= impulse * ny * invMassA;
        b.vx += impulse * nx * invMassB;
        b.vy += impulse * ny * invMassB;
      }
    }
  }

  enforceNoOverlap(next, width, height, spacing);

  return next;
}

function applyWindForce(
  items: SimItem[],
  width: number,
  height: number,
  dt: number,
  windStrength: number,
  windBoost: number,
  wind: WindVector,
  weightedMode: boolean
) {
  if (!windStrength) return;
  const sourceX = wind.sourceX;
  const sourceY = wind.sourceY;
  const dirX = wind.dirX;
  const dirY = wind.dirY;

  for (const item of items) {
    const dx = item.x - sourceX;
    const dy = item.y - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    if (dist > width * 1.2) continue;

    const inFront = dx * dirX + dy * dirY > 0;
    if (!inFront) continue;

    const falloff = 1 / (1 + dist * 0.012);
    const spreadBand = Math.max(0.2, 1 - perpendicularDistance(dx, dy, dirX, dirY) / (Math.min(width, height) * 0.6));
    const force = WIND_BASE_STRENGTH * windStrength * windBoost * falloff * spreadBand;
    const inverseWeight = weightedMode ? 1 / item.weight : 1;
    item.vx += dirX * force * dt * inverseWeight;
    item.vy += dirY * force * dt * inverseWeight;

    item.vy +=
      Math.sin((item.x + item.y) * 0.03) * 3.2 * windStrength * windBoost * dt * inverseWeight;

    // Allow burst wind to dominate when the mouth button is tapped.
    item.vx = Math.max(-MAX_SPEED * 6.0, Math.min(MAX_SPEED * 6.0, item.vx));
    item.vy = Math.max(-MAX_SPEED * 4.2, Math.min(MAX_SPEED * 4.2, item.vy));
  }
}

function applyAmbientDrift(items: SimItem[], dt: number) {
  if (AMBIENT_DRIFT_STRENGTH <= 0 || AMBIENT_MAX_SPEED <= 0) return;
  for (const item of items) {
    // Gentle pseudo-random flow (no violent motion).
    const t = Date.now() * 0.001;
    const fx = Math.sin(t * 0.63 + item.x * 0.012 + item.y * 0.008) * AMBIENT_DRIFT_STRENGTH;
    const fy = Math.cos(t * 0.57 + item.y * 0.011 - item.x * 0.007) * AMBIENT_DRIFT_STRENGTH * 0.9;
    // Soft pull to each item's home point keeps distribution across the whole screen.
    const restoreX = (item.homeX - item.x) * 0.45;
    const restoreY = (item.homeY - item.y) * 0.45;

    item.vx += (fx + restoreX) * dt;
    item.vy += (fy + restoreY) * dt;

    // Keep idle floating calm.
    item.vx = Math.max(-AMBIENT_MAX_SPEED, Math.min(AMBIENT_MAX_SPEED, item.vx));
    item.vy = Math.max(-AMBIENT_MAX_SPEED, Math.min(AMBIENT_MAX_SPEED, item.vy));
  }
}

function perpendicularDistance(dx: number, dy: number, dirX: number, dirY: number): number {
  return Math.abs(dx * dirY - dy * dirX);
}

function computeWindStrength(timestamp: number, windStart: number | null): number {
  if (windStart == null) return 0;
  const elapsed = timestamp - windStart;
  if (elapsed >= WIND_DURATION_MS) return 0;
  const t = elapsed / WIND_DURATION_MS;
  return Math.sin(t * Math.PI);
}

function enforceNoOverlap(items: SimItem[], width: number, height: number, spacing: number) {
  for (let pass = 0; pass < NO_OVERLAP_PASSES; pass += 1) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.r + b.r + spacing;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const invMassA = 1 / a.weight;
        const invMassB = 1 / b.weight;
        const invMassSum = invMassA + invMassB || 1;
        const correction = overlap + 0.35;
        a.x -= nx * correction * (invMassA / invMassSum);
        a.y -= ny * correction * (invMassA / invMassSum);
        b.x += nx * correction * (invMassB / invMassSum);
        b.y += ny * correction * (invMassB / invMassSum);

        // calm velocity on enforced separation to avoid re-penetration
        a.vx *= 0.92;
        a.vy *= 0.92;
        b.vx *= 0.92;
        b.vy *= 0.92;
      }
    }

    for (const item of items) {
      if (item.x - item.r < 0) item.x = item.r;
      if (item.x + item.r > width) item.x = width - item.r;
      if (item.y - item.r < 0) item.y = item.r;
      if (item.y + item.r > height) item.y = height - item.r;
    }
  }
}

function estimateRadius(log: MoodLog, sizeScale = 1): number {
  const base = 20 + log.impact * 120;
  const shape = log.shape === "cloud" || log.shape === "drop" ? "circle" : log.shape;
  if (shape === "doodle") return Math.max(base * 1.24, base * 0.88) * 0.5 * sizeScale;
  if (shape === "heart") return base * 0.5 * sizeScale;
  if (shape === "triangle") return base * 0.52 * sizeScale;
  if (shape === "lightning") return base * 0.53 * sizeScale;
  if (shape === "rain") return base * 0.56 * sizeScale;
  if (shape === "square") return base * 0.55 * sizeScale;
  if (shape === "diamond") return base * 0.55 * sizeScale;
  if (shape === "organic") return Math.max(base * 1.03, base * 0.94) * 0.5 * sizeScale;
  return base * 0.5 * sizeScale;
}

function getWeightFromImpact(impact: number): number {
  // impact large => lighter, impact small => heavier
  const clamped = Math.max(0, Math.min(1, impact));
  return 0.55 + (1 - clamped) * 1.45;
}

function getBounceForWeight(weight: number): number {
  // heavier objects bounce less
  return Math.max(0.42, Math.min(0.92, BOUNCE / Math.sqrt(weight)));
}

function getSizeBounceBoost(radius: number): number {
  // Larger blobs bounce a bit more.
  const t = Math.max(0, Math.min(1, (radius - 36) / 56));
  return t * 0.012;
}

function getCrowdSlowdown(count: number): number {
  // Denser scenes move calmer.
  if (count <= 24) return 1;
  const factor = 1 - (count - 24) * 0.004;
  return Math.max(0.62, factor);
}

function getSizeScale(totalCount: number): number {
  if (totalCount <= BASE_VISIBLE) return 1;
  const down = 1 - (totalCount - BASE_VISIBLE) * 0.007;
  return Math.max(MIN_SIZE_SCALE, down);
}

function getVisibleCount(totalCount: number, sizeScale: number): number {
  if (totalCount <= BASE_VISIBLE) return totalCount;
  const capByScale = Math.floor(BASE_VISIBLE / (sizeScale * sizeScale));
  return Math.min(HARD_MAX_VISIBLE, totalCount, Math.max(BASE_VISIBLE, capByScale));
}

function randomInRange(min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function pickShowColor(id: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const idx = (hash + index * 7) % SHOW_PALETTE.length;
  return SHOW_PALETTE[idx];
}

function pickRandomWind(width: number, height: number): WindVector {
  const presets: WindVector[] = [
    { sourceX: width - WIND_SOURCE_MARGIN, sourceY: height * 0.5, dirX: -1, dirY: 0 },
    { sourceX: WIND_SOURCE_MARGIN, sourceY: height * 0.5, dirX: 1, dirY: 0 },
    { sourceX: width * 0.5, sourceY: WIND_SOURCE_MARGIN, dirX: 0, dirY: 1 },
    { sourceX: width * 0.5, sourceY: height - WIND_SOURCE_MARGIN, dirX: 0, dirY: -1 },
    { sourceX: width - WIND_SOURCE_MARGIN, sourceY: WIND_SOURCE_MARGIN, dirX: -0.75, dirY: 0.66 },
    { sourceX: WIND_SOURCE_MARGIN, sourceY: height - WIND_SOURCE_MARGIN, dirX: 0.75, dirY: -0.66 },
    { sourceX: width - WIND_SOURCE_MARGIN, sourceY: height - WIND_SOURCE_MARGIN, dirX: -0.8, dirY: -0.6 },
    { sourceX: WIND_SOURCE_MARGIN, sourceY: WIND_SOURCE_MARGIN, dirX: 0.8, dirY: 0.6 },
  ];
  const picked = presets[Math.floor(Math.random() * presets.length)];
  const len = Math.sqrt(picked.dirX * picked.dirX + picked.dirY * picked.dirY) || 1;
  return {
    sourceX: picked.sourceX,
    sourceY: picked.sourceY,
    dirX: picked.dirX / len,
    dirY: picked.dirY / len,
  };
}

function WindLines({ wind, strength }: { wind: WindVector; strength: number }) {
  const x = wind.sourceX - 30;
  const y = wind.sourceY - 28;
  const alpha = 0.25 + strength * 0.55;
  const stretch = 1 + strength * 0.8;
  const angle = (Math.atan2(wind.dirY, wind.dirX) * 180) / Math.PI;

  return (
    <View pointerEvents="none" style={styles.windOverlay}>
      <View style={[styles.windLine, { left: x, top: y, width: 74 * stretch, opacity: alpha, transform: [{ rotate: `${angle}deg` }] }]} />
      <View style={[styles.windLine, { left: x + 8, top: y + 16, width: 62 * stretch, opacity: alpha * 0.86, transform: [{ rotate: `${angle}deg` }] }]} />
      <View style={[styles.windLine, { left: x + 4, top: y + 32, width: 54 * stretch, opacity: alpha * 0.72, transform: [{ rotate: `${angle}deg` }] }]} />
      <View style={[styles.windLine, { left: x + 10, top: y + 46, width: 42 * stretch, opacity: alpha * 0.55, transform: [{ rotate: `${angle}deg` }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "600", color: "#25303B" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  warnBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E0D5D5",
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  warnText: { color: "#A04D4D", fontWeight: "700", fontSize: 14, lineHeight: 16 },
  mouthBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9E2EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  modeActive: {
    borderColor: "#9BB2CC",
    backgroundColor: "#EEF4FB",
  },
  closeBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
  },
  closeText: { fontSize: 12, color: "#4A5561" },
  field: {
    flex: 1,
    overflow: "hidden",
  },
  empty: { alignSelf: "center", marginTop: 44, color: "#8C96A1" },
  item: {
    position: "absolute",
  },
  windOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  windLine: {
    position: "absolute",
    height: 2,
    borderRadius: 99,
    backgroundColor: "#A9B7C7",
  },
});
