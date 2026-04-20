import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getTradeList, getMonthlyStats } from "../api/trades";
import { setTradeList, setMonthlyStats } from "../slice/tradeSlice";
import CalendarView from "../components/trading/CalendarView/CalendarView";

export default function HistoryPage() {
  const dispatch = useDispatch();
  const trades = useSelector((state) => state.trade.list);
  const monthlyStats = useSelector((state) => state.trade.monthlyStats);

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tradeRes = await getTradeList();
        dispatch(setTradeList(tradeRes.data.data));
        const statsRes = await getMonthlyStats();
        dispatch(setMonthlyStats(statsRes.data.data));
      } catch (err) {
        console.error("歷史資料載入失敗", err);
      }
    };
    fetchData();
  }, []);

  const filteredTrades = trades.filter((t) => {
    const d = dayjs(t.date);
    return d.year() === year && d.month() + 1 === month;
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="container-fluid py-4">
      <h5 className="section-title">歷史交易紀錄</h5>

      {monthlyStats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-label">本月勝率</div>
              <div className="stat-value">{monthlyStats.winRate}%</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-label">本月損益</div>
              <div className={`stat-value ${monthlyStats.totalProfit >= 0 ? "text-success" : "text-danger"}`}>
                {monthlyStats.totalProfit >= 0 ? "+" : ""}{monthlyStats.totalProfit}
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-label">交易次數</div>
              <div className="stat-value">{monthlyStats.tradeCount}</div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={prevMonth}>‹</button>
        <span style={{ color: "#e0f0ff", fontWeight: 600 }}>{year} 年 {month} 月</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={nextMonth}>›</button>
      </div>

      <CalendarView trades={filteredTrades} year={year} month={month} />
    </div>
  );
}
