import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const prevCreditsRef = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    }
  };

  useEffect(() => {
    let unsubscribeDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? { ...user } : null);
      if (user) {
        // Fetch additional user data from Firestore continuously
        const docRef = doc(db, 'users', user.uid);
        unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
        });
      } else {
        setUserData(null);
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    reloadUser,
    emailVerified: currentUser?.emailVerified
  };

  useEffect(() => {
    if (userData && userData.credits !== undefined) {
      if (prevCreditsRef.current !== null && prevCreditsRef.current !== userData.credits) {
        const diff = userData.credits - prevCreditsRef.current;
        if (diff !== 0) {
          setToastMessage(diff > 0 ? `+${diff} Credits!` : `${diff} Credits`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
      prevCreditsRef.current = userData.credits;
    }
  }, [userData?.credits]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      
      {/* Global Credit Toast Overlay */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          backgroundColor: toastMessage.startsWith('+') ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1.5rem 3.5rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          fontSize: '2rem',
          fontWeight: '900',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          backdropFilter: 'blur(10px)',
          animation: 'fade-in 0.2s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </AuthContext.Provider>
  );
};
