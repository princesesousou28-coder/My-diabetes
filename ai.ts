import { useCallback, useState } from "react";
import { getFirebase } from "./firebase";

/* ═══════════════════════════════════════════════════════════════
   🤖 ميزات الذكاء الاصطناعي (اختيارية) — معطّلة افتراضياً
   كانت تعمل عبر خادم Manus، ولا يوجد خادم في خطة Spark، لذلك أُعيد ربطها بـ Firebase AI Logic
   (Gemini Developer API — الطبقة المجانية، دون بطاقة). لتفعيلها:
   1) Firebase Console ← AI Logic ← Get started ← Gemini Developer API
   2) فعّل App Check (مطلوب إلزامياً اعتباراً من 2 نوفمبر 2026) وضع مفتاح reCAPTCHA v3 في APP_CHECK_SITE_KEY
   3) غيّر AI_ENABLED إلى true
   أسماء النماذج تتغيّر باستمرار: https://firebase.google.com/docs/ai-logic/models
   ═══════════════════════════════════════════════════════════════ */
export const AI_ENABLED = false;
export const AI_MODEL = "gemini-3.8-flash";
export const APP_CHECK_SITE_KEY = "";

class AiDisabledError extends Error {
  constructor() {
    super("AI_DISABLED");
  }
}

/** نص آمن للمستخدم عند فشل ميزة الذكاء الاصطناعي (دون تفاصيل تقنية) */
export function aiErrorText(error: unknown, fallback: string) {
  return error instanceof AiDisabledError ? "ميزة الذكاء الاصطناعي غير مفعّلة في هذه النسخة بعد." : fallback;
}

const BASE_PROMPT =
  "أنت مساعد تثقيفي عربي متخصص في التعايش مع السكري. أجب بلغة عربية واضحة ودافئة، وقدّم معلومات عامة مبنية على إرشادات صحية موثوقة دون تشخيص أو تغيير جرعات الأدوية. اسأل عن السياق عند الحاجة، واذكر دائماً أن القياسات الخطرة أو الأعراض الشديدة تستدعي التواصل العاجل مع الطبيب أو الطوارئ.";
const FOOD_PROMPT =
  "حلّل صورة الطعام بصرياً. اكتب الإجابة (answer) بالعربية وبهذه العناوين: 1) التقييم الصحي للطبق ولماذا، 2) المكونات والكربوهيدرات التقريبية إن أمكن، 3) بديلان صحيّان لذيذان، 4) وصفتان عمليتان بديلتان مع المكونات وطريقة التحضير وحجم حصة مقترح، 5) تنبيه قصير عن اختلاف الاحتياجات. اجعل البدائل مناسبة للمطبخ العربي ولا تعتبر النتيجة بديلاً عن اختصاصي التغذية. أعد JSON فقط بالشكل: {\"answer\": string, \"calories\": number, \"carbohydrates\": number, \"protein\": number, \"suitability\": string}.";
const DAILY_PROMPT =
  "حلّل سجل اليوم بشكل تثقيفي شامل. أعد ملخصاً بالعربية يوضح إن كانت القراءات مستقرة أو تحتاج انتباهاً، والأنماط بين الصيام وبعد الوجبات، واستفد من الأنشطة (النوع والمدة والمسافة) مع اقتراح آمن للحركة والماء والنوم. لا تشخّص ولا تغيّر الأدوية، واذكر متى يجب التواصل مع الطبيب.";
const HEALTH_PROMPT =
  "حلّل ملفاً صحياً تثقيفياً. اقترح تمارين آمنة ومناسبة للعمر والوزن والجنس والنشاط والروتين اليومي، واذكر تعديلات لصعود الدرج والعمل والركض والأعمال المنزلية. راعِ فقر الدم ونقص الحديد والربو والحساسية والغدة الدرقية وغيرها، ولا تشخّص ولا تقترح تغيير دواء. أجب بعناوين: قراءة عامة، الحركة المناسبة، احتياطات حسب الحالات، أسئلة أو فحوصات يناقشها المستخدم مع الطبيب.";

