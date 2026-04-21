const DEFAULT_WATCH_LIST = [
  { code: "0056", name: "元大高股息" },
  { code: "0050", name: "元大台灣50" },
  { code: "2886", name: "兆豐金" },
  { code: "2412", name: "中華電" },
  { code: "5880", name: "合庫金" },
];

export const getWatchList = () => {
  try {
    const stored = localStorage.getItem("watchList");
    if (!stored) return DEFAULT_WATCH_LIST;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WATCH_LIST;
    // 相容舊格式（字串陣列）→ 轉換為物件陣列
    if (typeof parsed[0] === "string") {
      return parsed.map((code) => ({ code, name: code }));
    }
    return parsed;
  } catch {
    return DEFAULT_WATCH_LIST;
  }
};
