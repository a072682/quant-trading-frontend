const DEFAULT_WATCH_LIST = [
  { code: "0056", name: "元大高股息" },
  { code: "0050", name: "元大台灣50" },
  { code: "2886", name: "兆豐金" },
  { code: "2412", name: "中華電" },
  { code: "5880", name: "合庫金" },
];

export const STOCK_NAMES = {
  "0050": "元大台灣50",
  "0056": "元大高股息",
  "00878": "國泰永續高股息",
  "00919": "群益台灣精選高息",
  "2886": "兆豐金",
  "2887": "台新金",
  "2882": "國泰金",
  "2884": "玉山金",
  "2412": "中華電",
  "5880": "合庫金",
  "2330": "台積電",
  "2454": "聯發科",
  "2317": "鴻海",
  "2308": "台達電",
  "2303": "聯電",
  "2382": "廣達",
  "2395": "研華",
  "3711": "日月光投控",
  "2379": "瑞昱",
  "2357": "華碩",
};

export const getStockName = (code) => STOCK_NAMES[code] || code;

export const getWatchList = () => {
  try {
    const stored = localStorage.getItem("watchList");
    if (!stored) return DEFAULT_WATCH_LIST;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_WATCH_LIST;
    // 相容舊格式（字串陣列）→ 轉換為物件陣列
    if (typeof parsed[0] === "string") {
      return parsed.map((code) => ({ code, name: getStockName(code) }));
    }
    return parsed;
  } catch {
    return DEFAULT_WATCH_LIST;
  }
};
