# AGENTS.md — Nawy To Do · ناوي دو

مرجع العاملين على المشروع (بشر أو وكلاء).

## ما هو

تطبيق مهام شخصي، محلي أولًا، PWA، عربي أولًا. لا Backend. جزء من عائلة ناوي (Nawy، Notes، Today، Focus). الجملة الأساسية في خانة الكتابة: «ناوي تعمل إيه؟». الكلمة الأساسية للمهمة: «نية».

## قبل أي عمل

1. اقرأ `docs/DECISIONS.md` و`docs/BUILD_PLAN.md`.
2. اعمل على **مرحلة واحدة** فقط.
3. لا تضف مكتبة أو تغيّر المعمارية دون قرار جديد في `DECISIONS.md`.

## قواعد صارمة

- **الصدق:** لا ميزة في الواجهة لا يمكن الوفاء بها (لا تذكيرات وهو مغلق: D-002).
- **الطبقات:** `core ← data ← features ← ui ← app`. `core` لا يستورد React ولا Dexie ولا DOM ولا يقرأ الساعة (الوقت يُمرَّر `now`).
- الواجهة لا تستدعي Dexie مباشرة.
- لا حذف فعلي؛ tombstones (D-006).
- لا `dangerouslySetInnerHTML`، لا CDN.
- CSS بوحدات منطقية (`margin-inline-start`…)، لمس ≥ 44px، مدخلات 16px.
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- كل تغيير سلوك = اختبار، وكل خطأ يُصلَح = اختبار يفشل قبل الإصلاح.

## الأوامر

`npm install` · `npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run format:check`

## بوابات CI

lint (0 تحذيرات) ← format ← test ← build. لا دمج في `main` قبل أن يخضر CI على الفرع.
