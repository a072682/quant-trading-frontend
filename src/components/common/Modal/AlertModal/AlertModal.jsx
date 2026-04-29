// TODO: 待 modalSlice 重新建立後，取消以下 import 並恢復 dispatch(close())
// import { useDispatch } from "react-redux";
// import { close } from "../../../../slice/modalSlice";
import "./_AlertModal.scss";

export default function AlertModal({ data, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="alert-modal-box">
        <h5 className="alert-modal-box__title">{data?.title || "提示"}</h5>
        <p className="alert-modal-box__body">{data?.message}</p>
        <div className="alert-modal-box__actions">
          <button className="btn-alert-close" onClick={onClose}>
            確認
          </button>
        </div>
      </div>
    </div>
  );
}
