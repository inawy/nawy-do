# المعمارية — Nawy To Do

## الطبقات (اتجاه الاعتماد من اليسار إلى اليمين فقط، يفرضه lint وله اختبارات سلبية)

```text
core  ←  data  ←  features  ←  ui  ←  app
```

| الطبقة     | المسؤولية                                                         | ممنوع                     |
| ---------- | ----------------------------------------------------------------- | ------------------------- |
| `core`     | قواعد المنتج كدوال نقية: النموذج، الدمج، الترتيب، التواريخ، الملف | React، Dexie، DOM، الساعة |
| `data`     | Dexie: المخطط، CRUD بـ tombstones، التصدير/الاستيراد، التنظيف     | React، أي طبقة أعلى       |
| `features` | حالة وسلوك كل ميزة (hooks) فوق `data`                             | Dexie مباشرة، `ui`، `app` |
| `ui`       | مكوّنات عرض تأخذ خصائص وتُرجع أحداثًا                             | `data`، `app`             |
| `app`      | التركيب: يربط الـ hooks بالشاشة، الساعة، قاعدة البيانات، تسجيل SW | —                         |

## الوحدات (modules)

```text
src/
  core/model/          نموذج المهمة (types · task · group · order · merge · validate · envelope · civil)
  data/                schema · store · live · backup · purge
  features/<ميزة>/     index.ts + ملفاتها (مثلًا tasks/)
  ui/
    primitives/        أيقونات وعناصر صغيرة بلا منطق
    tasks/             Composer · TaskRow · TaskList · UndoToast
    details/           DetailsSheet
    shell/             TasksScreen · Nav (تركيب الشاشة)
    styles/            tokens · base · shell · tasks · details · feedback (index.css يجمعها)
  app/                 App · clock · db · updateSignal
```

**قاعدة الوحدة:** كل وحدة في `ui/` و`features/` تُستخدم **عبر `index.ts` فقط** (`@/ui/shell` نعم، `@/ui/shell/Nav` لا). داخل الوحدة تُستخدم المسارات النسبية. القاعدة مفروضة بـ lint (D-015).

## كيف تضيف ميزة جديدة (مثال: القوائم)

1. **core:** الأنواع والقواعد النقية + اختبارات (لا ساعة، لا Dexie).
2. **data:** إصدار مخطط جديد `db.version(n)` (لا تعدّل قديمًا) + ترحيل + اختبار ترحيل + (لقطة قبل الترحيل).
3. **features/<ميزة>/:** hook + `index.ts`.
4. **ui/<ميزة>/:** مكوّنات بخصائص فقط + `index.ts`، وملف CSS في `ui/styles/` يُضاف إلى `index.css`.
5. **app:** اربطها في `App.tsx` (التركيب الوحيد).
6. اختبار تكامل (jsdom) + سيناريو e2e، وقرار في `DECISIONS.md`.

## مبادئ

- الوقت يُمرَّر (`now`, `today`) ولا يُقرأ إلا في `app/clock.ts`.
- لا حذف فعلي إلا `data/purge.ts` (tombstones بعد 90 يومًا).
- الشاشة دالة من خصائصها (`TasksScreen`): تُعاين بلا قاعدة بيانات وتُختبر بسهولة.
- التصميم عبر tokens في `ui/styles/tokens.css` فقط؛ لا ألوان صريحة في بقية الملفات إلا لونًا دلاليًا موثّقًا (نجمة).
