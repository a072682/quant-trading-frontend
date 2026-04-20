import { useDispatch } from "react-redux";
import { close } from "../../../../slice/modalSlice";
import { confirmBuy } from "../../../../api/trades";
import { addTrade } from "../../../../slice/tradeSlice";
import "./_ConfirmModal.scss";

export default function ConfirmBuyModal({ data }) {
  const dispatch = useDispatch();

  const handleConfirm = async () => {
    try {
      const res = await confirmBuy({
        stockCode: data.stockCode,
        stockName: data.stockName,
        score: data.totalScore,
      });
      dispatch(addTrade(res.data.data));
      dispatch(close());
    } catch (err) {
      console.error("買入失敗", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h5 className="modal-box__title">確認買入</h5>
        <p className="modal-box__body">
          確定要買入 <strong>{data?.stockCode} {data?.stockName}</strong> 嗎？
        </p>
        <p className="modal-box__score">今日評分：{data?.totalScore} / 5 分</p>
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
