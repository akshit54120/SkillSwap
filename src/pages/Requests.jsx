import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Loader2, Calendar, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc, 
  updateDoc,
  increment,
  or,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

import ScheduleModal from '../components/ScheduleModal';
import ReviewModal from '../components/ReviewModal';
import { downloadICS } from '../utils/calendarUtils';

const StatusTimeline = ({ currentStatus }) => {
  const steps = [
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'completed', label: 'Completed' }
  ];
  
  const getStepStatus = (stepId) => {
    if (currentStatus === 'completed') return 'done';
    if (currentStatus === 'accepted') {
      if (stepId === 'pending') return 'done';
      if (stepId === 'accepted') return 'current';
      return 'upcoming';
    }
    if (currentStatus === 'pending') {
      if (stepId === 'pending') return 'current';
      return 'upcoming';
    }
    return 'upcoming'; // default
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isDone = status === 'done';
        const isCurrent = status === 'current';
        
        let circleColor = 'var(--color-bg-start)';
        let textColor = 'var(--color-text-muted)';
        let borderColor = 'var(--color-border)';
        
        if (isDone || currentStatus === 'completed' && step.id === 'completed') {
          circleColor = '#10B981';
          textColor = '#fff';
          borderColor = '#10B981';
        } else if (isCurrent) {
          circleColor = 'var(--color-primary)';
          textColor = '#fff';
          borderColor = 'var(--color-primary)';
        }

        return (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <div style={{ 
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: circleColor, color: textColor, border: `2px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', zIndex: 2
              }}>
                {(isDone || currentStatus === 'completed' && step.id === 'completed') ? '✓' : (index + 1)}
              </div>
              <span style={{ fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: isCurrent ? 600 : 400, color: isCurrent || isDone || (currentStatus === 'completed') ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div style={{ 
                height: '2px', width: '30px', 
                backgroundColor: isDone ? '#10B981' : 'var(--color-border)', 
                marginBottom: '1.2rem', flexShrink: 0
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Requests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for scheduling modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // State for review modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);
  
  useEffect(() => {
    if (!currentUser) return;

    // Listen to both incoming and outgoing requests
    const q = query(
      collection(db, 'requests'), 
      or(
        where('receiverId', '==', currentUser.uid),
        where('senderId', '==', currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate() ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Just now',
        timestamp: doc.data().createdAt?.toDate()?.getTime() || 0
      })).sort((a,b) => b.timestamp - a.timestamp);
      
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleAction = async (req, action) => {
    try {
      const requestRef = doc(db, 'requests', req.id);
      if (action === 'accept') {
        await updateDoc(requestRef, { status: 'accepted' });
        // Deduct 2 credits from the sender upon acceptance
        await updateDoc(doc(db, 'users', req.senderId), { credits: increment(-2) });
        await addDoc(collection(db, 'transactions'), {
          userId: req.senderId,
          amount: -2,
          type: 'Spent',
          description: `Connection with ${currentUser?.displayName || 'Teacher'} accepted`,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(requestRef, { status: 'rejected' });
      }
    } catch (err) {
      console.error("Error updating request status:", err);
      alert("Failed to update request. Please try again.");
    }
  };

  const handleMarkCompleted = async (req) => {
    const isSender = currentUser.uid === req.senderId;
    const update = isSender ? { completedBySender: true } : { completedByReceiver: true };
    const willComplete = (isSender ? req.completedByReceiver : req.completedBySender) === true;
    
    if (willComplete) {
       update.status = 'completed';
    }
    
    try {
      await updateDoc(doc(db, 'requests', req.id), update);
    } catch (err) {
      console.error("Failed to mark completed", err);
    }
  };

  const handleSubmitReview = async (req, ratingValue, reviewText) => {
    try {
      await updateDoc(doc(db, 'requests', req.id), { rating: ratingValue, isReviewed: true });
      
      // Update receiver User metadata
      await updateDoc(doc(db, 'users', req.receiverId), { 
        ratingTotal: increment(ratingValue),
        reviewCount: increment(1)
      });

      // Submit Review Log
      await addDoc(collection(db, 'reviews'), {
        reviewerId: currentUser.uid,
        reviewerName: currentUser.displayName || 'Me',
        receiverId: req.receiverId,
        rating: ratingValue,
        reviewText: reviewText,
        requestId: req.id,
        createdAt: serverTimestamp()
      });

      if (ratingValue >= 4) {
        await updateDoc(doc(db, 'users', req.receiverId), { credits: increment(5) });
        await addDoc(collection(db, 'transactions'), {
          userId: req.receiverId,
          amount: 5,
          type: 'Earned',
          description: `Rated ${ratingValue} Stars by student`,
          createdAt: serverTimestamp()
        });
        alert(`Review submitted! You rated ${ratingValue} stars. The teacher earned +5 credits!`);
      } else {
        alert(`Review submitted successfully!`);
      }
    } catch (err) {
      console.error("Failed to submit review", err);
      alert("Failed to submit review.");
    }
  };

  const getMessageCount = (req) => {
    try {
      const convos = JSON.parse(localStorage.getItem('chat_conversations')) || [];
      const convo = convos.find(c => c.participants.includes(req.senderId) && c.participants.includes(req.receiverId));
      if (!convo) return 0;
      const msgs = JSON.parse(localStorage.getItem('chat_messages')) || {};
      return (msgs[convo.id] || []).length;
    } catch (e) { return 0; }
  };

  const handleOpenSchedule = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleAddToCalendar = (req) => {
    if (!req.schedule) return;
    downloadICS({
      title: req.schedule.title,
      description: req.schedule.description || `Class session for ${req.skillWanted}`,
      startTime: req.schedule.startTime,
      endTime: req.schedule.endTime,
      location: req.schedule.meetingLink || 'Online'
    });
  };

  // Filter requests
  const pendingRequests = requests.filter(r => r.status === 'pending' && r.receiverId === currentUser?.uid);
  const outgoingRequests = requests.filter(r => r.status === 'pending' && r.senderId === currentUser?.uid);
  const activeRequests = requests.filter(r => r.status === 'accepted' || r.status === 'completed');

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Connection Requests</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your skill exchanges and track active sessions.</p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--color-primary)" /> Incoming Pending Requests ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 2rem', color: 'var(--color-text-secondary)' }}>
            You have no pending requests to review.
          </div>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map(req => (
              <div key={req.id} className="card flex items-center justify-between" style={{ padding: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{req.senderName}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Wants to learn <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.skillWanted}</span> • 
                    Can teach <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{req.skillOffered}</span>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{req.time}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center' }}
                    onClick={() => handleAction(req, 'reject')}
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#dcfce7', color: '#22c55e', padding: '0.5rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center' }}
                    onClick={() => handleAction(req, 'accept')}
                    title="Accept (Costs Sender 2 credits)"
                  >
                    <Check size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Requests Section Addition */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} style={{ color: 'var(--color-secondary)' }} /> Outgoing Sent Requests ({outgoingRequests.length})
        </h3>
        
        {outgoingRequests.length === 0 ? (
          <div className="card text-center" style={{ padding: '2rem', color: 'var(--color-text-secondary)', backgroundColor: 'transparent', border: '1px dashed var(--color-border)' }}>
            You haven't sent any pending requests.
          </div>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {outgoingRequests.map(req => (
              <div key={req.id} className="card flex items-center justify-between" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-secondary)' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Sent to {req.receiverName}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Requested to learn <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.skillWanted}</span>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{req.time}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span className="animate-pulse">●</span> Pending
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
          Active Connections & History
        </h3>
        {activeRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No active connections yet.
          </div>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {activeRequests.map(req => {
              const msgCount = getMessageCount(req);
              const hasEnoughMessages = msgCount >= 3;
              const isSender = currentUser.uid === req.senderId;
              const hasMarkedComplete = isSender ? req.completedBySender : req.completedByReceiver;
              
              return (
                <div key={req.id} className="card" style={{ padding: '1.25rem' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: req.schedule ? '1rem' : 0 }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                        {isSender ? `Learning from ${req.receiverName || 'Teacher'}` : `Teaching ${req.senderName}`}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Exchange: {req.skillWanted} for {req.skillOffered}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                        <StatusTimeline currentStatus={req.status} />

                        {req.status === 'accepted' && (
                          <>
                            {!hasMarkedComplete ? (
                              <button 
                                className="btn btn-outline flex items-center gap-1"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: !hasEnoughMessages ? 0.5 : 1 }}
                                disabled={!hasEnoughMessages}
                                onClick={() => handleMarkCompleted(req)}
                                title={hasEnoughMessages ? "" : "Must exchange at least 3 messages in chat first"}
                              >
                                <Check size={14} /> 
                                {hasEnoughMessages ? 'Mark as Completed' : 'Pending Chat Limit'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-start)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                                Waiting for partner...
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {req.status === 'completed' && isSender && !req.isReviewed && (
                    <div style={{ padding: '1.25rem', marginTop: '1rem', backgroundColor: 'var(--color-bg-start)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 500, color: 'var(--color-primary)' }}>Session Completed!</p>
                      <button 
                        className="btn btn-primary flex items-center gap-2"
                        onClick={() => { setSelectedReviewRequest(req); setIsReviewOpen(true); }}
                        style={{ padding: '0.6rem 1.25rem' }}
                      >
                        <Star size={16} /> Rate & Review Session
                      </button>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>4+ stars awards them 5 credits.</p>
                    </div>
                  )}

                  {/* Existing Schedule UI */}
                  {req.schedule && (
                    <div style={{ marginTop: '1rem', backgroundColor: 'var(--color-bg-start)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div style={{ textAlign: 'center', minWidth: '60px', padding: '0.5rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                              {new Date(req.schedule.startTime).toLocaleString('default', { month: 'short' })}
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                              {new Date(req.schedule.startTime).getDate()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>Next Session</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              {new Date(req.schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {req.schedule.meetingLink ? <a href={req.schedule.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Join Link</a> : 'Wait for link'}
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-outline flex items-center gap-1" 
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => handleAddToCalendar(req)}
                        >
                          <Calendar size={14} /> Add to Zoho
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        request={selectedRequest}
        senderName={selectedRequest?.senderName}
      />

      <ReviewModal 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        request={selectedReviewRequest}
        partnerName={selectedReviewRequest?.receiverName || 'Teacher'}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default Requests;
