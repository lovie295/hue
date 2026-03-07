export const clampImpact = (value: number): number => {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const toBlobStyle = (impact: number) => {
  const i = clampImpact(impact);
  return {
    diameter: 20 + i * 120,
    blur: 2 + i * 10,
    distortion: 0.04 + i * 0.16,
    opacity: 0.72 + i * 0.13,
  };
};

