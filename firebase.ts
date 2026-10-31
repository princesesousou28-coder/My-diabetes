import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import {
  type Firestore,
  clearIndexedDbPersistence,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
} from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════════
   ⚙️  إعدادات Firebase — ضع قيم مشروعك هنا
   Firebase Console ← ⚙️ Project settings ← General ← Your apps ← Web app ← Config
   هذه القيم عامة بطبيعتها (ليست أسراراً)؛ الحماية الفعلية تأتي من firestore.rules
   ═══════════════════════════════════════════════════════════════ */
export const firebaseConfig = {
  apiKey: "AIzaSyDf5SJhY-OsfB_-lspa9R6BW4sBRDxNiJ0",
  authDomain: "my-diabetes-e8d9b.firebaseapp.com",
  projectId: "my-diabetes-e8d9b",
  storageBucket: "my-diabetes-e8d9b.firebasestorage.app", // غير مستخدم (التخزين السحابي يتطلب خطة Blaze)
  messagingSenderId: "613259538587",
  appId: "1:613259538587:web:dade58e0a644c24e74d63e",
  // measurementId: "G-7TMJ5CCDW4", // لم نفعّل Google Analytics عمداً (تقليل البيانات + سياسة الخصوصية)
};

const REQUIRED = ["apiKey", "authDomain", "projectId", "appId"] as const;

/** false = لم تُملأ الإعدادات بعد → يعرض التطبيق شاشة إرشادية بدل أن ينهار */
export const isFirebaseConfigured = REQUIRED.every(key => {
  const value = firebaseConfig[key];
  return Boolean(value) && value !== "...";
});

type Services = { app: FirebaseApp; auth: Auth; db: Firestore };
let services: Services | null = null;

export function getFirebase(): Services {
  if (services) return services;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // بقاء تسجيل الدخول بعد إغلاق المتصفح (هو الافتراضي على الويب، ونؤكده هنا صراحةً)
  setPersistence(auth, browserLocalPersistence).catch(() => undefined);

  let db: Firestore;
  try {
    // ذاكرة محلية دائمة: يعمل التطبيق دون إنترنت ثم تُزامَن التعديلات تلقائياً
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app); // أُنشئت مسبقاً (مثلاً عند إعادة التحميل الساخن أثناء التطوير)
  }

  services = { app, auth, db };
  return services;
}

/** يمسح النسخة المحلية من البيانات (الكاش) من الجهاز ثم يعيد تحميل الصفحة — عند الخروج أو حذف الحساب */
export async function wipeLocalDataAndReload() {
  try {
    const { db } = getFirebase();
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    /* قد يفشل إن كانت نافذة أخرى مفتوحة؛ لا يمنع المتابعة */
  }
  window.location.reload();
}
