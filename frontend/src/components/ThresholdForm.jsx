import { useState } from 'react';
import { createThreshold } from '../api/client';
import { DEMO_ACCOUNT_ID } from '../api/client';

const FEATURES = ['dashboard', 'export', 'search', 'reports', 'settings'];

/**
 * Form to create a new threshold rule.
 *
 * Props:
 *   onCreated – callback called with the new threshold object after creation
 */
export default function ThresholdForm({ onCreated }) {
  const [feature,     setFeature]     = useState('dashboard');
  const [windowDays,  setWindowDays]  = useState(1);
  const [limitCount,  setLimitCount]  = useState(100);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const threshold = await createThreshold({
        accountId:  DEMO_ACCOUNT_ID,
        feature,
        windowDays: parseInt(windowDays, 10),
        limitCount: parseInt(limitCount, 10),
      });
      setSuccessMsg(`Threshold created: alert when "${threshold.feature}" hits ${threshold.limit_count} events in ${threshold.window_days} day(s).`);
      if (onCreated) onCreated(threshold);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create threshold.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="threshold-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Add Alert Threshold</h3>

      <div className="form-row">
        <label htmlFor="threshold-feature">Feature</label>
        <select
          id="threshold-feature"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
        >
          {FEATURES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="threshold-window">Rolling window (days)</label>
        <input
          id="threshold-window"
          type="number"
          min="1"
          max="90"
          value={windowDays}
          onChange={(e) => setWindowDays(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor="threshold-limit">Alert when count reaches</label>
        <input
          id="threshold-limit"
          type="number"
          min="1"
          value={limitCount}
          onChange={(e) => setLimitCount(e.target.value)}
        />
      </div>

      {error      && <p className="form-error">{error}</p>}
      {successMsg && <p className="form-success">{successMsg}</p>}

      <button id="create-threshold-btn" type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Create Threshold'}
      </button>
    </form>
  );
}
