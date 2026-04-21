import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTodaySignals, runStock } from "../api/signals";
import { getPositions } from "../api/positions";
import { setPositions } from "../slice/positionSlice";
import { open, MODALS } from "../slice/modalSlice";
import ScoreCard from "../components/trading/ScoreCard/ScoreCard";
import PositionCard from "../components/trading/PositionCard/PositionCard";
import { getWatchList } from "../utils/watchList";

const mapSignal = (d) => ({
  stockCode: d.stock_code,
  stockName: d.stock_name,
  totalScore: d.total_score,
  institutionalScore: d.institutional_score,
  maScore: d.ma_score,
  volumeScore: d.volume_score,
  yieldScore: d.yield_score ?? 0,
  aiAction: d.ai_action,
  aiReason: d.ai_reason,
});

const mapPosition = (d) => ({
  stockCode: d.stock_code,
  stockName: d.stock_name,
  quantity: d.quantity,
  avgCost: d.avg_cost,
  currentPrice: d.current_price,
  unrealizedProfit: d.unrealized_profit,
});

async function fetchAllSignals(list) {
  const results = await Promise.allSettled(
    list.map(({ code }) => getTodaySignals(code))
  );
  return results.map((result, i) => {
    if (result.status === "fulfilled") {
      return mapSignal(result.value.data.data);
    }
    return { stockCode: list[i].code, stockName: list[i].name, error: true };
  });
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const positions = useSelector((state) => state.position.list);
  const [watchSignals, setWatchSignals] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [signals, posRes] = await Promise.all([
          fetchAllSignals(getWatchList()),
          getPositions(),
        ]);
        setWatchSignals(signals);
        const posList = Array.isArray(posRes.data.data)
          ? posRes.data.data.map(mapPosition)
          : [];
        dispatch(setPositions(posList));
      } catch (err) {
        console.error("資料載入失敗", err);
      }
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const list = getWatchList();
      await Promise.allSettled(
        list.map(({ code, name }) => runStock(code, name))
      );
      const signals = await fetchAllSignals(list);
      setWatchSignals(signals);
    } catch (err) {
      console.error("重新整理失敗", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBuyClick = (signal) => {
    dispatch(open({ modal: MODALS.CONFIRM_BUY, data: signal }));
  };

  const handleSellClick = (position) => {
    dispatch(open({ modal: MODALS.CONFIRM_SELL, data: position }));
  };

  return (
    <div className="container-fluid py-4">
      <section className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <h5 className="section-title mb-0">今日訊號</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "計算中..." : "重新整理"}
          </button>
        </div>
        <div className="row g-3">
          {watchSignals.map((signal) => (
            <div key={signal.stockCode} className="col-12 col-md-6 col-lg-4">
              {signal.error ? (
                <div
                  style={{
                    background: "#0d1b2e",
                    border: "1px solid #1e3a5f",
                    borderRadius: 8,
                    padding: "20px 16px",
                    textAlign: "center",
                    color: "#8ab4d4",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#e0f0ff", marginBottom: 6 }}>
                    {signal.stockCode}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    尚無今日評分，請按重新整理
                  </div>
                </div>
              ) : (
                <>
                  <ScoreCard signal={signal} />
                  {signal.totalScore >= 4 && (
                    <button
                      className="btn-buy w-100 mt-2"
                      onClick={() => handleBuyClick(signal)}
                    >
                      確認買入
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h5 className="section-title">目前持倉</h5>
        <div className="row g-3">
          {positions.map((pos) => (
            <div key={pos.stockCode} className="col-12 col-md-6">
              <PositionCard
                position={pos}
                onSell={() => handleSellClick(pos)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
