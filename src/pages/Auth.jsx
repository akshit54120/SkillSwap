import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

const Auth = ({ type }) => {
  const isLogin = type === 'login';

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');

      if (isLogin) {
        const user = storedUsers.find(u => u.email === formData.email && u.password === formData.password);
        if (user) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', JSON.stringify(user));
          window.location.href = '/explore';
        } else {
          setError('No account found. Check your credentials or sign up first.');
        }
      } else {
        if (storedUsers.some(u => u.email === formData.email)) {
          setError('This email is already registered. Please log in instead.');
          return;
        }
        const selectedRole = localStorage.getItem('selectedRole') || 'student';
        const newUser = {
          ...formData,
          id: Date.now(),
          role: selectedRole,
          skillsOffered: [],
          skillsWanted: [],
          bio: '',
          availability: 'Flexible'
        };
        localStorage.removeItem('selectedRole');
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        window.location.href = '/onboarding';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-fade-in flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--color-bg-start)', padding: '1rem', borderRadius: 'var(--radius-full)', marginBottom: '1rem', color: 'var(--color-primary)' }}>
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {isLogin ? 'Enter your details to access your account.' : 'Join SkillSwap and start learning today.'}
          </p>
        </div>

        {/* Inline error */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="input-field"
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-field"
              placeholder="you@college.edu.in"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input-field"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Switch link */}
        <div className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          {isLogin ? (
            <p>Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Sign up</Link></p>
          ) : (
            <p>Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Log in</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
