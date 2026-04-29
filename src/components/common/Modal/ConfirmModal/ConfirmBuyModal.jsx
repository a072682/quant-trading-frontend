import { useState } from "react";
import { useDispatch } from "react-redux";
import { close } from "../../../../slice/modalSlice";
// import { confirmBuy } from "../../../../api/trades";
// TODO: 模擬交易功能待後端重構後再啟用
// import { addTrade } from "../../../../slice/tradeSlice";
import "./_ConfirmModal.scss";

export default function ConfirmBuyModal({ data }) {
  const dispatch = useDispatch();
  const [notice, setNotice] = useState("");

  const handleConfirm = () => {
    setNotice("此功能開發中，待後端交易 API 重構完成後啟用");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h5 className="modal-box__title">確認買入</h5>
        <p className="modal-box__body">
          確定要買入 <strong>{data?.stockCode} {data?.stockName}</strong> 嗎？
        </p>
        <p className="modal-box__score">今日評分：{data?.totalScore} / 5 分</p>
        {notice && (
          <p style={{ color: "#ffa726", fontSize: 13, marginBottom: 8 }}>{notice}</p>
        )}
        <div className="modal-box__actions">
          <button className="btn-modal-cancel" onClick={() => dispatch(close())}>
            取消
          </button>
          <button className="btn-modal-confirm btn-confirm--buy" onClick={handleConfirm}>
            確認買入
          </button>
        </div>
      </div>
    </div>
  );
}
