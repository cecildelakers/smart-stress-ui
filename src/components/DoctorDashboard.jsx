import PropTypes from 'prop-types';
import './DoctorDashboard.css';
import './DetectionPanel.css';
import DetectionPanel from './DetectionPanel.jsx';
import {useState} from 'react';


function DoctorDetectionChart({series}) {
    if (!series || series.length === 0) {
        return null;
    }

    const values = series.map((point) => point.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;


    const polylinePoints = series
        .map((point, index) => {
            const x = (index / (series.length - 1)) * 100;
            const y = 100 - ((point.value - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="doctor-dashboard__chart">
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                role="img"
                aria-label="Recent HRV trend for monitored patients"
            >
                <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#5B7BFA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {series.map((point, index) => {
                    const x = (index / (series.length - 1)) * 100;
                    const y = 100 - ((point.value - min) / range) * 100;
                    return (
                        <circle
                            key={`${point.time}-${point.value}`}
                            cx={x}
                            cy={y}
                            r="2.2"
                            fill="#5B7BFA"
                            aria-hidden="true"
                        />
                    );
                })}
            </svg>
            <ul className="doctor-dashboard__chart-axis" aria-hidden="true">
                {series.map((point) => (
                    <li key={point.time}>{point.time}</li>
                ))}
            </ul>
        </div>
    );
}

DoctorDetectionChart.propTypes = {
    series: PropTypes.arrayOf(
        PropTypes.shape({
            time: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired
        })
    )
};

DoctorDetectionChart.defaultProps = {
    series: []
};

function DoctorDashboard({overview, patientProfile}) {
    const {stressBreakdown, totals, detection, patientTable, quickActions} = overview;
    const totalSegments = stressBreakdown.reduce((acc, segment) => acc + segment.value, 0) || 1;
    const [timeRange, setTimeRange] = useState('24h');

    let cumulative = 0;
    const gradientStops = stressBreakdown
        .map((segment) => {
            const start = (cumulative / totalSegments) * 360;
            cumulative += segment.value;
            const end = (cumulative / totalSegments) * 360;
            return `${segment.color} ${start}deg ${end}deg`;
        })
        .join(', ');

    return (
        <section className="doctor-dashboard">
            <header className="doctor-dashboard__top">
                <div>
                    <h2>Care team overview</h2>
                    <p>Track stress levels, engagement and focus patients in one place.</p>
                </div>
                <div className="doctor-dashboard__focus">
                    <span className="doctor-dashboard__focus-label">Focus patient</span>
                    <strong>{patientProfile.name}</strong>
                    <span>{patientProfile.primaryCondition}</span>
                    <span>Last refreshed: {patientProfile.lastRefresh}</span>
                </div>
            </header>

            <section className="doctor-dashboard__grid" aria-label="Stress and totals overview">
                <article className="doctor-dashboard__card doctor-dashboard__card--pie">
                    <div className="doctor-dashboard__card-header">
                        <h3>Stress level proportion</h3>
                    </div>
                    <div className="doctor-dashboard__pie-wrapper">
                        <div
                            className="doctor-dashboard__pie-chart"
                            style={{background: `conic-gradient(${gradientStops})`}}
                            role="img"
                            aria-label="Stress level distribution across patients"
                        />
                        <ul className="doctor-dashboard__legend">
                            {stressBreakdown.map((segment) => (
                                <li key={segment.id}>
                                    <span className="doctor-dashboard__legend-dot"
                                          style={{backgroundColor: segment.color}}/>
                                    <span>{segment.label}</span>
                                    <span className="doctor-dashboard__legend-value">{segment.value}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </article>

                <article className="doctor-dashboard__card doctor-dashboard__card--metric">
                    <div className="doctor-dashboard__card-header">
                        <h3>Total patients</h3>
                    </div>
                    <div className="doctor-dashboard__metric">{totals.patients}</div>
                    <p className="doctor-dashboard__metric-hint">Active across all programs</p>
                </article>

                <article className="doctor-dashboard__card doctor-dashboard__card--metric">
                    <div className="doctor-dashboard__card-header">
                        <h3>Total surveys</h3>
                    </div>
                    <div className="doctor-dashboard__metric">{totals.surveys}</div>
                    <p className="doctor-dashboard__metric-hint">Completed in the last 24h</p>
                </article>
            </section>

            <section className="doctor-dashboard__main">
                {/* Chart 卡片 */}

                <DetectionPanel
                    className="doctor-dashboard__card doctor-dashboard__card--chart"
                    timeSeries={detection.timeSeries}
                    signals={detection.signals}
                    onTimeRangeChange={setTimeRange}   // 将 state 更新传回 DetectionPanel
                    timeRange={timeRange}              // 当前选择状态传给 DetectionPanel
                />


                {/* Table 卡片 */}
                <article className="doctor-dashboard__card doctor-dashboard__card--table">
                    <div className="doctor-dashboard__card-header">
                        <h3>Patients details</h3>
                    </div>
                    <div className="doctor-dashboard__table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th scope="col">Patient</th>
                                <th scope="col">Status</th>
                                <th scope="col">Program</th>
                                <th scope="col">BPM (avg)</th>
                                <th scope="col">HRV (ms)</th>
                                <th scope="col">Stress index</th>
                                <th scope="col">Last survey</th>
                            </tr>
                            </thead>
                            <tbody>
                            {patientTable.map((row) => (
                                <tr key={row.id}>
                                    <th scope="row">{row.patient}</th>
                                    <td>{row.status}</td>
                                    <td>{row.program}</td>
                                    <td>{row.avgBpm}</td>
                                    <td>{row.avgHrv}</td>
                                    <td>{row.stressScore}</td>
                                    <td>{row.lastSurvey}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>

            <section className="doctor-dashboard__actions" aria-label="Quick coordination actions">
                {quickActions.map((action) => (
                    <button key={action} type="button" className="doctor-dashboard__action-btn">
                        {action}
                    </button>
                ))}
            </section>
        </section>
    );
}

DoctorDashboard.propTypes = {
    overview: PropTypes.shape({
        stressBreakdown: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
                value: PropTypes.number.isRequired,
                color: PropTypes.string.isRequired
            })
        ).isRequired,
        totals: PropTypes.shape({
            patients: PropTypes.number.isRequired,
            surveys: PropTypes.number.isRequired
        }).isRequired,
        detection: PropTypes.shape({
            label: PropTypes.string.isRequired,
            metric: PropTypes.string.isRequired,
            series: DoctorDetectionChart.propTypes.series
        }).isRequired,
        patientTable: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                patient: PropTypes.string.isRequired,
                status: PropTypes.string.isRequired,
                program: PropTypes.string.isRequired,
                avgBpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                avgHrv: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                stressScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                lastSurvey: PropTypes.string.isRequired
            })
        ).isRequired,
        quickActions: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    patientProfile: PropTypes.shape({
        name: PropTypes.string.isRequired,
        primaryCondition: PropTypes.string.isRequired,
        lastRefresh: PropTypes.string.isRequired
    }).isRequired
};

export default DoctorDashboard;

