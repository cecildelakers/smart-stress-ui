import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getPrediction, getPredictionDemo } from '../services/apiClient.js';
import { PATIENT_PROFILE } from '../mockData.js';
import './QuickActions.css';

function QuickActions({ surveyQuestions }) {
    const [surveyOpen, setSurveyOpen] = useState(false);
    const [surveyState, setSurveyState] = useState({}); // { [questionId]: 1..5 }
    const [surveyConfirmed, setSurveyConfirmed] = useState(false);
    const [surveyError, setSurveyError] = useState('');
    const [toast, setToast] = useState(null);

    // SSSQ: Short Stress State Questionnaire (6 items, Likert 1-5)
    const SSSQ_QUESTIONS = useMemo(() => ([
        { id: 'q1', text: 'I was committed to attaining my performance goals' },
        { id: 'q2', text: 'I wanted to succeed on the task' },
        { id: 'q3', text: 'I was motivated to do the task' },
        { id: 'q4', text: 'I reflected about myself' },
        { id: 'q5', text: 'I was worried about what other people think of me' },
        { id: 'q6', text: 'I felt concerned about the impression I was making' }
    ]), []);

    const SSSQ_OPTIONS = useMemo(() => ([
        { value: 1, label: 'Not at all' },
        { value: 2, label: 'A little bit' },
        { value: 3, label: 'Somewhat' },
        { value: 4, label: 'Very much' },
        { value: 5, label: 'Extremely' }
    ]), []);

    const toggleSurvey = () => {
        if (!surveyConfirmed) setSurveyOpen((prev) => !prev);
    };

    const handleSurveyChange = (questionId, value) => {
        setSurveyState((prev) => ({ ...prev, [questionId]: Number(value) }));
    };

    const handleSurveyClose = () => {
        setSurveyOpen(false);
        setSurveyError('');
    };

    const handleSurveyConfirm = () => {
        // Validate: all 6 answers present (values 1..5)
        const allFilled = SSSQ_QUESTIONS.every(q => typeof surveyState[q.id] === 'number');

        if (!allFilled) {
            setSurveyError('Please fill in all fields before confirming.');
            return;
        }

        // Build survey record
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const patientName = PATIENT_PROFILE?.name || 'patient';

        const findLabel = (value) => (SSSQ_OPTIONS.find(o => o.value === value)?.label || '');
        const totalScore = SSSQ_QUESTIONS.reduce((sum, q) => sum + (surveyState[q.id] || 0), 0);

        const lines = [
            `Survey: Short Stress State Questionnaire (SSSQ)`,
            `Patient: ${patientName}`,
            `Date: ${yyyy}-${mm}-${dd}`,
            ``,
            ...SSSQ_QUESTIONS.map((q, idx) => {
                const val = surveyState[q.id];
                return `${idx + 1}. ${q.text}\n   Answer: ${findLabel(val)} (${val})`;
            }),
            ``,
            `Total Score: ${totalScore}`
        ];

        const fileContent = lines.join('\n');
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const filename = `${patientName.replace(/\s+/g, '')}_survey_${yyyy}_${mm}_${dd}.txt`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setSurveyConfirmed(true);
        setSurveyOpen(false);
        setSurveyError('');
        setToast('Survey submitted and downloaded. Thank you!');
    };


    const handlePrediction = async () => {
        try {
            const result = await getPrediction('patient-1');
            setToast(`${result.title || 'Prediction'}: ${result.detail || result.message || JSON.stringify(result)}`);
        } catch (error) {
            console.warn('Backend prediction failed, using demo:', error);
            const result = await getPredictionDemo();
            setToast(`${result.title}: ${result.detail}`);
        }
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
                        <h4>Short Stress State Questionnaire (SSSQ)</h4>

                        {SSSQ_QUESTIONS.map((q) => (
                            <div className="survey-question" key={q.id}>
                                <span>{q.text}</span>
                                <div className="survey-options">
                                    {SSSQ_OPTIONS.map((opt) => (
                                        <label key={opt.value}>
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt.value}
                                                checked={surveyState[q.id] === opt.value}
                                                onChange={(e) => handleSurveyChange(q.id, e.target.value)}
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* 按钮区域 */}
                        <div className="survey-modal__buttons">
                            {surveyError && <span className="survey-modal__error">{surveyError}</span>}
                            <button type="button" className="card__secondary" onClick={handleSurveyClose}>
                                Close
                            </button>
                            <button type="button" className="card__primary" onClick={handleSurveyConfirm}>
                                Submit
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
