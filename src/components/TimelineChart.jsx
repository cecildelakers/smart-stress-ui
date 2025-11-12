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
  // Custom tick formatter to show labels at specific indices
  // Start at 00:00 and display a label every 2 hours (00:00, 02:00, ... , 22:00)
  const tickFormatter = (value, index) => {
    if (timeRange === '24h' && data && data.length > 0 && index !== undefined) {
      // Get the hour from the data point
      const hour = new Date(data[index]?.timestamp).getHours();

      // Show 00:00 and every 2 hours (hour % 2 === 0)
      if (hour % 2 === 0) {
        return `${hour.toString().padStart(2, '0')}:00`;
      }

      // Optionally show 24:00 label if last tick corresponds to midnight (hour 0) but not index 0
      if (hour === 0 && index === data.length - 1) {
        return '24:00';
      }

      // Hide other ticks
      return '';
    }
    return value;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="category"
            dataKey={(entry) => formatLabel(entry, timeRange)}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5f5' }}
            interval={0}
            tickFormatter={tickFormatter}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[45, 115]}
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
