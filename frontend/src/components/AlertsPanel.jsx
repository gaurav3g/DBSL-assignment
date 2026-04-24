import { useEffect, useState } from 'react';
import { getTriggeredAlerts, DEMO_ACCOUNT_ID } from '../api/client';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAlerts() {
    try {
      const data = await getTriggeredAlerts(DEMO_ACCOUNT_ID);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
    // In a real app we might poll for new alerts, but for demo we just fetch once
    const interval = setInterval(fetchAlerts, 5000); // Poll every 5s for the demo
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="alerts-panel"><p>Loading alerts...</p></div>;

  return (
    <div className="alerts-panel">
      <h3 className="section-title">Triggered Alerts History</h3>
      {alerts.length === 0 ? (
        <p className="no-alerts-msg">No alerts triggered yet. Safe and sound!</p>
      ) : (
        <ul className="alerts-list">
          {alerts.map((alert) => (
            <li key={alert.id} className="alert-item">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Feature '{alert.feature}' Event Threshold Reached</strong>
                <p>Recorded {alert.event_count} events (Limit is {alert.limit_count} per {alert.window_days} day window).</p>
                <small className="alert-time">Triggered at: {new Date(alert.triggered_at).toLocaleString()}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
