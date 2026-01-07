
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { EmployeeRecord } from '../types';

// CẤU HÌNH FIREBASE CỦA BẠN
// QUAN TRỌNG: Bạn phải thay thế các giá trị dưới đây bằng thông tin từ Firebase Console của bạn.
// Truy cập: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyCT_eb73vNxAOGqVrIENP4AZihdZFQlNRg",
  authDomain: "duqhtestdb.firebaseapp.com",
  projectId: "duqhtestdb",
  storageBucket: "duqhtestdb.firebasestorage.app",
  messagingSenderId: "95763727672",
  appId: "1:95763727672:web:ec0824d71eb4227a2aedcd",
  measurementId: "G-KZW2GSD9BX"
};

// Kiểm tra xem người dùng đã cấu hình Firebase chưa
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "your-project-id";
};

let db: any = null;

try {
  if (isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Lỗi khởi tạo Firebase:", error);
}

const COLLECTION_NAME = 'app_data';
const DOCUMENT_ID = 'employee_records';

export const saveRecordsToCloud = async (records: EmployeeRecord[], timestamp: string) => {
  if (!db) {
    throw new Error("Firebase chưa được cấu hình. Vui lòng cập nhật services/firebaseService.ts với thông tin Project của bạn.");
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    await setDoc(docRef, {
      data: records,
      lastUpdated: timestamp,
    });
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      throw new Error("Lỗi quyền truy cập (Permission Denied): Hãy đảm bảo bạn đã bật Cloud Firestore API và thiết lập Security Rules là 'allow read, write: if true;' (cho mục đích thử nghiệm).");
    }
    throw error;
  }
};

export const fetchRecordsFromCloud = async (): Promise<{ data: EmployeeRecord[], lastUpdated: string } | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as { data: EmployeeRecord[], lastUpdated: string };
    }
    return null;
  } catch (error: any) {
    console.error("Lỗi fetch Firebase:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Không thể tải dữ liệu: Cloud Firestore API chưa được bật hoặc Rules bị chặn.");
    }
    return null;
  }
};
