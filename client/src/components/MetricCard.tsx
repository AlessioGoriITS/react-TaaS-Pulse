type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "warning" | "success";
};

export function MetricCard({ label, value, helper, tone = "neutral" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}
