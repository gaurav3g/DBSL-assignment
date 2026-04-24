import { useEffect, useState } from 'react';
import { getInsights, ingestEvent, DEMO_ACCOUNT_ID, DEMO_USER_ID } from '../api/client';
import UsageChart from '../components/UsageChart';
import ThresholdForm from '../components/ThresholdForm';
import AlertsPanel from '../components/AlertsPanel';

export default function InsightsPage() {
  const [chartData, setChartData] = useState([]);
  const [groupBy, setGroupBy] = useState('feature');
  const [loading, setLoading] = useState(true);
  const [simulatedCount, setSimulatedCount] = useState(0);

  // Fetch charts data
  async function fetchChartData() {
    setLoading(true);
    try {
      const resp = await getInsights({ accountId: DEMO_ACCOUNT_ID, groupBy });
      setChartData(resp.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChartData();
  }, [groupBy]);

  // Simulate an event (mock product usage)
  async function handleSimulateEvent(feature) {
    try {
      await ingestEvent({
        accountId: DEMO_ACCOUNT_ID,
        userId: DEMO_USER_ID,
        feature,
        action: 'simulate_click',
        metadata: { fromDemo: true }
      });
      setSimulatedCount(c => c + 1);
      // Refresh chart
      fetchChartData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="insights-page">
      <header className="page-header">
        <h1>Usage Insights</h1>
        <p>Monitor your team's product usage and set custom alerts.</p>
      </header>

      <div className="simulation-bar">
        <span>Simulate Events (to test metrics & alerts):</span>
        <button onClick={() => handleSimulateEvent('dashboard')} className="btn-secondary">Dashboard view</button>
        <button onClick={() => handleSimulateEvent('export')} className="btn-secondary">Export data</button>
        <button onClick={() => handleSimulateEvent('settings')} className="btn-secondary">Open settings</button>
        <span className="sim-counter">Simulated clicks: {simulatedCount}</span>
      </div>

      <div className="main-content-grid">
        {/* Left Column: Charts */}
        <section className="chart-section">
          <div className="chart-header">
            <h2>Usage Breakdown</h2>
            <div className="controls">
              <label>Group by:</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="feature">Feature</option>
                <option value="day">Day</option>
                <option value="user">Team Member</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            {loading ? <p>Loading chart data...</p> : <UsageChart data={chartData} groupBy={groupBy} />}
          </div>
        </section>

        {/* Right Column: Thresholds and Alerts */}
        <aside className="alerts-sidebar">
          <section className="threshold-section">
            <ThresholdForm />
          </section>
          
          <section className="alert-history-section">
            <AlertsPanel />
          </section>
        </aside>
      </div>
    </div>
  );
}
