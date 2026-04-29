import { useState } from "react";
// TODO: 待 modalSlice 重新建立後，取消以下 import 並恢復 dispatch(close())
// import { useDispatch } from "react-redux";
// import { close } from "../../../../slice/modalSlice";
// import { confirmSell } from "../../../../api/trades";
// TODO: 模擬交易功能待後端重構後再啟用
// import { addTrade } from "../../../../slice/tradeSlice";
import "./_ConfirmModal.scss";

export default function ConfirmSellModal({ data, onClose }) {
  const [notice, setNotice] = useState("");

  const handleConfirm = () => {
    setNotice("此功能開發中，待後端交易 API 重構完成後啟用");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h5 className="modal-box__title">確認賣出</h5>
        <p className="modal-box__body">
          確定要賣出 <strong>{data?.stockCode} {data?.stockName}</strong> 嗎？
        </p>
        <p className="modal-box__score">持有數量：{data?.quantity} 股</p>
        {notice && (
          <p style={{ color: "#ffa726", fontSize: 13, marginBottom: 8 }}>{notice}</p>
        )}
        <div className="modal-box__actions">
          <button className="btn-modal-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-modal-confirm btn-confirm--sell" onClick={handleConfirm}>
            確認賣出
          </button>
        </div>
      </div>
    </div>
  );
}
