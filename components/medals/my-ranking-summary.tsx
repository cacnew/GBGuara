import { MetricCard } from "@/components/dashboard/metric-card";

export function MyRankingSummary({
  periodPoints,
  allTimePoints,
  position,
  totalParticipants,
}: {
  periodPoints: number;
  allTimePoints: number;
  position: number | null;
  totalParticipants: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard label="Pontos no período" value={periodPoints} />
      <MetricCard label="Pontos totais (todos os anos)" value={allTimePoints} />
      <MetricCard
        label="Sua colocação"
        value={position ? `${position}º de ${totalParticipants}` : "Sem pontos neste filtro"}
      />
    </div>
  );
}
