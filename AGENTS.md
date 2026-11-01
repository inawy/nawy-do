# AGENTS.md — Nawy To Do · ناوي دو

مرجع العاملين على المشروع (بشر أو وكلاء).

## ما هو

تطبيق مهام شخصي، محلي أولًا، PWA، عربي أولًا. لا Backend. جزء من عائلة ناوي (Nawy، Notes، Today، Focus). الجملة الأساسية في خانة الكتابة: «ناوي تعمل إيه؟». الكلمة الأساسية للمهمة: «نية».

## المرجع المشترك

هذا المنتج يلتزم بـ [`inawy/design-system`](https://github.com/inawy/design-system) (الهوية، الرموز، الأيقونات، المعايير الهندسية، قواعد وكلاء البرمجة). اقرأ `AGENTS.md` هناك أولًا. المطابقة وانحرافاتها المبرَّرة في `docs/DESIGN-SYSTEM-CONFORMANCE.md`. **ترتيب مصادر الحقيقة عند التعارض:** الكود الفعلي والاختبارات ← قرارات المنتج (`docs/DECISIONS.md`) ← وثائق المعمارية ← الافتراضات المعلنة. صنّف ما لا دليل عليه كافتراض أو مجهول ولا تقدّمه حقيقة. لا تدّعِ تشغيل ما لم يُشغَّل (`docs/KNOWN-LIMITATIONS.md`).

## قبل أي عمل

1. اقرأ `docs/DECISIONS.md` و`docs/ROADMAP.md` و`docs/DESIGN-SYSTEM-CONFORMANCE.md` و`docs/KNOWN-LIMITATIONS.md`.
2. اعمل على **مرحلة واحدة** فقط.
3. لا تضف مكتبة أو تغيّر المعمارية دون قرار جديد في `DECISIONS.md`.

## قواعد صارمة

- **الصدق:** لا ميزة في الواجهة لا يمكن الوفاء بها (لا تذكيرات وهو مغلق: D-002).
- **الطبقات:** `core ← data ← features ← ui ← app`. `core` لا يستورد React ولا Dexie ولا DOM ولا يقرأ الساعة (الوقت يُمرَّر `now`).
- الواجهة لا تستدعي Dexie مباشرة.
- لا حذف فعلي؛ tombstones (D-006).
- لا `dangerouslySetInnerHTML`، لا CDN.
- الأيقونات: Google Material Symbols **ملفات SVG فعلية** Outlined (لا Emoji ولا مسارات مرسومة بيدي ولا مكتبة أخرى) — مطابقتها قيد التنفيذ (B0).
- أي تبعية جديدة: سبب + فحص ترخيص وتوافق + سطر في `DECISIONS.md`.
- CSS بوحدات منطقية (`margin-inline-start`…)، لمس ≥ 44px، مدخلات 16px.
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- كل تغيير سلوك = اختبار، وكل خطأ يُصلَح = اختبار يفشل قبل الإصلاح.

## الأوامر

`pnpm install` · `pnpm dev` · `pnpm build` · `pnpm test` · `pnpm lint` · `pnpm format:check` (pnpm 12 وNode 24، كما في المرجع؛ القفل يُولَّد في CI: D-027)

## بوابات CI

lint (0 تحذيرات) ← format ← test ← build. لا دمج في `main` قبل أن يخضر CI على الفرع.
