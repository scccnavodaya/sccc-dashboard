interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCards({
  stats = [],
  softBgClass = "bg-emerald-50",
  primaryTextClass = "text-emerald-800",
}: {
  stats: StatItem[];
  softBgClass?: string;
  primaryTextClass?: string;
}) {
  if (!stats.length)
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        Stats will appear here once available.
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`rounded-xl border border-emerald-100 p-3 ${softBgClass} shadow-sm`}
        >
          <div className={`text-lg font-semibold ${primaryTextClass}`}>
            {stat.value}
          </div>
          <div className="text-sm font-medium text-gray-700">{stat.label}</div>
          {stat.sub && (
            <div className="text-xs text-gray-500 leading-tight">
              {stat.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
