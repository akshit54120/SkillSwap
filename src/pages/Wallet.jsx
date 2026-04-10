import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wallet = () => {
  const { currentUser, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // Sort transactions natively on the client to avoid the need for complex composite Firestore indexes
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || 0,
        dateStr: doc.data().createdAt?.toDate() ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Just now'
      })).sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(txs);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="flex items-center gap-2" style={{ color: 'var(--color-primary)', fontWeight: '500', display: 'inline-flex' }}>
          <ArrowLeft size={18} /> Back Home
        </Link>
      </div>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
          <WalletIcon size={48} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: '800' }}>{userData?.credits ?? 0}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', marginTop: '0.25rem', fontWeight: '500' }}>Available Credits</p>
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 2rem', color: 'var(--color-text-secondary)' }}>
            No transactions yet. Start connecting with others to spend or earn credits!
          </div>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {transactions.map(tx => (
              <div key={tx.id} className="card flex items-center justify-between" style={{ padding: '1.5rem' }}>
                <div className="flex items-center gap-4">
                  <div style={{ 
                    width: '3rem', height: '3rem', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: tx.type === 'Earned' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                  }}>
                    {tx.type === 'Earned' ? <TrendingUp size={20} color="#10B981" /> : <TrendingDown size={20} color="#ef4444" />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{tx.description || tx.type}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{tx.dateStr}</p>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.25rem', fontWeight: 'bold',
                  color: tx.type === 'Earned' ? '#10B981' : '#ef4444' 
                }}>
                  {tx.type === 'Earned' ? '+' : ''}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
