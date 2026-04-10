import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, request, partnerName, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(request, rating, reviewText.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card animate-fade-in flex" style={{ flexDirection: 'column', width: '100%', maxWidth: '450px', padding: '2.5rem', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Rate your session</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Leave a review for {partnerName || 'your partner'} to help build trust in the community!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.1s' }}
            >
              <Star 
                size={40} 
                color={(hoverRating || rating) >= star ? '#10B981' : 'var(--color-border)'} 
                fill={(hoverRating || rating) >= star ? '#10B981' : 'transparent'} 
                style={{ filter: (hoverRating || rating) >= star ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' : 'none' }}
              />
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <textarea
            className="input-field"
            style={{ width: '100%', minHeight: '120px', resize: 'none', padding: '1rem', backgroundColor: 'var(--color-bg-start)' }}
            placeholder="Write a short review... (optional)"
            value={reviewText}
            onChange={(e) => {
              if (e.target.value.length <= 150) setReviewText(e.target.value);
            }}
          />
          <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', fontSize: '0.75rem', color: reviewText.length === 150 ? '#ef4444' : 'var(--color-text-muted)', fontWeight: 500 }}>
            {reviewText.length}/150
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSubmit} 
          disabled={rating === 0 || isSubmitting}
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;
