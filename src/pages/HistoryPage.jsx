import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { getSignalHistory, getSignalsByDate } from "../api/signals";
import ScoreCard from "../components/trading/ScoreCard/ScoreCard";

const WATCH_LIST = ["0056", "0050", "2886", "2412", "5880"];
const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const RECOMMEND_THRESHOLD = 6;

const mapSignal = (d) => ({
  stockCode: d.stock_code,
  stockName: d.stock_name,
  totalScore: d.total_score ?? 0,
  institutionalScore: d.institutional_score ?? 0,
  maScore: d.ma_score ?? 0,
  volumeScore: d.volume_score ?? 0,
  yieldScore: d.yield_score ?? 0,
  futuresScore: d.futures_score ?? 0,
  aiAction: d.ai_action,
  aiReason: d.ai_reason,
});

function getDateStyle(avgScore, hasRecommend, isSelected, mode) {
  if (isSelected) {
    return { bg: "#1e3a5f", border: "#4fc3f7", text: "#e0f0ff" };
  }
  if (mode === "recommend") {
    if (hasRecommend) return { bg: "#0d2b1a", border: "#26a69a", text: "#26a69a" };
    return null;
  }
  // full mode
  if (avgScore >= 5) return { bg: "#0d2b1a", border: "#26a69a", text: "#26a69a" };
  if (avgScore >= 0) return { bg: "#2b2200", border: "#ffa726", text: "#ffa726" };
  return { bg: "#2b0d0d", border: "#ef5350", text: "#ef5350" };
}

function buildCalendarCells(currentDate) {
  const firstDay = currentDate.startOf("month");
  const startOffset = firstDay.day();
  const daysInMonth = currentDate.daysInMonth();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Tab 樣式
const TAB_BASE = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  transition: "color 0.15s, border-color 0.15s",
};

