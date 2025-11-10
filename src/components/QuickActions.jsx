import {useState} from 'react';
import PropTypes from 'prop-types';
import {getPredictionDemo} from '../services/difyClient.js';
import './QuickActions.css';

function QuickActions({surveyQuestions}) {
    const [surveyOpen, setSurveyOpen] = useState(false);
    const [surveyState, setSurveyState] = useState({});
    const [surveyConfirmed, setSurveyConfirmed] = useState(false);
    const [surveyError, setSurveyError] = useState('');
    const [toast, setToast] = useState(null);

    const toggleSurvey = () => {
        if (!surveyConfirmed) setSurveyOpen((prev) => !prev);
    };

    const handleSurveyChange = (question, value) => {
        setSurveyState((prev) => ({...prev, [question]: value}));
    };

    const handleSurveyClose = () => {
        setSurveyOpen(false);
        setSurveyError('');
    };

    const handleSurveyConfirm = () => {
        const allFilled =
            surveyState.stressLevel &&
            surveyState.mindfulness &&
            surveyState.comments &&
            surveyState.stressLevel.trim() !== '' &&
            surveyState.mindfulness.trim() !== '' &&
            surveyState.comments.trim() !== '';

        if (!allFilled) {
            setSurveyError('Please fill in all fields before confirming.');
            return;
        }

        setSurveyConfirmed(true);
        setSurveyOpen(false);
        setSurveyError('');
        setToast('Survey confirmed. Thank you!');
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
                    <p>Please answer the questions honestly.</p>
                    <button
                        type="button"
                        onClick={toggleSurvey}
                        className="card__primary"
                        disabled={surveyConfirmed}
                    >
                        {surveyConfirmed ? 'Survey completed' : 'Open daily survey'}
                    </button>
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

            {surveyOpen && !surveyConfirmed && (
                <div className="survey-modal">
                    <div className="survey-modal__content">
                        <h4>Daily Survey</h4>

                        {/* 第一个问题：Stress level 1-5 */}
                        <div className="survey-question">
                            <span>How would you rate your current stress level?</span>
                            <div className="survey-options">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <label key={level}>
                                        <input
                                            type="radio"
                                            name="stressLevel"
                                            value={level}
                                            checked={surveyState['stressLevel'] === String(level)}
                                            onChange={(e) =>
                                                setSurveyState((prev) => ({...prev, stressLevel: e.target.value}))
                                            }
                                        />
                                        {level}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 第二个问题：Mindfulness completed Yes/No */}
                        <div className="survey-question">
                            <span>Did you complete your mindfulness exercise today?</span>
                            <div className="survey-options">
                                {['Yes', 'No'].map((option) => (
                                    <label key={option}>
                                        <input
                                            type="radio"
                                            name="mindfulness"
                                            value={option}
                                            checked={surveyState['mindfulness'] === option}
                                            onChange={(e) =>
                                                setSurveyState((prev) => ({...prev, mindfulness: e.target.value}))
                                            }
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 第三个问题：保持文本输入 */}
                        <div className="survey-question">
                            <span>Any other comments?</span>
                            <input
                                type="text"
                                value={surveyState['comments'] || ''}
                                onChange={(e) =>
                                    setSurveyState((prev) => ({...prev, comments: e.target.value}))
                                }
                            />
                        </div>

                        {/* 按钮区域 */}
                        <div className="survey-modal__buttons">
                            {surveyError && <span className="survey-modal__error">{surveyError}</span>}
                            <button type="button" className="card__secondary" onClick={handleSurveyClose}>
                                Close
                            </button>
                            <button type="button" className="card__primary" onClick={handleSurveyConfirm}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}


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
