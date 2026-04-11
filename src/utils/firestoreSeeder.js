import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, setDoc, query, limit, where } from 'firebase/firestore';

const MOCK_TUTORS = [
  { name: "Dr. Elena Vance", rating: 4.9, completedSessions: 45, skillsOffered: ["Quantum Physics", "Mathematics"], credits: 150 },
  { name: "Marcus Thorne", rating: 4.8, completedSessions: 38, skillsOffered: ["UI Design", "Figma"], credits: 120 },
  { name: "Sarah Jenkins", rating: 4.7, completedSessions: 32, skillsOffered: ["React", "JavaScript"], credits: 95 },
  { name: "Julian Rossi", rating: 4.6, completedSessions: 28, skillsOffered: ["Italian Language", "Cooking"], credits: 80 },
  { name: "Aria Montgomery", rating: 4.5, completedSessions: 22, skillsOffered: ["Digital Marketing", "SEO"], credits: 60 },
  { name: "Kenji Sato", rating: 4.4, completedSessions: 18, skillsOffered: ["Photography", "Lightroom"], credits: 50 },
  { name: "Maya Patel", rating: 4.3, completedSessions: 15, skillsOffered: ["Psychology", "Counseling"], credits: 40 },
  { name: "David Miller", rating: 4.2, completedSessions: 12, skillsOffered: ["Guitar", "Music Theory"], credits: 35 },
  { name: "Sophie Chen", rating: 4.9, completedSessions: 50, skillsOffered: ["Python", "Data Science"], credits: 200 },
  { name: "Liam O'Connor", rating: 4.8, completedSessions: 42, skillsOffered: ["Finance", "Investing"], credits: 110 }
];

const MOCK_STATS = {
  totalUsers: 1420,
  activeUsers: 345,
  totalConnections: 4210,
  completedSessions: 2845
};

export const seedFirestore = async () => {
  try {
    // 1. Check if stats already exist
    const statsSnapshot = await getDocs(collection(db, 'platformStats'));
    if (statsSnapshot.empty) {
      console.log("Seeding platformStats...");
      await setDoc(doc(db, 'platformStats', 'dashboard'), MOCK_STATS);
    }

    // 2. Check for mock tutors specifically (to avoid skipping if other users exist)
    const q = query(collection(db, 'users'), where('isMockTutor', '==', true));
    const tutorsSnapshot = await getDocs(q);
    
    if (tutorsSnapshot.empty) {
      console.log("Seeding mock tutors...");
      const promises = MOCK_TUTORS.map((user, index) => {
        const id = `tutor_${index}`;
        return setDoc(doc(db, 'users', id), { ...user, uid: id, id: id, isMockTutor: true });
      });
      await Promise.all(promises);
    }
    
    return true;
  } catch (err) {
    console.error("Seeding failed:", err);
    return false;
  }
};
