import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// Colour palette that matches the design system
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

function getBarColor(index) {
  return BAR_COLORS[index % BAR_COLORS.length];
}

/**
 * Renders a bar chart with the aggregated data from the insights endpoint.
 *
 * Props:
 *   data    – [{ label: string, count: number }]
 *   groupBy – 'day' | 'feature' | 'user'
 */
export default function UsageChart({ data, groupBy }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No usage data for the selected period.</p>
      </div>
    );
  }

  const xLabel =
    groupBy === 'day'     ? 'Date'    :
    groupBy === 'feature' ? 'Feature' : 'Team Member';

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            label={{ value: xLabel, position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1b4b',
              border: '1px solid #4338ca',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#e0e7ff',
            }}
            formatter={(value) => [value, 'Events']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={getBarColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
