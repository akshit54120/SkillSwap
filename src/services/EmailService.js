import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Mock Service to "send" emails by recording them in Firestore.
 */
export const sendMockEmail = async ({ to, subject, body, template }) => {
  try {
    console.log(`[EmailService] Sending mock email to: ${to} | Subject: ${subject}`);
    
    // In a real app, you would call a backend or a service like EmailJS here.
    // For the demo, we create a record in the 'mockEmails' collection.
    const emailRecord = {
      to,
      subject,
      body,
      template,
      sentAt: serverTimestamp(),
      status: 'sent'
    };
    
    await addDoc(collection(db, 'mockEmails'), emailRecord);
    return true;
  } catch (err) {
    console.error("Failed to send mock email:", err);
    return false;
  }
};
