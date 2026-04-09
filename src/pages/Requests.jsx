import React, { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';

const MOCK_REQUESTS = [
  { id: 1, user: 'John Smith', skillWanted: 'React', skillOffered: 'Python', status: 'pending', time: '2 hours ago' },
  { id: 2, user: 'Sarah Connor', skillWanted: 'HTML/CSS', skillOffered: 'UX Design', status: 'accepted', time: '1 day ago' },
  { id: 3, user: 'Mike Johnson', skillWanted: 'JavaScript', skillOffered: 'Guitar', status: 'pending', time: '3 days ago' },
];

const Requests = () => {
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const handleAction = (id, action) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: action === 'accept' ? 'accepted' : 'rejected' } : req
    ));
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Connection Requests</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your incoming skill exchange propositions.</p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--color-primary)" /> Pending Requests ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 2rem', color: 'var(--color-text-secondary)' }}>
            You have no pending requests right now.
          </div>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map(req => (
              <div key={req.id} className="card flex items-center justify-between" style={{ padding: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{req.user}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Wants to learn <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.skillWanted}</span> • 
                    Can teach <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{req.skillOffered}</span>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{req.time}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
                    onClick={() => handleAction(req.id, 'reject')}
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#dcfce7', color: '#22c55e', padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
                    onClick={() => handleAction(req.id, 'accept')}
                    title="Accept"
                  >
                    <Check size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
          Past Connections
        </h3>
        <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
          {pastRequests.map(req => (
            <div key={req.id} className="card flex items-center justify-between" style={{ padding: '1.25rem', opacity: 0.8 }}>
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{req.user}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Exchange: {req.skillWanted} for {req.skillOffered}
                </p>
              </div>
              <div>
                {req.status === 'accepted' ? (
                  <span className="badge badge-green">Accepted</span>
                ) : (
                  <span className="badge badge-gray">Rejected</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Requests;
