
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { EmployeeRecord } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCT_eb73vNxAOGqVrIENP4AZihdZFQlNRg",
  authDomain: "duqhtestdb.firebaseapp.com",
  projectId: "duqhtestdb",
  storageBucket: "duqhtestdb.firebasestorage.app",
  messagingSenderId: "95763727672",
  appId: "1:95763727672:web:ec0824d71eb4227a2aedcd",
  measurementId: "G-KZW2GSD9BX"
};

export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
};

let db: any = null;

try {
  if (isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    // Initialize with persistent cache for better professional offline support
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

const COLLECTION_NAME = 'app_data';
const DOCUMENT_ID = 'employee_records';

/**
 * Safely extracts error message to avoid circular structure issues when serializing Firebase errors
 */
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return String(error.message);
  return "Đã xảy ra lỗi không xác định";
};

export const saveRecordsToCloud = async (records: EmployeeRecord[], timestamp: string) => {
  if (!db) {
    throw new Error("Firebase chưa được cấu hình đúng.");
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    // Ensure data is a clean array to prevent serialization issues
    const cleanData = JSON.parse(JSON.stringify(records));
    await setDoc(docRef, {
      data: cleanData,
      lastUpdated: timestamp,
    });
  } catch (error: any) {
    const msg = getErrorMessage(error);
    if (msg.includes('permission-denied')) {
      throw new Error("Lỗi quyền (Permission Denied): Hãy bật Cloud Firestore và cấu hình Security Rules.");
    }
    throw new Error(msg);
  }
};

export const fetchRecordsFromCloud = async (): Promise<{ data: EmployeeRecord[], lastUpdated: string } | null> => {
  if (!db) return null;
  
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    
    // Use a promise race to handle the 10s timeout issue gracefully
    const fetchPromise = getDoc(docRef);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Kết nối Firebase quá hạn (Timeout). Đang hiển thị dữ liệu cũ hoặc mẫu.")), 8000)
    );

    const docSnap: any = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (docSnap && docSnap.exists()) {
      const result = docSnap.data();
      return {
        data: Array.isArray(result.data) ? result.data : [],
        lastUpdated: result.lastUpdated || 'Không rõ'
      };
    }
    return null;
  } catch (error: any) {
    const msg = getErrorMessage(error);
    console.warn("Fetch warning (switching to offline/demo):", msg);
    // Throw error only if it's a critical logic error, otherwise App.tsx handles the null
    if (msg.includes('permission-denied')) {
      throw new Error("Lỗi quyền truy cập Firebase: " + msg);
    }
    return null;
  }
};
