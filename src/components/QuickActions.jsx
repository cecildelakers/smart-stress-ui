import { useState } from 'react';
import PropTypes from 'prop-types';
import { getPredictionDemo } from '../services/difyClient.js';
import './QuickActions.css';

function QuickActions({ surveyQuestions }) {
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyState, setSurveyState] = useState({});
  const [toast, setToast] = useState(null);

  const toggleSurvey = () => {
    setSurveyOpen((prev) => !prev);
  };

  const handleSurveyChange = (question, value) => {
    setSurveyState((prev) => ({ ...prev, [question]: value }));
  };

  const handleSurveySubmit = () => {
    setToast('Survey responses stored locally for the demo.');
    console.log('Survey submission (demo):', surveyState);
  };

  const handlePrediction = async () => {
    const result = await getPredictionDemo();
    setToast(`${result.title}: ${result.detail}`);
  };

  const handleStatusLog = () => {
    setToast('Demo note saved. Sync with backend when ready.');
  };

  const handleClearToast = () => setToast(null);

  return (
    <section className="actions">
      <h3>Quick Actions</h3>
      <div className="actions__grid">
        <div className="card">
          <h4>Survey</h4>
          <button type="button" onClick={toggleSurvey} className="card__primary">
            {surveyOpen ? 'Hide survey' : 'Open daily survey'}
          </button>
          {surveyOpen && (
            <div className="survey">
              {surveyQuestions.map((question) => (
                <label key={question}>
                  <span>{question}</span>
                  <input
                    type="text"
                    value={surveyState[question] || ''}
                    onChange={(event) => handleSurveyChange(question, event.target.value)}
                  />
                </label>
              ))}
              <button type="button" onClick={handleSurveySubmit} className="card__secondary">
                Save responses
              </button>
            </div>
          )}
        </div>
        <div className="card">
          <h4>Predict</h4>
          <p>Run the latest forecast for stress risk.</p>
          <button type="button" onClick={handlePrediction} className="card__primary">
            Run forecast
          </button>
        </div>
        <div className="card">
          <h4>Status Record</h4>
          <p>Log a quick note about the patient.</p>
          <button type="button" onClick={handleStatusLog} className="card__primary">
            Log manual note
          </button>
        </div>
        <div className="card">
          <h4>Week / Month Report</h4>
          <p>Download the latest summary reports.</p>
          <div className="card__downloads">
            <a href="/reports/patient1-weekly-demo.txt" download>
              Download weekly
            </a>
            <a href="/reports/patient1-monthly-demo.txt" download>
              Download monthly
            </a>
          </div>
        </div>
      </div>
      {toast && (
        <div className="actions__toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={handleClearToast} aria-label="Close notification">
            ×
          </button>
        </div>
      )}
    </section>
  );
}

QuickActions.propTypes = {
  surveyQuestions: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default QuickActions;
