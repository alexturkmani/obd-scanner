interface DataCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color?: string;
}

export default function DataCard({ title, value, unit, icon, color = 'text-obd-accent' }: DataCardProps) {
  return (
    <div className="bg-obd-card rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-opacity-20 ${color} bg-current`}>
        <div className={color}>{icon}</div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}
