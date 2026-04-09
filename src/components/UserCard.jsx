import React from 'react';
import { Link } from 'react-router-dom';

const UserCard = ({ user, onConnect }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex items-center gap-4" style={{ marginBottom: '1rem' }}>
        <div style={{ 
            width: '3rem', height: '3rem', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--color-bg-start)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: 'var(--color-primary)', border: '1px solid var(--color-border)'
        }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{user.name}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{user.availability || 'Weekends'}</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '1.5rem', flex: 1 }}>
        <p className="input-label" style={{ marginBottom: '0.25rem' }}>Can Teach:</p>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {user.skillsOffered.map(skill => (
            <span key={skill} className="badge badge-purple">{skill}</span>
          ))}
        </div>
        
        <p className="input-label" style={{ marginBottom: '0.25rem' }}>Wants to Learn:</p>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {user.skillsWanted.map(skill => (
            <span key={skill} className="badge badge-blue">{skill}</span>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2" style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem 0' }} onClick={() => onConnect(user)}>
          Connect
        </button>
        <Link to={`/user/${user.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem 0' }}>
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default UserCard;