const tabStyle = (active) => ({
  ...TAB_BASE,
  color: active ? "#4fc3f7" : "#4a6a8a",
  borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent",
});

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("recommend"); // "recommend" | "full"
  const [currentDate, setCurrentDate] = useState(dayjs().startOf("month"));
  // dateScoreMap: { [date]: { avg: number, hasRecommend: boolean } }
  const [dateScoreMap, setDateScoreMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [daySignals, setDaySignals] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    const fetchAllHistory = async () => {
      setLoadingCalendar(true);
      setSelectedDate(null);
      setDaySignals([]);
      try {
        const results = await Promise.all(
          WATCH_LIST.map((code) => getSignalHistory(code))
        );

        const accumulator = {};
        results.forEach((res) => {
          const history = res.data.data || [];
          history.forEach((item) => {
            const d = item.date;
            if (!accumulator[d]) accumulator[d] = { sum: 0, count: 0, maxScore: -Infinity };
            accumulator[d].sum += item.total_score ?? 0;
            accumulator[d].count += 1;
            accumulator[d].maxScore = Math.max(accumulator[d].maxScore, item.total_score ?? 0);
          });
        });

        const scoreMap = {};
        Object.entries(accumulator).forEach(([date, { sum, count, maxScore }]) => {
          scoreMap[date] = {
            avg: sum / count,
            hasRecommend: maxScore >= RECOMMEND_THRESHOLD,
          };
        });
        setDateScoreMap(scoreMap);
      } catch (err) {
        console.error("歷史資料載入失敗", err);
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchAllHistory();
  }, []);

  const handleDateClick = async (dateStr) => {
    const entry = dateScoreMap[dateStr];
    if (!entry) return;
    // 推薦模式下只回應有推薦的日期
    if (activeTab === "recommend" && !entry.hasRecommend) return;

    setSelectedDate(dateStr);
    setDaySignals([]);
    setLoadingDay(true);
    try {
      const res = await getSignalsByDate(dateStr);
      const all = (res.data.data || []).map(mapSignal);
      const filtered =
        activeTab === "recommend"
          ? all.filter((s) => s.totalScore >= RECOMMEND_THRESHOLD)
          : all;
      setDaySignals(filtered);
    } catch (err) {
      console.error("當日資料載入失敗", err);
    } finally {
      setLoadingDay(false);
    }
  };

  // 切 Tab 時重置選取日期，並若已選日期需重新過濾
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedDate(null);
    setDaySignals([]);
  };

  const prevMonth = () => {
    setSelectedDate(null);
    setDaySignals([]);
    setCurrentDate((d) => d.subtract(1, "month"));
  };
  const nextMonth = () => {
    setSelectedDate(null);
    setDaySignals([]);
    setCurrentDate((d) => d.add(1, "month"));
  };

  const year = currentDate.year();
  const month = currentDate.month() + 1;
  const cells = buildCalendarCells(currentDate);

  return (
    <div className="container-fluid py-4">
      <h5 className="section-title">歷史評分紀錄</h5>

      {/* Tab 列 */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #1e3a5f",
          marginBottom: 20,
        }}
      >
        <button style={tabStyle(activeTab === "recommend")} onClick={() => handleTabChange("recommend")}>
          推薦紀錄
        </button>
        <button style={tabStyle(activeTab === "full")} onClick={() => handleTabChange("full")}>
          完整紀錄
        </button>
      </div>

      {/* 月份切換 */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={prevMonth}>‹</button>
        <span style={{ color: "#e0f0ff", fontWeight: 600 }}>
          {year} 年 {month} 月
        </span>
        <button className="btn btn-outline-secondary btn-sm" onClick={nextMonth}>›</button>
      </div>

      {/* 日曆 */}
      <div
        style={{
          background: "#0d1b2e",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        {loadingCalendar ? (
          <p className="text-info">載入日曆資料中...</p>
        ) : (
          <>
            {/* 星期標題 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
              {WEEK_LABELS.map((label) => (
                <div
                  key={label}
                  style={{ textAlign: "center", color: "#8ab4d4", fontSize: 12, padding: "4px 0" }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 日期格子 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;

                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const entry = dateScoreMap[dateStr];
                const isSelected = selectedDate === dateStr;
                const isClickable =
                  entry &&
                  (activeTab === "full" || entry.hasRecommend);
                const style = entry
                  ? getDateStyle(entry.avg, entry.hasRecommend, isSelected, activeTab)
                  : null;

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDateClick(dateStr)}
                    style={{
                      textAlign: "center",
                      padding: "6px 2px",
                      borderRadius: 6,
                      cursor: isClickable ? "pointer" : "default",
                      background: style ? style.bg : "transparent",
                      border: style ? `1px solid ${style.border}` : "1px solid transparent",
                      color: style ? style.text : "#4a6a8a",
                      fontSize: 13,
                      fontWeight: style ? 600 : 400,
                      transition: "background 0.15s",
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* 圖例 */}
            <div className="d-flex gap-3 mt-3" style={{ fontSize: 11, color: "#8ab4d4" }}>
              {activeTab === "recommend" ? (
                <span><span style={{ color: "#26a69a" }}>■</span> 有推薦股票（≥{RECOMMEND_THRESHOLD} 分）</span>
              ) : (
                <>
                  <span><span style={{ color: "#26a69a" }}>■</span> 買進訊號（≥5）</span>
                  <span><span style={{ color: "#ffa726" }}>■</span> 觀望（0–4）</span>
                  <span><span style={{ color: "#ef5350" }}>■</span> 賣出訊號（&lt;0）</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 點擊日期後顯示當天評分 */}
      {selectedDate && (
        <div>
          <h6 className="section-title">
            {selectedDate}
            {activeTab === "recommend" ? " 推薦股票" : " 完整評分"}
          </h6>
          {loadingDay && <p className="text-info">載入中...</p>}
          {!loadingDay && daySignals.length > 0 && (
            <div className="row g-3">
              {daySignals.map((signal) => (
                <div key={signal.stockCode} className="col-12 col-md-6 col-xl-4">
                  <ScoreCard signal={signal} />
                </div>
              ))}
            </div>
          )}
          {!loadingDay && daySignals.length === 0 && (
            <p className="text-secondary">
              {activeTab === "recommend" ? "當日無推薦股票" : "無評分資料"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
