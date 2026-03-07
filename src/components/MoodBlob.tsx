import React from "react";
import { StyleSheet, View } from "react-native";
import { toBlobStyle } from "../lib/impact";
import { MoodShape } from "../types/mood";

type Props = {
  color: string;
  impact: number;
  shape?: MoodShape;
};

export default function MoodBlob({ color, impact, shape = "circle" }: Props) {
  const resolvedShape: MoodShape = shape === "cloud" || shape === "drop" ? "circle" : shape;
  const blob = toBlobStyle(impact);
  const shapeConfig = getShapeConfig(resolvedShape, blob.diameter, blob.distortion, impact);
  const baseRotate = `${impact * 17 + shapeConfig.extraRotateDeg}deg`;

  if (resolvedShape === "heart") {
    const s = blob.diameter;
    return (
      <View style={[styles.base, { width: s, height: s, opacity: blob.opacity, transform: [{ rotate: baseRotate }] }]}>
        <View style={[styles.heartLobe, { width: s * 0.5, height: s * 0.5, borderRadius: s, backgroundColor: color, left: s * 0.12, top: s * 0.04 }]} />
        <View style={[styles.heartLobe, { width: s * 0.5, height: s * 0.5, borderRadius: s, backgroundColor: color, right: s * 0.12, top: s * 0.04 }]} />
        <View
          style={[
            styles.heartBase,
            {
              width: s * 0.58,
              height: s * 0.58,
              borderRadius: s * 0.1,
              backgroundColor: color,
              left: s * 0.21,
              top: s * 0.28,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
        <DepthFx width={s} height={s} impact={impact} />
      </View>
    );
  }

  if (resolvedShape === "doodle") {
    const w = blob.diameter * 1.24;
    const h = blob.diameter * 0.88;
    return (
      <View style={[styles.base, { width: w, height: h, opacity: blob.opacity, transform: [{ rotate: baseRotate }] }]}>
        <View
          style={[
            styles.doodleStroke,
            {
              width: w * 0.9,
              height: h * 0.14,
              borderRadius: 999,
              backgroundColor: color,
              top: h * 0.26,
              left: w * 0.05,
              transform: [{ rotate: "-28deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.doodleStroke,
            {
              width: w * 0.9,
              height: h * 0.14,
              borderRadius: 999,
              backgroundColor: color,
              top: h * 0.56,
              left: w * 0.05,
              transform: [{ rotate: "-28deg" }],
            },
          ]}
        />
        <DepthFx width={w} height={h} impact={impact} />
      </View>
    );
  }

  if (resolvedShape === "triangle") {
    const s = blob.diameter;
    return (
      <View style={[styles.base, { width: s, height: s * 0.95, opacity: blob.opacity, transform: [{ rotate: baseRotate }] }]}>
        <View
          style={[
            styles.triangle,
            {
              borderLeftWidth: s * 0.45,
              borderRightWidth: s * 0.45,
              borderBottomWidth: s * 0.8,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
            },
          ]}
        />
        <DepthFx width={s} height={s * 0.95} impact={impact} />
      </View>
    );
  }

  if (resolvedShape === "lightning") {
    const w = blob.diameter * 0.86;
    const h = blob.diameter * 1.12;
    return (
      <View style={[styles.base, { width: w, height: h, opacity: blob.opacity, transform: [{ rotate: baseRotate }] }]}>
        <View
          style={[
            styles.boltSegment,
            {
              width: w * 0.28,
              height: h * 0.48,
              borderRadius: w * 0.06,
              backgroundColor: color,
              left: w * 0.32,
              top: h * 0.02,
              transform: [{ rotate: "24deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.boltSegment,
            {
              width: w * 0.34,
              height: h * 0.36,
              borderRadius: w * 0.06,
              backgroundColor: color,
              left: w * 0.16,
              top: h * 0.36,
              transform: [{ rotate: "-18deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.boltSegment,
            {
              width: w * 0.26,
              height: h * 0.34,
              borderRadius: w * 0.06,
              backgroundColor: color,
              left: w * 0.44,
              top: h * 0.62,
              transform: [{ rotate: "16deg" }],
            },
          ]}
        />
        <DepthFx width={w} height={h} impact={impact} />
      </View>
    );
  }

  if (resolvedShape === "rain") {
    const w = blob.diameter * 1.04;
    const h = blob.diameter * 1.06;
    return (
      <View style={[styles.base, { width: w, height: h, opacity: blob.opacity, transform: [{ rotate: baseRotate }] }]}>
        <View
          style={[
            styles.rainDrop,
            {
              width: w * 0.16,
              height: h * 0.66,
              borderRadius: 999,
              backgroundColor: color,
              left: w * 0.18,
              top: h * 0.18,
              transform: [{ rotate: "16deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.rainDrop,
            {
              width: w * 0.16,
              height: h * 0.72,
              borderRadius: 999,
              backgroundColor: color,
              left: w * 0.42,
              top: h * 0.1,
              transform: [{ rotate: "12deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.rainDrop,
            {
              width: w * 0.16,
              height: h * 0.62,
              borderRadius: 999,
              backgroundColor: color,
              left: w * 0.66,
              top: h * 0.2,
              transform: [{ rotate: "14deg" }],
            },
          ]}
        />
        <DepthFx width={w} height={h} impact={impact} />
      </View>
    );
  }

  const width = Number(shapeConfig.style.width ?? blob.diameter);
  const height = Number(shapeConfig.style.height ?? blob.diameter);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: color,
          opacity: blob.opacity,
        },
        shapeConfig.style,
        {
          transform: [{ rotate: baseRotate }, { scaleX: shapeConfig.extraScaleX }],
        },
      ]}
    >
      <DepthFx width={width} height={height} impact={impact} />
    </View>
  );
}

function DepthFx({
  width,
  height,
  impact,
}: {
  width: number;
  height: number;
  impact: number;
}) {
  // Keep depth subtle: layered soft light + gentle lower occlusion.
  const topGlowOpacity = 0.014 + impact * 0.01;
  const topBloomOpacity = 0.008 + impact * 0.008;

  return (
    <>
      <View
        style={[
          styles.highlightSoft,
          {
            width: width * 0.64,
            height: height * 0.4,
            left: width * 0.08,
            top: height * 0.06,
            opacity: topGlowOpacity,
          },
        ]}
      />
      <View
        style={[
          styles.highlightBloom,
          {
            width: width * 0.92,
            height: height * 0.52,
            left: width * 0.04,
            top: height * 0.03,
            opacity: topBloomOpacity,
          },
        ]}
      />
    </>
  );
}

function getShapeConfig(shape: MoodShape, diameter: number, distortion: number, impact: number) {
  switch (shape) {
    case "heart":
      return {
        style: {
          width: diameter,
          height: diameter,
          borderRadius: diameter * 0.12,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "doodle":
      return {
        style: {
          width: diameter * 1.24,
          height: diameter * 0.88,
          borderRadius: diameter,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "square":
      return {
        style: {
          width: diameter,
          height: diameter,
          borderRadius: diameter * 0.08,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "triangle":
      return {
        style: {
          width: diameter,
          height: diameter * 0.95,
          borderRadius: 0,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "lightning":
      return {
        style: {
          width: diameter * 0.86,
          height: diameter * 1.12,
          borderRadius: diameter * 0.06,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "rain":
      return {
        style: {
          width: diameter * 1.04,
          height: diameter * 1.06,
          borderRadius: diameter * 0.22,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "organic":
      return {
        style: {
          width: diameter * 1.03,
          height: diameter * 0.94,
          borderTopLeftRadius: diameter * (0.65 - distortion * 0.25),
          borderTopRightRadius: diameter * (0.45 + distortion * 0.18),
          borderBottomLeftRadius: diameter * (0.48 + distortion * 0.16),
          borderBottomRightRadius: diameter * (0.7 - distortion * 0.22),
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "rounded":
      return {
        style: {
          width: diameter,
          height: diameter,
          borderRadius: diameter * 0.24,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "pill":
      return {
        style: {
          width: diameter * 1.28,
          height: diameter * 0.74,
          borderRadius: diameter,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "diamond":
      return {
        style: {
          width: diameter * 0.9,
          height: diameter * 0.9,
          borderRadius: diameter * 0.15,
        },
        extraRotateDeg: 45,
        extraScaleX: 1,
      };
    case "drop":
      return {
        style: {
          width: diameter * 0.92,
          height: diameter * 1.26,
          borderRadius: diameter * 0.4,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "pebble":
      return {
        style: {
          width: diameter * 1.06,
          height: diameter * (0.84 + impact * 0.08),
          borderTopLeftRadius: diameter * 0.62,
          borderTopRightRadius: diameter * 0.48,
          borderBottomLeftRadius: diameter * 0.42,
          borderBottomRightRadius: diameter * 0.65,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
    case "star":
      return {
        style: {
          width: diameter * 0.9,
          height: diameter * 0.9,
          borderRadius: diameter * 0.32,
        },
        extraRotateDeg: 22,
        extraScaleX: 0.88,
      };
    case "circle":
    default:
      return {
        style: {
          width: diameter,
          height: diameter,
          borderRadius: diameter * 0.5,
        },
        extraRotateDeg: 0,
        extraScaleX: 1,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    shadowColor: "#000",
    shadowOpacity: 0.045,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    overflow: "hidden",
  },
  highlightSoft: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  highlightBloom: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  heartLobe: {
    position: "absolute",
  },
  heartBase: {
    position: "absolute",
  },
  doodleStroke: {
    position: "absolute",
  },
  triangle: {
    position: "absolute",
    width: 0,
    height: 0,
    alignSelf: "center",
    bottom: 0,
  },
  boltSegment: {
    position: "absolute",
  },
  rainDrop: {
    position: "absolute",
  },
});
