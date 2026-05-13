type DetailItemProps = {
  label: string;
  value: string;
};

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="detail-section">
      <div className="detail-section-label">{label}</div>
      <div className="detail-section-value">{value}</div>
    </div>
  );
}