let appCheckReady: Promise<void> | null = null;

async function generate(parts: string | unknown[], options: { system?: string; json?: boolean; maxOutputTokens?: number } = {}) {
  if (!AI_ENABLED) throw new AiDisabledError();
  const { app } = getFirebase();

  if (APP_CHECK_SITE_KEY) {
    if (!appCheckReady) {
      appCheckReady = import("firebase/app-check").then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
        // أثناء التطوير المحلي: يطبع المتصفح رمز debug تضيفه في Firebase Console ← App Check ← Apps ← Manage debug tokens
        if (import.meta.env.DEV) (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        initializeAppCheck(app, { provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
      });
    }
    await appCheckReady;
  }

  const { getAI, getGenerativeModel, GoogleAIBackend } = await import("firebase/ai");
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: AI_MODEL,
    systemInstruction: `${BASE_PROMPT} ${options.system ?? ""}`.trim(),
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens ?? 1200,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await model.generateContent(parts as any);
  return result.response.text();
}

const clip = (value: unknown, max: number) => String(value ?? "").slice(0, max);

export async function askAI(input: { question: string }) {
  const question = clip(input.question, 4000).trim();
  if (question.length < 2) throw new Error("INVALID_INPUT");
  return { answer: await generate(question, { maxOutputTokens: 1200 }) };
}

export async function analyzeFoodAI(input: { imageDataUrl: string; hint?: string }) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input.imageDataUrl);
  if (!match || input.imageDataUrl.length > 8_000_000) throw new Error("INVALID_INPUT");
  const text = await generate(
    [
      input.hint ? `ملاحظة المستخدم: ${clip(input.hint, 300)}` : "حلّل هذا الطعام لمريض سكري.",
      { inlineData: { mimeType: match[1], data: match[2] } },
    ],
    { system: FOOD_PROMPT, json: true, maxOutputTokens: 1400 }
  );
  let parsed: { answer?: string; calories?: number; carbohydrates?: number; protein?: number; suitability?: string } = { answer: text };
  try {
    parsed = JSON.parse(text);
  } catch {
    /* نعرض النص كما هو */
  }
  return {
    answer: parsed.answer || text,
    nutrition: {
      calories: Number(parsed.calories) || 0,
      carbohydrates: Number(parsed.carbohydrates) || 0,
      protein: Number(parsed.protein) || 0,
      suitability: parsed.suitability || "غير محدد",
    },
  };
}

export async function dailyAnalysisAI(input: { readings: unknown[]; profile: unknown; sleep: unknown; activities?: unknown[] }) {
  const payload = { ...input, readings: input.readings.slice(0, 100), activities: (input.activities ?? []).slice(0, 100) };
  return { answer: await generate(JSON.stringify(payload), { system: DAILY_PROMPT, maxOutputTokens: 1600 }) };
}

export async function healthAnalysisAI(input: { profile: unknown; conditions: string[]; routines: string[]; goals: string }) {
  const payload = { ...input, conditions: input.conditions.slice(0, 20), routines: input.routines.slice(0, 20), goals: clip(input.goals, 500) };
  return { answer: await generate(JSON.stringify(payload), { system: HEALTH_PROMPT, maxOutputTokens: 1800 }) };
}

/** غلاف بسيط يعطي واجهة (mutateAsync / isPending) لتسهيل ربط الأزرار بحالة التحميل */
export function useAction<I, O>(fn: (input: I) => Promise<O>) {
  const [isPending, setPending] = useState(false);
  const mutateAsync = useCallback(
    async (input: I) => {
      setPending(true);
      try {
        return await fn(input);
      } finally {
        setPending(false);
      }
    },
    [fn]
  );
  return { mutateAsync, isPending };
}
