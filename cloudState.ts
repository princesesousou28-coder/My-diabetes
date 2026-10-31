import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";

/** المفاتيح المسموح بها — يجب أن تطابق firestore.rules */
export const CLOUD_KEYS = ["readings", "profile", "water", "settings", "nutrition", "activities"] as const;
export type CloudKey = (typeof CLOUD_KEYS)[number];

const WRITE_DELAY_MS = 800;
const RETRY_DELAY_MS = 10_000;

/* ── حالة المزامنة العامة: لإظهار تنبيه إن تعذّر الحفظ ── */
let syncFailed = false;
const syncListeners = new Set<() => void>();
function setSyncFailed(value: boolean) {
  if (syncFailed === value) return;
  syncFailed = value;
  syncListeners.forEach(listener => listener());
}
export function useSyncFailed() {
  return useSyncExternalStore(
    listener => {
      syncListeners.add(listener);
      return () => {
        syncListeners.delete(listener);
      };
    },
    () => syncFailed
  );
}

/* ── تفريغ الكتابات المؤجلة (قبل الخروج) أو إيقافها (أثناء حذف الحساب) ── */
const flushers = new Set<() => Promise<void>>();
let writesBlocked = false;
export const flushCloudWrites = () => Promise.allSettled([...flushers].map(flush => flush()));
export const setCloudWritesBlocked = (blocked: boolean) => {
  writesBlocked = blocked;
};

/* ── استيراد بيانات قديمة كانت محفوظة في المتصفح قبل تسجيل الدخول (بموافقة المستخدم فقط) ── */
const LEGACY_PREFIX = "diabetes-";
let importLegacy = false;
export function hasLegacyLocalData() {
  try {
    return CLOUD_KEYS.some(key => localStorage.getItem(LEGACY_PREFIX + key) !== null);
  } catch {
    return false;
  }
}
export function clearLegacyLocalData() {
  try {
    CLOUD_KEYS.forEach(key => localStorage.removeItem(LEGACY_PREFIX + key));
  } catch {
    /* لا شيء */
  }
}
export function resolveLegacyData(shouldImport: boolean) {
  importLegacy = shouldImport;
  if (!shouldImport) clearLegacyLocalData();
}
function takeLegacyValue<T>(key: CloudKey): T | undefined {
  if (!importLegacy) return undefined;
  try {
    const raw = localStorage.getItem(LEGACY_PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

const toPlain = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null));

/**
 * يعمل مثل useState لكنه يحفظ القيمة في Firestore تحت users/{uid}/data/{key}.
 * العنصر الثالث (ready) يصبح true بعد وصول أول نسخة من السحابة (أو من الذاكرة المحلية دون إنترنت).
 */
export function useCloudState<T>(uid: string, key: CloudKey, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const valueRef = useRef<T>(initial);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const write = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (!dirtyRef.current || writesBlocked) return;
    dirtyRef.current = false;
    try {
      const { db } = getFirebase();
      await setDoc(doc(db, "users", uid, "data", key), {
        value: toPlain(valueRef.current),
        updatedAt: serverTimestamp(),
      });
      setSyncFailed(false);
    } catch {
      dirtyRef.current = true;
      setSyncFailed(true);
      timerRef.current = setTimeout(() => void write(), RETRY_DELAY_MS); // نعيد المحاولة تلقائياً
    }
  }, [uid, key]);

  const schedule = useCallback(() => {
    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void write(), WRITE_DELAY_MS);
  }, [write]);

  useEffect(() => {
    const { db } = getFirebase();
    flushers.add(write);

    const unsubscribe = onSnapshot(
      doc(db, "users", uid, "data", key),
      snap => {
        // نتجاهل صدى كتاباتنا المحلية، ولا نستبدل تعديلات لم تُرسل بعد
        if (!snap.metadata.hasPendingWrites && !dirtyRef.current) {
          if (snap.exists()) {
            const remote = snap.data().value as T;
            valueRef.current = remote;
            setValue(remote);
          } else {
            const legacy = takeLegacyValue<T>(key);
            if (legacy !== undefined) {
              valueRef.current = legacy;
              setValue(legacy);
              schedule();
              try {
                localStorage.removeItem(LEGACY_PREFIX + key);
              } catch {
                /* لا شيء */
              }
            }
          }
        }
        if (!snap.metadata.fromCache) setSyncFailed(false);
        setReady(true);
      },
      () => {
        setSyncFailed(true);
        setReady(true);
      }
    );

    return () => {
      unsubscribe();
      flushers.delete(write);
      void write();
    };
  }, [uid, key, write, schedule]);

  const set: Dispatch<SetStateAction<T>> = useCallback(
    action => {
      const next = typeof action === "function" ? (action as (previous: T) => T)(valueRef.current) : action;
      valueRef.current = next;
      setValue(next);
      schedule();
    },
    [schedule]
  );

  return [value, set, ready];
}
