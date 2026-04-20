import { motion } from "framer-motion";
import "./_ScoreCard.scss";

export default function ScoreCard({ signal }) {
  const getStatus = (score) => {
    if (score >= 4) return { label: "建議買進", cls: "status--buy" };
    if (score >= 1) return { label: "觀望", cls: "status--watch" };
    return { label: "建議賣出", cls: "status--sell" };
  };

  const status = getStatus(signal.totalScore);

  return (
    <motion.div
      className={`score-card ${status.cls}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="score-card__header">
        <span className="stock-code">{signal.stockCode}</span>
        <span className="stock-name">{signal.stockName}</span>
      </div>

      <div className="score-card__score">
        <span className="score-number">{signal.totalScore}</span>
        <span className="score-label">/ 5 分</span>
      </div>

      <div className="score-card__params">
        <div className="param-item">
          <span>法人</span>
          <span>{signal.institutionalScore > 0 ? "+" : ""}{signal.institutionalScore}</span>
        </div>
        <div className="param-item">
          <span>均線</span>
          <span>{signal.maScore > 0 ? "+" : ""}{signal.maScore}</span>
        </div>
        <div className="param-item">
          <span>成交量</span>
          <span>{signal.volumeScore > 0 ? "+" : ""}{signal.volumeScore}</span>
        </div>
      </div>

      <div className="score-card__action">
        <span className="action-label">{status.label}</span>
      </div>

      {signal.aiReason && (
        <div className="score-card__ai">
          <div className="ai-reason">{signal.aiReason}</div>
        </div>
      )}
    </motion.div>
  );
}
