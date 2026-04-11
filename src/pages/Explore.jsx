import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserCard from '../components/UserCard';
import { MOCK_USERS } from '../data/users';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { handleConnect as createConversation } from '../services/ChatService';
import { addNotification } from '../services/NotificationService';

const CATEGORIES = ['Programming', 'Design', 'Music', 'Language', 'Marketing', 'Finance', 'Food', 'Fitness'];
const AVAILABILITIES = ['Mornings', 'Afternoons', 'Evenings', 'Weekdays', 'Weekends', 'Flexible'];

const CATEGORY_MAP = {
  Programming: ['react', 'javascript', 'node.js', 'python', 'machine learning', 'data analysis', 'sql', 'swift', 'react native'],
  Design: ['ui design', 'figma', 'sketch', 'ui/ux design', 'photoshop', 'lightroom', 'photography'],
  Music: ['guitar', 'music theory'],
  Language: ['hindi', 'english'],
  Marketing: ['digital marketing', 'seo', 'copywriting', 'marketing'],
  Finance: ['accounting', 'excel', 'personal finance'],
  Food: ['cooking', 'baking'],
  Fitness: ['yoga', 'fitness training', 'nutrition']
};

const ALL_SKILLS = Object.values(CATEGORY_MAP).flat();

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOfferedCategories, setSelectedOfferedCategories] = useState([]);
  const [selectedWantedCategories, setSelectedWantedCategories] = useState([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState([]);
  const [connectionMessage, setConnectionMessage] = useState(null);
  const [realUsers, setRealUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // 🔥 Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const users = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          if (currentUser && data.uid === currentUser.uid) return;

          users.push({
            ...data,
            id: data.uid || data.id || doc.id,
            uid: data.uid || data.id || doc.id,
            isRealUser: true
          });
        });

        setRealUsers(users);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // 🔥 Merge real + mock users
  const realEmails = realUsers.map(u => u.email);
  const mockUsers = MOCK_USERS.filter(u => !realEmails.includes(u.email));
  const allUsers = [...realUsers, ...mockUsers];

  // 🔍 Filter logic
  const filteredUsers = allUsers.filter(user => {
    const term = searchTerm.toLowerCase();

    const matchesName = user.name?.toLowerCase().includes(term);
    const offeredSkills = user.skillsOffered || [];
    const wantedSkills = user.skillsWanted || [];

    const matchesSearch =
      matchesName ||
      offeredSkills.some(s => s.toLowerCase().includes(term)) ||
      wantedSkills.some(s => s.toLowerCase().includes(term));

    const matchesOfferedCategory =
      selectedOfferedCategories.length === 0 ||
      selectedOfferedCategories.some(cat => {
        const skills = CATEGORY_MAP[cat] || [];
        return offeredSkills.some(s => skills.includes(s.toLowerCase()));
      });

    const matchesWantedCategory =
      selectedWantedCategories.length === 0 ||
      selectedWantedCategories.some(cat => {
        const skills = CATEGORY_MAP[cat] || [];
        return wantedSkills.some(s => skills.includes(s.toLowerCase()));
      });

    const matchesAvailability =
      selectedAvailabilities.length === 0 ||
      (user.availability && selectedAvailabilities.includes(user.availability));

    return matchesSearch && matchesOfferedCategory && matchesWantedCategory && matchesAvailability;
  });

  const toggleOfferedCategory = (cat) => {
    setSelectedOfferedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleWantedCategory = (cat) => {
    setSelectedWantedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleAvailability = (avail) => {
    setSelectedAvailabilities(prev =>
      prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]
    );
  };

  // 🔥 CONNECT LOGIC (final hybrid)
  const handleConnect = async (user) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if ((userData?.credits ?? 0) < 3) {
      setConnectionMessage('You need at least 3 credits to make a request.');
      setTimeout(() => setConnectionMessage(null), 3000);
      return;
    }

    setConnectionMessage(`Connecting you with ${user.name}...`);

    try {
      const q = query(
        collection(db, 'requests'),
        where('senderId', '==', String(currentUser.uid)),
        where('receiverId', '==', String(user.id))
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setConnectionMessage(`You've already sent a request to ${user.name}!`);
        const convo = await createConversation(
          { id: String(currentUser.uid), name: userData?.name || currentUser.displayName || 'Unknown' },
          { id: String(user.id), name: user.name }
        );
        if (convo?.id) {
          navigate(`/chat/${convo.id}`, {
            state: { targetUser: user }
          });
        }
      } else {
        await addDoc(collection(db, 'requests'), {
          senderId: String(currentUser.uid),
          senderName: userData?.name || currentUser.displayName || 'Unknown',
          receiverId: String(user.id),
          receiverName: user.name,
          receiverEmail: user.email || '',
          senderEmail: currentUser.email || '',
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

        // ⚡ instant chat (hackathon advantage)
        const convo = await createConversation(
          { id: String(currentUser.uid), name: userData?.name || currentUser.displayName || 'Unknown' },
          { id: String(user.id), name: user.name }
        );

        if (convo?.id) {
          navigate(`/chat/${convo.id}`, {
            state: { targetUser: user }
          });
        }

        setConnectionMessage(`Connected with ${user.name}!`);
      }
    } catch (err) {
      console.error(err);
      setConnectionMessage("Something went wrong.");
    }

    setTimeout(() => setConnectionMessage(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Explore Mentors</h2>
          
          <div className="input-group" style={{ margin: 0, minWidth: '300px', flex: 1, maxWidth: '500px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Search by name or specific skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ paddingLeft: '3rem', marginBottom: 0 }}
              />
              {showSuggestions && searchTerm.trim() !== '' && ALL_SKILLS.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--color-bg-start)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', zIndex: 50, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
                  {ALL_SKILLS.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map(s => (
                    <div 
                      key={s} 
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', textTransform: 'capitalize', fontSize: '0.9rem' }}
                      onMouseDown={(e) => { e.preventDefault(); setSearchTerm(s); setShowSuggestions(false); }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Filter size={18} /> Filters {(selectedOfferedCategories.length + selectedWantedCategories.length + selectedAvailabilities.length) > 0 && `(${selectedOfferedCategories.length + selectedWantedCategories.length + selectedAvailabilities.length})`}
          </button>
        </div>

        {showFilters && (
          <div className="card animate-fade-in" style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-start)', border: '1px solid var(--color-border)' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
              
              {/* Skills Offered Filter */}
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Skills Offered (Teaching)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedOfferedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleOfferedCategory(cat)}
                        style={{
                          background: isSelected ? 'var(--color-primary)' : 'transparent',
                          color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: isSelected ? '600' : 'normal'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills Wanted Filter */}
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Skills Wanted (Learning)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedWantedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleWantedCategory(cat)}
                        style={{
                          background: isSelected ? '#3B82F6' : 'transparent',
                          color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid var(--color-border)',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: isSelected ? '600' : 'normal'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Availability</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {AVAILABILITIES.map(avail => {
                    const isSelected = selectedAvailabilities.includes(avail);
                    return (
                      <button
                        key={avail}
                        onClick={() => toggleAvailability(avail)}
                        style={{
                          background: isSelected ? 'var(--color-secondary)' : 'transparent',
                          color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                          border: isSelected ? '1px solid var(--color-secondary)' : '1px solid var(--color-border)',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: isSelected ? '600' : 'normal'
                        }}
                      >
                        {avail}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Clear Filters Hook */}
            {((selectedOfferedCategories.length + selectedWantedCategories.length + selectedAvailabilities.length) > 0 || searchTerm !== '') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button 
                  onClick={() => { setSelectedOfferedCategories([]); setSelectedWantedCategories([]); setSelectedAvailabilities([]); setSearchTerm(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {connectionMessage && (
        <div className="animate-fade-in" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {connectionMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <UserCard key={user.id} user={user} onConnect={handleConnect} />
          ))
        ) : (
          <div>No users found</div>
        )}
      </div>
    </div>
  );
};

export default Explore;