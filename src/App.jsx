import {useState, useEffect} from 'react';
import HeaderBar from './components/HeaderBar.jsx';
import DetectionPanel from './components/DetectionPanel.jsx';
import ExplainabilityPanel from './components/ExplainabilityPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import QuickActions from './components/QuickActions.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import {
    PATIENT_PROFILE,
    VITAL_SNAPSHOT,
    TIME_SERIES,
    EXPLANATIONS,
    STATUS_UPDATES,
    SURVEY_QUESTIONS,
    DOCTOR_OVERVIEW
} from './mockData.js';
import './App.css';

const INITIAL_MESSAGES = [
    {
        role: 'assistant',
        content: 'Welcome! Ask about the current status or request advice.'
    }
];

function formatCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function App() {
    const [activeTab, setActiveTab] = useState('patient');
    const [timeRange, setTimeRange] = useState('24h');
    const [lastRefresh, setLastRefresh] = useState(formatCurrentTime());
    const explanation = EXPLANATIONS[timeRange];

    useEffect(() => {
        // Update refresh time when component mounts (page refresh)
        setLastRefresh(formatCurrentTime());
    }, []);

    const profileWithRefresh = {
        ...PATIENT_PROFILE,
        lastRefresh: lastRefresh
    };

    return (
        <div className="app">
            <div className="app__tabs" role="tablist" aria-label="Dashboard mode">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'patient'}
                    className={activeTab === 'patient' ? 'app__tab-button app__tab-button--active' : 'app__tab-button'}
                    onClick={() => setActiveTab('patient')}
                    id="tab-patient"
                    aria-controls="panel-patient"
                >
                    For patient
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'doctor'}
                    className={activeTab === 'doctor' ? 'app__tab-button app__tab-button--active' : 'app__tab-button'}
                    onClick={() => setActiveTab('doctor')}
                    id="tab-doctor"
                    aria-controls="panel-doctor"
                >
                    For doctors
                </button>
            </div>
            {activeTab === 'patient' ? (
                <div id="panel-patient" role="tabpanel" aria-labelledby="tab-patient" className="app__panel">
                    <HeaderBar profile={profileWithRefresh}/>
                    <main className="layout">
                        <div className="layout__left">
                            <DetectionPanel
                                timeSeries={TIME_SERIES}
                                signals={VITAL_SNAPSHOT}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                            />
                        </div>
                        <div className="layout__right">
                            <ChatPanel initialMessages={INITIAL_MESSAGES} statusUpdates={STATUS_UPDATES}/>
                        </div>
                        <ExplainabilityPanel summary={explanation.summary} actions={explanation.actions}/>
                    </main>
                    <QuickActions surveyQuestions={SURVEY_QUESTIONS}/>
                </div>
            ) : (
                <div id="panel-doctor" role="tabpanel" aria-labelledby="tab-doctor" className="app__panel">
                    <DoctorDashboard overview={DOCTOR_OVERVIEW} patientProfile={profileWithRefresh}/>
                </div>
            )}
        </div>
    );
}

export default App;
