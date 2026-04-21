import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { getSignalHistory } from "../api/signals";
import { getKlineData } from "../api/stocks";
import KLineChart from "../components/trading/KLineChart/KLineChart";

const WATCH_LIST = [
  { code: "0056", name: "元大高股息" },
  { code: "0050", name: "元大台灣50" },
  { code: "2886", name: "兆豐金" },
  { code: "2412", name: "中華電" },
  { code: "5880", name: "合庫金" },
];

const SELECT_STYLE = {
  maxWidth: 220,
  background: "#0d1b2e",
  color: "#e0f0ff",
  border: "1px solid #1e3a5f",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0d1b2e",
    border: "1px solid #1e3a5f",
    color: "#e0f0ff",
  },
};

export default function AnalysisPage() {
  const [stockCode, setStockCode] = useState("0056");
  const [klineData, setKlineData] = useState([]);
  const [scoreData, setScoreData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [klineRes, historyRes] = await Promise.all([
          getKlineData(stockCode),
          getSignalHistory(stockCode),
        ]);

        setKlineData(klineRes.data.data || []);

        const history = historyRes.data.data || [];
        setScoreData(
          history.map((item) => ({
            date: item.date,
            total_score: item.total_score ?? 0,
          }))
        );
      } catch (err) {
        console.error("資料載入失敗", err);
        setError("資料載入失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stockCode]);

  return (
    <div className="container-fluid py-4">
      {/* 頁面標題 + 股票選擇器 */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <h5 className="section-title mb-0">K 線分析</h5>
        <select
          className="form-select"
          style={SELECT_STYLE}
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
        >
          {WATCH_LIST.map(({ code, name }) => (
            <option key={code} value={code} style={{ background: "#0d1b2e" }}>
              {code}　{name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-info">載入中...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && (
        <>
          {/* K 線圖 */}
          <div className="mb-4">
            {klineData.length > 0 ? (
              <KLineChart data={klineData} stockCode={stockCode} />
            ) : (
              !error && <p className="text-secondary">無 K 線資料</p>
            )}
          </div>

          {/* 評分趨勢圖 */}
          <div className="mb-4">
            <h6 className="section-title">評分趨勢</h6>
            {scoreData.length > 0 ? (
              <div
                style={{
                  background: "#0d1b2e",
                  borderRadius: 8,
                  padding: "16px 8px",
                }}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={scoreData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis
                      dataKey="date"
                      stroke="#8ab4d4"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#8ab4d4" tick={{ fontSize: 11 }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend />
                    <ReferenceLine
                      y={5}
                      stroke="#ef5350"
                      strokeDasharray="4 4"
                      label={{
                        value: "買進門檻 +5",
                        fill: "#ef5350",
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_score"
                      name="總分"
                      stroke="#4fc3f7"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              !error && <p className="text-secondary">無評分歷史資料</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
