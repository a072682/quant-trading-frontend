import ReactDOM from "react-dom";
import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { close, MODALS } from "../../../slice/modalSlice";
import ConfirmBuyModal from "../Modal/ConfirmModal/ConfirmBuyModal";
import ConfirmSellModal from "../Modal/ConfirmModal/ConfirmSellModal";
import AlertModal from "../Modal/AlertModal/AlertModal";

export default function ModalRoot() {
  const dispatch = useDispatch();
  const currentModal = useSelector((state) => state.modal.currentModal);
  const payload = useSelector((state) => state.modal.payload);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") dispatch(close());
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  useEffect(() => {
    document.body.style.overflow = currentModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [currentModal]);

  const modalContent = useMemo(() => {
    switch (currentModal) {
      case MODALS.CONFIRM_BUY:
        return <ConfirmBuyModal data={payload} />;
      case MODALS.CONFIRM_SELL:
        return <ConfirmSellModal data={payload} />;
      case MODALS.ALERT:
        return <AlertModal data={payload} />;
      default:
        return null;
    }
  }, [currentModal, payload]);

  if (!modalContent) return null;

  return ReactDOM.createPortal(modalContent, document.body);
}
