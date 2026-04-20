import { useDispatch } from "react-redux";
import { close } from "../../../../slice/modalSlice";
import { confirmSell } from "../../../../api/trades";
import { addTrade } from "../../../../slice/tradeSlice";
import "./_ConfirmModal.scss";

export default function ConfirmSellModal({ data }) {
  const dispatch = useDispatch();

  const handleConfirm = async () => {
    try {
      const res = await confirmSell({
        stockCode: data.stockCode,
        stockName: data.stockName,
        quantity: data.quantity,
      });
      dispatch(addTrade(res.data.data));
      dispatch(close());
    } catch (err) {
      console.error("賣出失敗", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h5 className="modal-box__title">確認賣出</h5>
        <p className="modal-box__body">
          確定要賣出 <strong>{data?.stockCode} {data?.stockName}</strong> 嗎？
        </p>
        <p className="modal-box__score">持有數量：{data?.quantity} 股</p>
        <div className="modal-box__actions">
          <button className="btn-modal-cancel" onClick={() => dispatch(close())}>
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
