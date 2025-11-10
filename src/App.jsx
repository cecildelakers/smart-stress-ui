import {useState, useEffect} from 'react';
import HeaderBar from './components/HeaderBar.jsx';
import DetectionPanel from './components/DetectionPanel.jsx';
import ExplainabilityPanel from './components/ExplainabilityPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import QuickActions from './components/QuickActions.jsx';
import {
    PATIENT_PROFILE,
    VITAL_SNAPSHOT,
    TIME_SERIES,
    EXPLANATIONS,
    STATUS_UPDATES,
    SURVEY_QUESTIONS
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
    );
}

export default App;
