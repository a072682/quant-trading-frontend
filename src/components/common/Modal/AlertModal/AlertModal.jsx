import { useDispatch } from "react-redux";
import { close } from "../../../../slice/modalSlice";
import "./_AlertModal.scss";

export default function AlertModal({ data }) {
  const dispatch = useDispatch();

  return (
    <div className="modal-overlay">
      <div className="alert-modal-box">
        <h5 className="alert-modal-box__title">{data?.title || "提示"}</h5>
        <p className="alert-modal-box__body">{data?.message}</p>
        <div className="alert-modal-box__actions">
          <button className="btn-alert-close" onClick={() => dispatch(close())}>
            確認
          </button>
        </div>
      </div>
    </div>
  );
}
