import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Book, Star } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skillsOffered, setSkillsOffered] = useState('');
  const [skillsWanted, setSkillsWanted] = useState('');
  const [bio, setBio] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Get data and sync with localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updatedUser = {
        ...currentUser,
        skillsOffered: skillsOffered.split(',').map(s => s.trim()).filter(s => s),
        skillsWanted: skillsWanted.split(',').map(s => s.trim()).filter(s => s),
        bio: bio
      };

      // Update current user
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Sync with users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
      }

      navigate('/profile');
    }
  };

  return (
    <div className="container animate-fade-in flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ 
              height: '4px', 
              flex: 1, 
              backgroundColor: s <= step ? 'var(--color-primary)' : 'var(--color-border)', 
              borderRadius: 'var(--radius-full)' 
            }} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <div style={{ display: 'inline-flex', background: 'var(--color-bg-start)', padding: '1rem', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              <Star size={32} />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What can you teach?</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              List a few skills you are comfortable sharing with others. E.g., Python, Guitar, Calculus.
            </p>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="React, Piano, Hindi..."
                value={skillsOffered}
                onChange={(e) => setSkillsOffered(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div style={{ display: 'inline-flex', background: 'var(--color-bg-start)', padding: '1rem', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>
              <Book size={32} />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What do you want to learn?</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Tell us what you're looking to master so we can match you perfectly.
            </p>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="UI Design, French, Data Analysis..."
                value={skillsWanted}
                onChange={(e) => setSkillsWanted(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Write a quick bio</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Add a bit of personality so people know you're real!
            </p>
            <div className="input-group">
              <textarea 
                className="input-field" 
                rows="4"
                placeholder="I'm a sophomore building cool web apps. Survive on code, late-night hackathons, and endless cups of cutting chai."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center" style={{ marginTop: '3rem' }}>
          {step > 1 ? (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : <div></div>}
          
          <button className="btn btn-primary flex items-center gap-2" onClick={handleNext}>
            {step === 3 ? 'Complete Setup' : 'Next Step'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
