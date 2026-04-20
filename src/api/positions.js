import api from "./index";

export const getPositions = () =>
  api.get("/api/v1/positions/");
