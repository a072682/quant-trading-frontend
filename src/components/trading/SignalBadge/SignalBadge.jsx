import "./_SignalBadge.scss";

export default function SignalBadge({ score }) {
  const getVariant = (score) => {
    if (score >= 4) return { label: "買進", cls: "badge--buy" };
    if (score >= 1) return { label: "觀望", cls: "badge--watch" };
    return { label: "賣出", cls: "badge--sell" };
  };

  const { label, cls } = getVariant(score);

  return (
    <span className={`signal-badge ${cls}`}>{label}</span>
  );
}
