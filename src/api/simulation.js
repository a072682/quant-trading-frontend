import api from "./index";

export const getSimulationPositions = () =>
  api.get("/api/v1/simulation/positions");

export const getSimulationTrades = () =>
  api.get("/api/v1/simulation/trades");

export const getSimulationSummary = () =>
  api.get("/api/v1/simulation/summary");
