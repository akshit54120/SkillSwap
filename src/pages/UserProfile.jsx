import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageCircle, Loader2, Star, Award, Flame, Target } from 'lucide-react';
import MentorBadge from '../components/MentorBadge';
import { MOCK_USERS } from '../data/users';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { handleConnect as createConversation } from '../services/ChatService';
import { addNotification } from '../services/NotificationService';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check mock users
        const mockUser = MOCK_USERS.find(u => String(u.id) === String(id));
        if (mockUser) {
          setUser(mockUser);
        } else {
          // Check Firebase
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), id: userDoc.id });
          }
        }

        // Fetch reviews seamlessly
        try {
          const qReviews = query(collection(db, 'reviews'), where('receiverId', '==', String(id)));
          const revSnapshot = await getDocs(qReviews);
          const revs = revSnapshot.docs.map(d => ({ 
            id: d.id, 
            ...d.data(), 
            time: d.data().createdAt?.toDate()?.toLocaleDateString() || 'Recently' 
          }));
          setReviews(revs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        } catch (e) { 
          console.error("Error fetching reviews", e); 
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>User Not Found</h2>
        <Link to="/explore" className="btn btn-primary">Back to Explore</Link>
      </div>
    );
  }

  const handleConnectAction = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if ((userData?.credits ?? 0) < 3) {
      alert('You need at least 3 credits to make a connection request.');
      return;
    }

    try {
      const q = query(
        collection(db, 'requests'),
        where('senderId', '==', String(currentUser.uid)),
        where('receiverId', '==', String(user.id))
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Already sent - redirect to chat without spending credits
        const convo = await createConversation(
          { id: String(currentUser.uid), name: userData?.name || currentUser.displayName || 'Unknown' },
          { id: String(user.id), name: user.name }
        );
        if (convo?.id) {
          navigate(`/chat/${convo.id}`, { state: { targetUser: user } });
        }
      } else {
        await addDoc(collection(db, 'requests'), {
          senderId: String(currentUser.uid),
          senderName: userData?.name || currentUser.displayName || 'Unknown',
          receiverId: String(user.id),
          receiverName: user.name,
          skillWanted: user.skillsOffered?.[0] || 'Any',
          skillOffered: userData?.skillsOffered?.[0] || 'Any',
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Notify the recipient
        await addNotification({
          recipientId: String(user.id),
          type: 'request',
          senderName: userData?.name || currentUser.displayName || 'Someone',
          content: 'sent you a connection request!',
          link: '/requests'
        });

        await updateDoc(doc(db, 'users', currentUser.uid), {
          credits: increment(-1)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: currentUser.uid,
          amount: -1,
          type: 'Spent',
          description: `Sent connection request to ${user.name}`,
          createdAt: serverTimestamp()
        });
        
        // Instant chat navigation
        const convo = await createConversation(
          { id: String(currentUser.uid), name: userData?.name || currentUser.displayName || 'Unknown' },
          { id: String(user.id), name: user.name }
        );
        if (convo?.id) {
          navigate(`/chat/${convo.id}`, {
            state: { targetUser: user }
          });
        } else {
          alert(`Connection request sent to ${user.name}!`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const convo = await createConversation(
        { id: String(currentUser.uid), name: userData?.name || currentUser.displayName || 'Unknown' },
        { id: String(user.id), name: user.name }
      );
      if (convo?.id) {
        navigate(`/chat/${convo.id}`, { state: { targetUser: user } });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to open chat.");
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/explore" className="flex items-center gap-2" style={{ color: 'var(--color-primary)', fontWeight: '500', display: 'inline-flex' }}>
          <ArrowLeft size={18} /> Back to Explore
        </Link>
      </div>

      <div className="card">
        <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ 
              width: '8rem', height: '8rem', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'var(--color-bg-start)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)', border: '2px solid var(--color-primary)',
              fontSize: '3rem', fontWeight: 'bold'
            }}>
              {user.name?.charAt(0) || '?'}
            </div>
            {/* Online Indicator */}
            <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', width: '20px', height: '20px', backgroundColor: (user.id ? String(user.id).charCodeAt(0) % 2 === 0 : true) ? '#10B981' : '#9CA3AF', border: '3px solid var(--color-surface)', borderRadius: '50%' }} title="Status" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: 0 }}>{user.name}</h2>
            <MentorBadge credits={user.credits} size={24} />
          </div>
          
          {/* Top Badges Row */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
             {((user.reviewCount > 0 ? (user.ratingTotal / user.reviewCount) : 0) >= 4.5 && user.reviewCount > 0) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontWeight: 600 }}>
                <Award size={14} /> Top Mentor
              </span>
             )}
             {(user.reviewCount > 0 || (user.skillsOffered?.length || 0) > 1) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontWeight: 600 }}>
                <Flame size={14} /> Active User
              </span>
             )}
             {(!user.reviewCount || user.reviewCount === 0) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontWeight: 600 }}>
                <Target size={14} /> Beginner
              </span>
             )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <Star size={16} fill="#10B981" /> 
              {user.reviewCount > 0 ? (user.ratingTotal / user.reviewCount).toFixed(1) : 'New'}
            </span>
            {user.reviewCount > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({user.reviewCount} reviews)</span>}
          </div>

          <p className="flex items-center justify-center gap-1" style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            <Calendar size={16} /> Available: {user.availability || 'Weekends'}
          </p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary flex items-center gap-2" onClick={handleConnectAction} disabled={(userData?.credits ?? 0) < 3} style={{ opacity: (userData?.credits ?? 0) < 3 ? 0.5 : 1 }}>
               {(userData?.credits ?? 0) < 3 ? 'No Credits' : 'Connect'}
            </button>
            <button className="btn btn-outline flex items-center gap-2" onClick={handleMessage}>
              <MessageCircle size={18} /> Message
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>About Me</h3>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {user.bio || 'No bio provided.'}
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Can Teach</h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {(user.skillsOffered || []).map(skill => (
                  <span key={skill} className="badge badge-purple" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>{skill}</span>
                ))}
                {(!user.skillsOffered || user.skillsOffered.length === 0) && (
                  <span style={{ color: 'var(--color-text-secondary)' }}>None specified</span>
                )}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Wants to Learn</h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {(user.skillsWanted || []).map(skill => (
                  <span key={skill} className="badge badge-blue" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>{skill}</span>
                ))}
                {(!user.skillsWanted || user.skillsWanted.length === 0) && (
                  <span style={{ color: 'var(--color-text-secondary)' }}>None specified</span>
                )}
              </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Recent Reviews
            </h3>

            {reviews.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-start)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                No reviews yet. Connect with {user.name} to be the first!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map(rev => (
                  <div key={rev.id} style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-start)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{rev.reviewerName}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{rev.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} color={s <= rev.rating ? "#10B981" : "var(--color-border)"} fill={s <= rev.rating ? "#10B981" : "transparent"} />
                      ))}
                    </div>
                    {rev.reviewText && (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>"{rev.reviewText}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
