const DEFAULT_SETTINGS = {
  buyThreshold: 6,
  stopLoss: -3,
  takeProfit: 6,
};

export const getStrategySettings = () => {
  try {
    const stored = localStorage.getItem("strategySettings");
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};
