import { motion } from "framer-motion";
import "./_PositionCard.scss";

export default function PositionCard({ position, onSell }) {
  const profitClass = position.unrealizedProfit >= 0 ? "profit--positive" : "profit--negative";

  return (
    <motion.div
      className="position-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="position-card__header">
        <span className="stock-code">{position.stockCode}</span>
        <span className="stock-name">{position.stockName}</span>
      </div>

      <div className="position-card__info">
        <div className="info-row">
          <span className="info-label">持有數量</span>
          <span className="info-value">{position.quantity} 股</span>
        </div>
        <div className="info-row">
          <span className="info-label">成本均價</span>
          <span className="info-value">{position.avgCost} 元</span>
        </div>
        <div className="info-row">
          <span className="info-label">現價</span>
          <span className="info-value">{position.currentPrice} 元</span>
        </div>
        <div className="info-row">
          <span className="info-label">未實現損益</span>
          <span className={`info-value ${profitClass}`}>
            {position.unrealizedProfit >= 0 ? "+" : ""}
            {position.unrealizedProfit} 元
          </span>
        </div>
      </div>

      <button className="btn-sell w-100 mt-3" onClick={onSell}>
        確認賣出
      </button>
    </motion.div>
  );
}
