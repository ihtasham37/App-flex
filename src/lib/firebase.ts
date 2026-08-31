import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAeGxA9tzTCntBDwpZJ92jlqNIaHnL8QMc",
  authDomain: "aiportfolio-369ed.firebaseapp.com",
  databaseURL: "https://aiportfolio-369ed-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aiportfolio-369ed",
  storageBucket: "aiportfolio-369ed.firebasestorage.app",
  messagingSenderId: "15819368949",
  appId: "1:15819368949:web:e2fef8a8387d2599d158bc"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
