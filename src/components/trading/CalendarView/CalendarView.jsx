import { useMemo } from "react";
import dayjs from "dayjs";
import "./_CalendarView.scss";

export default function CalendarView({ trades, year, month }) {
  const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
  const firstDayOfWeek = dayjs(`${year}-${month}-01`).day();

  const tradeMap = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const d = dayjs(t.date).date();
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [trades]);

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="calendar-view">
      <div className="calendar-view__weekdays">
        {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
          <div key={w} className="weekday-label">{w}</div>
        ))}
      </div>
      <div className="calendar-view__grid">
        {cells.map((day, idx) => (
          <div key={idx} className={`calendar-cell ${day ? "" : "calendar-cell--empty"}`}>
            {day && (
              <>
                <span className="cell-day">{day}</span>
                {tradeMap[day]?.map((t, i) => (
                  <div
                    key={i}
                    className={`trade-dot trade-dot--${t.type === "buy" ? "buy" : "sell"}`}
                    title={`${t.stockCode} ${t.type === "buy" ? "買" : "賣"}`}
                  />
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
