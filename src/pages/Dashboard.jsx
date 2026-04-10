import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Users, Activity, Repeat, CheckCircle, Star, Award, TrendingUp, Loader2 } from 'lucide-react';
import { seedFirestore } from '../utils/firestoreSeeder';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4" style={{ padding: '1.5rem' }}>
    <div style={{ backgroundColor: `${color}15`, color: color, padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
      <Icon size={24} />
    </div>
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value.toLocaleString()}</h3>
    </div>
  </div>
);

const LeaderboardCard = ({ user, rank }) => {
  const getRankBadge = (r) => {
    switch(r) {
      case 1: return { icon: "🥇", color: "#FFD700", label: "Gold Mentor" };
      case 2: return { icon: "🥈", color: "#C0C0C0", label: "Silver Mentor" };
      case 3: return { icon: "🥉", color: "#CD7F32", label: "Bronze Mentor" };
      default: return null;
    }
  };
  
  const badge = getRankBadge(rank);

  return (
    <div className="card flex items-center justify-between" style={{ padding: '1.5rem', borderLeft: `4px solid ${badge.color}` }}>
      <div className="flex items-center gap-4">
        <div style={{ 
          width: '3.5rem', height: '3.5rem', borderRadius: '50%', 
          backgroundColor: 'var(--color-bg-start)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase' 
        }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{user.name}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Top Skill: {user.skillsOffered?.[0] || 'Expert'}</p>
        </div>
      </div>
      
      <div className="flex gap-8 items-center">
        <div className="text-center">
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Rating</p>
          <div className="flex items-center gap-1" style={{ fontWeight: 600 }}>
            <Star size={14} color="#FBBF24" fill="#FBBF24" /> {user.rating || 'N/A'}
          </div>
        </div>
        
        <div className="text-center">
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Sessions</p>
          <div style={{ fontWeight: 600 }}>{user.completedSessions || 0}</div>
        </div>
        
        <div style={{ 
          backgroundColor: `${badge.color}20`, color: badge.color, 
          padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', 
          fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' 
        }}>
          {badge.icon} {badge.label}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await seedFirestore();
      
      // Real-time stats listener
      const statsUnsubscribe = onSnapshot(doc(db, 'platformStats', 'dashboard'), (doc) => {
        if (doc.exists()) {
          setStats(doc.data());
        }
      });

      // Leaderboard query: top 3 by rating desc, completedSessions desc
      // Note: This requires a composite index if filtered, but simple sorting might work or we can fetch all and sort
      // For top 3, we can just fetch all users (since we have few) and sort in JS to avoid complex index creation in demo
      const usersRef = collection(db, 'users');
      const leaderboardUnsubscribe = onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const top3 = users
          .sort((a, b) => {
            const rA = a.rating || 0;
            const rB = b.rating || 0;
            const sA = a.completedSessions || 0;
            const sB = b.completedSessions || 0;
            if (rB !== rA) return rB - rA;
            return sB - sA;
          })
          .slice(0, 3);
        setLeaderboard(top3);
        setLoading(false);
      });

      return () => {
        statsUnsubscribe();
        leaderboardUnsubscribe();
      };
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Platform Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Live statistics and community leaderboard.</p>
      </header>

      {/* Stats Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} color="var(--color-primary)" /> Platform Activity
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats?.totalUsers || 0} 
            color="var(--color-primary)" 
          />
          <StatCard 
            icon={Activity} 
            label="Active Users" 
            value={stats?.activeUsers || 0} 
            color="#ec4899" 
          />
          <StatCard 
            icon={Repeat} 
            label="Connections" 
            value={stats?.totalConnections || 0} 
            color="#8b5cf6" 
          />
          <StatCard 
            icon={CheckCircle} 
            label="Sessions Completed" 
            value={stats?.completedSessions || 0} 
            color="#10b981" 
          />
        </div>
      </section>

      {/* Leaderboard Section */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={24} color="#FBBF24" /> Top 3 Tutors
        </h2>
        <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
          {leaderboard.map((user, index) => (
            <LeaderboardCard key={user.id} user={user} rank={index + 1} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
