import PropTypes from 'prop-types';
import './ExplainabilityPanel.css';

function ExplainabilityPanel({ summary, actions }) {
  return (
    <section className="explain">
      <h3>Explainability + Advice</h3>
      <p className="explain__summary">{summary}</p>
      <h4>Suggested actions</h4>
      <ul>
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  );
}

ExplainabilityPanel.propTypes = {
  summary: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ExplainabilityPanel;
