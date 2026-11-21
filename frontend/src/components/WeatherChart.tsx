import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeatherResponse } from '../types/weather.types';

export function WeatherChart({ data }: { data?: WeatherResponse }) {
  const hours = data?.hourly || [];
  if (!hours.length) return <div className="chart-empty">Hourly forecast unavailable.</div>;
  const peak = Math.max(...hours.map((hour) => hour.temperatureC));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={hours} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e5e8" strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(time: string) => time.slice(11, 16)}
          tickLine={false}
          axisLine={false}
          fontSize={10}
        />
        <YAxis
          domain={['dataMin - 2', 'dataMax + 2']}
          tickLine={false}
          axisLine={false}
          fontSize={10}
        />
        <Tooltip
          formatter={(value) => [`${value}°C`, 'Temperature']}
          labelFormatter={(label) => String(label).replace('T', ' ').slice(0, 16)}
        />
        <Bar dataKey="temperatureC" radius={[5, 5, 0, 0]} maxBarSize={26}>
          {hours.map((hour) => (
            <Cell key={hour.time} fill={hour.temperatureC >= peak - 1 ? '#dc2626' : '#f59e0b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
