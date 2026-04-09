import React from 'react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '2rem 0', marginTop: 'auto' }}>
      <div className="container text-center">
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>SkillSwap</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Learn. Teach. Grow Together</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <a href="#">About</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
