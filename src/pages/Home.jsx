import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Book, Users, TrendingUp, ArrowRight, GraduationCap, BookOpen, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="card text-center flex items-center justify-center" style={{ flexDirection: 'column', height: '100%', padding: '2.5rem 1.5rem' }}>
    <div style={{ 
      background: 'var(--color-bg-start)', 
      width: '5rem', 
      height: '5rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: 'var(--radius-full)', 
      marginBottom: '1.5rem', 
      color: 'var(--color-primary)' 
    }}>
      <Icon size={36} />
    </div>
    <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{description}</p>
  </div>
);

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <span className="badge hero-badge" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              We're Live! Start swapping skills today
            </span>
          </div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Exchange Skills, Not Money
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Learn. Teach. Grow Together. Connect with students to learn and teach skills collaboratively in a peer-to-peer ecosystem.
          </p>
          <div className="flex justify-center gap-4">
            <Link to={currentUser ? "/explore" : "/signup"} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              {currentUser ? "Continue Exploring" : "Get Started"}
            </Link>
            <Link to="/explore" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              Explore Skills <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </Link>
          </div>

          {/* Role selection row */}
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '2.5rem', marginBottom: '1rem' }}>
            Choose how you want to get started
          </p>
          <div className="flex justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link 
              to={currentUser ? "/explore" : "/signup"} 
              onClick={() => !currentUser && localStorage.setItem('selectedRole', 'teacher')} 
              className="btn btn-primary flex items-center gap-2" 
              style={{ padding: '0.875rem 2rem', fontSize: '1.05rem' }}
            >
              <GraduationCap size={20} /> Become a Teacher
            </Link>
            <Link 
              to={currentUser ? "/explore" : "/signup"} 
              onClick={() => !currentUser && localStorage.setItem('selectedRole', 'student')} 
              className="btn btn-outline flex items-center gap-2" 
              style={{ padding: '0.875rem 2rem', fontSize: '1.05rem' }}
            >
              <BookOpen size={20} /> Become a Student
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Why SkillSwap?</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Everything you need to learn, teach, and grow together</p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <FeatureCard 
              icon={Search} 
              title="Find Skills" 
              description="Discover students with the skills you want to learn." 
            />
            <FeatureCard 
              icon={Book} 
              title="Offer Skills" 
              description="Share your expertise and help others grow." 
            />
            <FeatureCard 
              icon={Users} 
              title="Connect & Learn" 
              description="Match with peers and schedule learning sessions." 
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Grow Together" 
              description="Build a community of collaborative learning." 
            />
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--color-bg-start)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Activity color="var(--color-primary)" size={32} /> Live Activity
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>See what's happening in the SkillSwap community right now</p>
          </div>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { id: 1, user: "Priyank", action: "just connected with", target: "Akshit", time: "2 mins ago" },
              { id: 2, user: "Maulik", action: "completed a session on", target: "UI Design", time: "15 mins ago" },
              { id: 3, user: "Aarav Patel", action: "earned a Top Mentor badge", target: "⭐", time: "1 hour ago" },
              { id: 4, user: "Nina", action: "just joined SkillSwap to learn", target: "Machine Learning", time: "2 hours ago" },
            ].map(act => (
              <div key={act.id} className="card flex items-center justify-between" style={{ padding: '1.25rem 2rem', transition: 'transform 0.2s', borderLeft: '4px solid var(--color-primary)' }}>
                <p style={{ fontSize: '1.05rem', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>{act.user}</span> <span style={{ color: 'var(--color-text-secondary)' }}>{act.action}</span> <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{act.target}</span>
                </p>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>How It Works</h2>
          </div>
          <div className="flex" style={{ flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { step: '1', title: 'Create Profile', desc: 'Sign up and list the skills you have and those you want to acquire.' },
              { step: '2', title: 'Find Matches', desc: 'Browse the Explore page to find peers with complementary skill sets.' },
              { step: '3', title: 'Send Request', desc: 'Click connect and propose a skill exchange arrangement.' },
              { step: '4', title: 'Start Learning', desc: 'Meet up online or on-campus to begin your mutual learning journey.' }
            ].map((item, index) => (
              <div key={item.step} className="card flex items-center gap-6" style={{ padding: '1.5rem 2rem' }}>
                <div style={{ 
                  fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-surface)', 
                  backgroundColor: 'var(--color-primary)', width: '4rem', height: '4rem', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', flexShrink: 0 
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--color-primary)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'white' }}>Start Your Skill Journey Today</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Join thousands of students learning from each other on SkillSwap. It's completely free.
          </p>
          <Link to={currentUser ? "/explore" : "/signup"} className="btn" style={{ backgroundColor: 'white', color: 'var(--color-primary)', padding: '1rem 3rem', fontSize: '1.1rem', boxShadow: 'var(--shadow-lg)' }}>
            {currentUser ? 'Explore Community' : 'Join Now'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
