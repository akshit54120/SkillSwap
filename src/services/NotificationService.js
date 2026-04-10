import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';

/**
 * Get notifications for a specific user (Real-time).
 * Used for subscriptions in UI components.
 */
export const subscribeNotifications = (userId, callback) => {
  if (!userId) return () => {};
  
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', String(userId))
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: doc.data().createdAt?.toDate() ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Just now'
    })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    callback(list);
  }, (err) => {
    console.error("Error subscribing to notifications:", err);
  });
};

/**
 * Add a new notification (Firestore)
 * @param {Object} data - { recipientId, type, content, link, senderName }
 */
export const addNotification = async (data) => {
  try {
    const newNotification = {
      ...data,
      recipientId: String(data.recipientId),
      isRead: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'notifications'), newNotification);
  } catch (err) {
    console.error("Error adding notification:", err);
  }
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { isRead: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};

/**
 * Mark all notifications for a user as read
 */
export const markAllAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', String(userId)),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { isRead: true }));
    await Promise.all(promises);
  } catch (err) {
    console.error("Error marking all as read:", err);
  }
};
