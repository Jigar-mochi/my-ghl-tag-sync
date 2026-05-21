import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Activity, UserPlus, UserMinus } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch('http://localhost:3000/api/stats'),
          fetch('http://localhost:3000/api/logs')
        ]);
        
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        
        setStats(statsData);
        setLogs(logsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
        <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2 style={{ color: 'var(--text-muted)' }}>Loading Analytics...</h2>
        </div>
    );
  }

  // Format data for chart
  const chartData = (stats?.recentLogs || []).slice(0, 20).reverse().map(log => ({
    time: format(new Date(log.receivedAt), 'HH:mm'),
    added: log.addedTags ? log.addedTags.length : 0,
    removed: log.removedTags ? log.removedTags.length : 0
  }));

  return (
    <div className="dashboard-container">
      <header>
        <h1>Tag Analytics Dashboard</h1>
        <p>Real-time GoHighLevel Webhook Monitor</p>
      </header>

      <div className="metrics-grid">
        <div className="glass-card metric-item total">
          <h3><Activity size={18} style={{marginRight: '8px'}}/> Total Webhooks</h3>
          <p className="value">{stats?.totalWebhooks || 0}</p>
        </div>
        <div className="glass-card metric-item added">
          <h3><UserPlus size={18} style={{marginRight: '8px'}}/> Recent Tags Added</h3>
          <p className="value">{stats?.recentTagsAdded || 0}</p>
        </div>
        <div className="glass-card metric-item removed">
          <h3><UserMinus size={18} style={{marginRight: '8px'}}/> Recent Tags Removed</h3>
          <p className="value">{stats?.recentTagsRemoved || 0}</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', height: '350px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Tag Activity Trends</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" allowDecimals={false} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" name="Tags Added" dataKey="added" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{ r: 8 }} />
            <Line type="monotone" name="Tags Removed" dataKey="removed" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card table-container">
        <h3 style={{ marginTop: 0, color: 'var(--text-muted)', marginBottom: '1rem' }}>Recent Webhook Events</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Contact</th>
              <th>Added Tags</th>
              <th>Removed Tags</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id}>
                <td style={{ color: 'var(--text-muted)' }}>{format(new Date(log.receivedAt), 'MMM d, HH:mm:ss')}</td>
                <td>
                  <strong>{log.contactName || 'Unknown Contact'}</strong>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.email || log.phone || 'No contact info'}</span>
                </td>
                <td>
                  {log.addedTags && log.addedTags.length > 0 ? (
                    log.addedTags.map(t => <span key={t} className="tag added">+{t}</span>)
                  ) : <span className="tag neutral">None</span>}
                </td>
                <td>
                  {log.removedTags && log.removedTags.length > 0 ? (
                    log.removedTags.map(t => <span key={t} className="tag removed">-{t}</span>)
                  ) : <span className="tag neutral">None</span>}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No webhooks received yet. Waiting for events...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
