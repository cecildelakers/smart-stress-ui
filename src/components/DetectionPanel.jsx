import PropTypes from 'prop-types';
import TimelineChart from './TimelineChart.jsx';
import './DetectionPanel.css';

function DetectionPanel({ timeSeries, signals, onTimeRangeChange, timeRange }) {
  const activeRange = timeRange;

  const handleRangeChange = (range) => {
    onTimeRangeChange(range);
  };

  return (
    <section className="detection">
      <div className="detection__header">
        <h3>Detection</h3>
        <div className="detection__toggle" role="tablist" aria-label="Timeline range">
          {['24h', '7d'].map((range) => (
            <button
              key={range}
              type="button"
              className={range === activeRange ? 'detection__toggle-btn detection__toggle-btn--active' : 'detection__toggle-btn'}
              onClick={() => handleRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="detection__body">
        <div className="detection__chart">
          <TimelineChart data={timeSeries[activeRange]} timeRange={activeRange} />
        </div>
        <aside className="detection__signals">
          <h4>Signals</h4>
          <ul>
            {signals.map((signal) => (
              <li key={signal.id}>
                <span className="signal__label">{signal.label}</span>
                <span className="signal__value">{signal.value}</span>
                <span className="signal__note">{signal.note}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

DetectionPanel.propTypes = {
  timeSeries: PropTypes.shape({
    '24h': PropTypes.array.isRequired,
    '7d': PropTypes.array.isRequired
  }).isRequired,
  signals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      note: PropTypes.string.isRequired
    })
  ).isRequired,
  onTimeRangeChange: PropTypes.func,
  timeRange: PropTypes.oneOf(['24h', '7d'])
};

DetectionPanel.defaultProps = {
  onTimeRangeChange: () => {},
  timeRange: '24h'
};

export default DetectionPanel;
