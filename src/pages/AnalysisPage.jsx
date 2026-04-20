import { useState, useEffect } from "react";
import { getSignalHistory } from "../api/signals";
import KLineChart from "../components/trading/KLineChart/KLineChart";
import ParamChart from "../components/trading/ParamChart/ParamChart";

export default function AnalysisPage() {
  const [stockCode, setStockCode] = useState("2330");
  const [inputCode, setInputCode] = useState("2330");
  const [klineData, setKlineData] = useState([]);
  const [paramData, setParamData] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getSignalHistory(stockCode);
        const history = res.data.data;
        setKlineData(history.kline || []);
        setParamData(history.params || []);
      } catch (err) {
        console.error("歷史資料載入失敗", err);
      }
    };
    fetchHistory();
  }, [stockCode]);

  const handleSearch = () => {
    setStockCode(inputCode.trim());
  };

  return (
    <div className="container-fluid py-4">
      <h5 className="section-title">K 線分析</h5>

      <div className="d-flex gap-2 mb-4">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 160, background: "#0d1b2e", color: "#e0f0ff", border: "1px solid #1e3a5f" }}
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="輸入股票代號"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn btn-outline-info" onClick={handleSearch}>
          查詢
        </button>
      </div>

      {klineData.length > 0 && (
        <div className="mb-4">
          <KLineChart data={klineData} stockCode={stockCode} />
        </div>
      )}

      {paramData.length > 0 && (
        <div className="mb-4">
          <h6 className="section-title">三大參數趨勢</h6>
          <ParamChart data={paramData} />
        </div>
      )}
    </div>
  );
}
