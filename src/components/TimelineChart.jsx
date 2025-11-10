import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

function formatLabel(item, timeRange) {
  if (timeRange === '24h') {
    const date = new Date(item.timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  }
  return item.day;
}

function TimelineChart({ data, timeRange }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={(entry) => formatLabel(entry, timeRange)}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5f5' }}
          />
          <YAxis
            domain={[60, 90]}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5f5' }}
            width={48}
          />
          <Tooltip
            labelFormatter={(value, payload) => {
              if (timeRange === '24h' && payload && payload[0]) {
                const date = new Date(payload[0].payload.timestamp);
                return date.toLocaleString();
              }
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

TimelineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  timeRange: PropTypes.oneOf(['24h', '7d']).isRequired
};

export default TimelineChart;
