import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { addNotification } from './NotificationService';

/**
 * Handshake Logic: Creates or retrieves a persistent conversation in Firestore.
 */
export const handleConnect = async (currentUser, targetUser) => {
  try {
    const convoId = [String(currentUser.id), String(targetUser.id)].sort().join('_');
    const convoRef = doc(db, 'conversations', convoId);
    
    const convoSnap = await getDoc(convoRef);
    
    if (convoSnap.exists()) {
      return { id: convoSnap.id, ...convoSnap.data() };
    }
    
    const newConversation = {
      participants: [String(currentUser.id), String(targetUser.id)],
      participantDetails: {
        [currentUser.id]: { name: currentUser.name },
        [targetUser.id]: { name: targetUser.name }
      },
      createdAt: serverTimestamp(),
      lastMessage: 'Started a new conversation'
    };
    
    await setDoc(convoRef, newConversation);
    return { id: convoId, ...newConversation };
  } catch (err) {
    console.error("Error in handleConnect:", err);
    throw err;
  }
};

/**
 * Subscribe to messages for a conversation (Real-time).
 */
export const subscribeMessages = (conversationId, callback) => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', String(conversationId))
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      const ts = data.createdAt?.toDate() ? data.createdAt.toDate() : new Date();
      return {
        id: doc.id,
        ...data,
        timestamp: ts.getTime(),
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(list);
  }, (err) => {
    console.error("Error subscribing to messages:", err);
  });
};

/**
 * Send a message to Firestore.
 */
export const sendMessage = async (conversationId, messageData) => {
  try {
    const newMessage = {
      ...messageData,
      conversationId: String(conversationId),
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'messages'), newMessage);
    
    // Update conversation last message (optional but good for performance)
    await setDoc(doc(db, 'conversations', conversationId), { 
      lastMessage: messageData.content,
      lastMessageAt: serverTimestamp() 
    }, { merge: true });

    // Emit Notification to the recipient
    const convoSnap = await getDoc(doc(db, 'conversations', conversationId));
    if (convoSnap.exists()) {
      const data = convoSnap.data();
      const recipientId = data.participants.find(id => id !== String(messageData.senderId));
      const senderName = data.participantDetails[messageData.senderId]?.name || 'Someone';
      
      if (recipientId) {
        await addNotification({
          recipientId,
          type: messageData.type === 'proposal' ? 'proposal' : 'message',
          content: messageData.type === 'proposal' ? 'proposed a meeting.' : 'sent you a message.',
          link: `/chat/${conversationId}`,
          senderName: senderName,
        });
      }
    }
    
    return { id: docRef.id, ...newMessage };
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
};

/**
 * Propose a meeting (Chat integration).
 */
export const proposeMeeting = async (conversationId, senderId, timeSlot) => {
  const proposalMsg = {
    senderId,
    type: 'proposal',
    content: `Proposed a meeting for ${timeSlot}`,
    timeSlot,
    status: 'pending'
  };
  return await sendMessage(conversationId, proposalMsg);
};

/**
 * Accept a meeting (Chat integration).
 */
export const acceptMeeting = async (conversationId, proposalId, userEmails, acceptorId) => {
  try {
    const msgRef = doc(db, 'messages', proposalId);
    const meetLink = `https://meet.google.com/mock-${Math.floor(Math.random() * 100000)}-link`;
    
    await setDoc(msgRef, {
      status: 'accepted',
      meetLink
    }, { merge: true });
    
    const convoSnap = await getDoc(doc(db, 'conversations', conversationId));
    if (convoSnap.exists()) {
      const data = convoSnap.data();
      const recipientId = data.participants.find(id => id !== String(acceptorId));
      const senderName = data.participantDetails[acceptorId]?.name || 'Someone';
      
      if (recipientId) {
        await addNotification({
          recipientId,
          type: 'accepted',
          content: 'accepted your meeting proposal.',
          link: `/chat/${conversationId}`,
          senderName: senderName,
        });
      }
    }
    
    return { status: 'accepted', meetLink };
  } catch (err) {
    console.error("Error accepting meeting:", err);
    throw err;
  }
};
