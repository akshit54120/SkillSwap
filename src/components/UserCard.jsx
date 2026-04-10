import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Star, Bookmark, Award, Flame, Target } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const UserCard = ({ user, onConnect }) => {
  const { currentUser, userData } = useAuth();
  const currentCredits = userData?.credits ?? 0;
  
  const avgRating = user.reviewCount > 0 ? (user.ratingTotal / user.reviewCount) : 0;
  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : 'New';

  const isOnline = user.id ? String(user.id).charCodeAt(0) % 2 === 0 : true;
  const isTopMentor = avgRating >= 4.5 && user.reviewCount > 0;
  const isActiveUser = user.reviewCount > 0 || (user.skillsOffered?.length || 0) > 1;
  const isBeginner = !user.reviewCount || user.reviewCount === 0;

  const isSaved = userData?.savedUserIds?.includes(String(user.id));

  const toggleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      if (isSaved) {
        await updateDoc(userRef, { savedUserIds: arrayRemove(String(user.id)) });
      } else {
        await updateDoc(userRef, { savedUserIds: arrayUnion(String(user.id)) });
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
      
      {/* Bookmark Hook */}
      {currentUser && currentUser.uid !== user.id && (
        <button 
          onClick={toggleSave}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}
          title={isSaved ? "Remove Bookmark" : "Save User"}
        >
          <Bookmark size={20} color={isSaved ? "var(--color-primary)" : "var(--color-text-muted)"} fill={isSaved ? "var(--color-primary)" : "transparent"} />
        </button>
      )}

      <div className="flex items-center gap-4" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ 
              width: '3.5rem', height: '3.5rem', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'transparent', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary)', border: '2px solid var(--color-primary)'
          }}>
            {user.name?.charAt(0) || '?'}
          </div>
          {/* Online Indicator */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', backgroundColor: isOnline ? '#10B981' : '#9CA3AF', border: '2px solid var(--color-surface)', borderRadius: '50%' }} title={isOnline ? 'Online' : 'Offline'} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.name}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <Star size={12} fill="#10B981" /> {displayRating}
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>{user.availability || 'Weekends'}</p>
        </div>
      </div>

      {/* Badges System */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {isTopMentor && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
            <Award size={12} /> Top Mentor
          </span>
        )}
        {isActiveUser && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
            <Flame size={12} /> Active User
          </span>
        )}
        {isBeginner && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
            <Target size={12} /> Beginner
          </span>
        )}
      </div>
      
      <div style={{ flex: 1, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>Can Teach:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(user.skillsOffered || []).map(skill => (
              <span key={skill} className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{skill}</span>
            ))}
          </div>
        </div>
        
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>Wants to Learn:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(user.skillsWanted || []).map(skill => (
              <span key={skill} className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{skill}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.9rem', opacity: currentCredits < 3 ? 0.5 : 1 }} disabled={currentCredits < 3} onClick={() => onConnect(user)} title={currentCredits < 3 ? "Need 3 credits" : ""}>
          {currentCredits < 3 ? 'No Credits' : 'Connect'}
        </button>
        <Link to={`/user/${user.id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0.6rem 0', fontSize: '0.9rem' }}>
          Profile
        </Link>
      </div>
    </div>
  );
};

export default UserCard;
