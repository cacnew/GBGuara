export function HolidayNotice({
  name,
  customMessage,
}: {
  name: string;
  customMessage: string | null;
}) {
  return (
    <div className="rounded-lg border border-amber-600/20 bg-amber-500/10 p-3 text-sm text-amber-700">
      {customMessage || `Sem aula hoje — ${name}.`}
    </div>
  );
}
