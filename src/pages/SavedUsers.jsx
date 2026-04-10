import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import UserCard from '../components/UserCard';
import { useNavigate } from 'react-router-dom';

const SavedUsers = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [savedUsers, setSavedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!currentUser || !userData) {
        setLoading(false);
        return;
      }
      
      const savedIds = userData.savedUserIds || [];
      if (savedIds.length === 0) {
        setSavedUsers([]);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const users = [];
        snapshot.forEach(doc => {
          if (savedIds.includes(doc.id)) {
            users.push({ ...doc.data(), id: doc.id });
          }
        });
        setSavedUsers(users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [currentUser, userData]);

  const handleConnect = async (user) => {
    // Just jump to profile when they trigger Connect from Bookmarks
    navigate(`/user/${user.id}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={48} className="animate-spin" color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bookmark color="var(--color-primary)" size={32} /> Saved Mentors
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Users you've bookmarked to connect with later.
        </p>
      </div>

      {savedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-bg-start)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}>
          You haven't saved any users yet. Head over to the Explore page to find mentors!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {savedUsers.map(user => (
            <UserCard key={user.id} user={user} onConnect={handleConnect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedUsers;
