# صحتي للسكري — نسخة Firebase (خطة Spark المجانية)

تطبيق React/Vite ثابت (بلا خادم): تسجيل دخول Google + Firestore لكل مستخدم + استضافة Firebase Hosting.

## التشغيل المحلي
```bash
pnpm install     # أو: npm install
pnpm dev         # افتح الرابط الذي يظهر (غالباً http://localhost:5173)
```
إعدادات المشروع موجودة في `client/src/lib/firebase.ts` (الكائن `firebaseConfig`).

## إعداد لوحة Firebase (مرة واحدة)
1. **Authentication** ← Get started ← Sign-in method ← Google ← Enable ← اختر بريد الدعم ← Save.
2. **Firestore Database** ← Create database ← اختر الموقع ← Production mode ← Create.
3. من تبويب **Rules** الصق محتوى `firestore.rules` واضغط **Publish**.
4. **Authentication ← Settings ← Authorized domains**: أضف نطاق موقعك إن لم يكن `*.firebaseapp.com` أو `*.web.app` (نطاق localhost موجود مسبقاً).

## النشر على Firebase Hosting (مجاني، بلا بطاقة)
```bash
npx firebase-tools login
pnpm run deploy      # يبني المشروع وينشر الموقع والقواعد
```
افتح الموقع من `my-diabetes-e8d9b.firebaseapp.com` (يطابق `authDomain`) لتعمل المصادقة على كل المتصفحات. على `web.app` يعمل الدخول بالنافذة المنبثقة، أما الاحتياطي بالتحويل فيحتاج ضبط `authDomain` على نفس النطاق.

## قبل النشر للجمهور
- ضع بريد التواصل في `client/src/lib/privacy.ts` (`PRIVACY_CONTACT`) وراجع نص سياسة الخصوصية في `components/auth/PrivacyPolicy.tsx`؛ هو قالب عام وليس استشارة قانونية.
- عند تعديل السياسة غيّر `PRIVACY_VERSION` ليُطلب من المستخدمين الموافقة من جديد.
- بلاغات المحتوى تظهر في Firestore ← `users/{uid}/reports`.

## الذكاء الاصطناعي (معطّل افتراضياً)
كان يعمل عبر خادم Manus، ولا يوجد خادم على Spark. أُعيد توصيله بـ Firebase AI Logic (Gemini) داخل `client/src/lib/ai.ts`.
للتفعيل: فعّل AI Logic من اللوحة، فعّل App Check (reCAPTCHA v3) وضع المفتاح في `APP_CHECK_SITE_KEY`، ثم اجعل `AI_ENABLED = true`.
