# 🚂 دليل الرفع على Railway.app — خطوة بخطوة

---

## ما ستحتاجه قبل البدء:
- ✅ حساب GitHub (مجاني): https://github.com
- ✅ حساب Railway (مجاني): https://railway.app
- ✅ بيانات بوت الديسكورد (Token, Client ID, Client Secret)

---

## 📌 الخطوة 1 — رفع المشروع على GitHub

### إذا لم يكن عندك Git مثبّت:
حمّله من: https://git-scm.com/downloads

### الأوامر في Terminal/CMD داخل مجلد المشروع:

```bash
git init
git add .
git commit -m "DARK TICKET - first commit"
```

### ثم أنشئ Repository جديد على GitHub:
1. افتح https://github.com/new
2. اسمه: dark-ticket
3. اتركه Private ✅ (لا أحد يرى توكن بوتك)
4. اضغط "Create repository"
5. انسخ الأوامر الظاهرة تحت "…or push an existing repository" والصقها في Terminal

---

## 📌 الخطوة 2 — إنشاء قاعدة بيانات MongoDB Atlas (مجانية)

1. افتح: https://www.mongodb.com/atlas/database
2. اضغط "Try Free" وأنشئ حساباً
3. اختر "Free" (M0 Cluster)
4. اختر أي Region قريب منك
5. اضغط "Create Cluster" وانتظر دقيقة
6. من القائمة الجانبية: Security → Database Access
   - اضغط "Add New Database User"
   - Username: darkticket
   - Password: اضغط "Autogenerate" وانسخ الباسورد
   - اضغط "Add User"
7. Security → Network Access
   - اضغط "Add IP Address"
   - اضغط "Allow Access from Anywhere" (0.0.0.0/0)
   - اضغط "Confirm"
8. من الصفحة الرئيسية اضغط "Connect" على الـ Cluster
   - اختر "Drivers"
   - انسخ الرابط، سيكون مثل:
     mongodb+srv://darkticket:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   - استبدل <password> بالباسورد الذي نسخته
   - أضف اسم قاعدة البيانات قبل ?: /dark-ticket?
   - النتيجة: mongodb+srv://darkticket:YOURPASS@cluster0.xxxxx.mongodb.net/dark-ticket?retryWrites=true&w=majority

---

## 📌 الخطوة 3 — إعداد Redirect URI الجديد في Discord

1. افتح: https://discord.com/developers/applications
2. اختر تطبيقك
3. OAuth2 → General → Redirects
4. احذف: http://localhost:3000/auth/callback
5. أضف مؤقتاً: https://placeholder.up.railway.app/auth/callback
   (سنحدثه بعد معرفة رابط Railway الحقيقي)
6. اضغط "Save Changes"

---

## 📌 الخطوة 4 — الرفع على Railway

1. افتح: https://railway.app
2. سجّل دخول بـ GitHub
3. اضغط "New Project"
4. اختر "Deploy from GitHub repo"
5. اختر مستودع dark-ticket
6. Railway سيبدأ البناء تلقائياً (سيفشل أول مرة لأن .env فارغ — طبيعي)

### إضافة متغيرات البيئة:
7. اضغط على المشروع → "Variables" → "Add Variables"
8. أضف هذه المتغيرات واحداً واحداً:

| المتغير | القيمة |
|---|---|
| DISCORD_TOKEN | توكن البوت |
| DISCORD_CLIENT_ID | Client ID |
| DISCORD_CLIENT_SECRET | Client Secret |
| MONGODB_URI | رابط Atlas الذي نسخته |
| SESSION_SECRET | أي نص عشوائي طويل |
| NODE_ENV | production |
| PORT | 3000 |
| DISCORD_REDIRECT_URI | سنضيفه بعد قليل |

9. اضغط "Deploy" أو انتظر Railway يعيد النشر تلقائياً

---

## 📌 الخطوة 5 — الحصول على رابط Railway وإكمال الإعداد

1. في Railway اضغط على مشروعك
2. اضغط "Settings" → "Networking" → "Generate Domain"
3. انسخ الرابط، مثل: https://dark-ticket-production.up.railway.app

### حدّث الـ Redirect URI:
4. ارجع لـ Discord Developer Portal → OAuth2 → Redirects
5. عدّل الرابط المؤقت إلى:
   https://dark-ticket-production.up.railway.app/auth/callback
6. اضغط "Save Changes"

### حدّث المتغير في Railway:
7. ارجع لـ Railway → Variables
8. عدّل DISCORD_REDIRECT_URI إلى:
   https://dark-ticket-production.up.railway.app/auth/callback
9. Railway سيعيد النشر تلقائياً

---

## ✅ الخطوة 6 — التأكد من عمل كل شيء

1. افتح: https://dark-ticket-production.up.railway.app
2. يجب أن تظهر الصفحة الرئيسية لـ DARK TICKET
3. اضغط "تسجيل الدخول عبر ديسكورد"
4. بعد الموافقة ستُوجَّه للداشبورد
5. اختر سيرفرك وأعدّ البانل 🎉

---

## 🔍 إذا واجهت مشكلة:

في Railway اضغط على مشروعك → "Deployments" → آخر deployment → "View Logs"
ستجد سبب الخطأ بالضبط.

---

## 💡 نصائح مهمة:

- **لا ترفع ملف .env أبداً على GitHub** — الـ .gitignore يمنع ذلك تلقائياً
- **Railway المجاني** = 500 ساعة/شهر = يكفي لسيرفر واحد نشط
- **لو انتهت الساعات** = أضف بطاقة بنكية (لن يُخصم منها شيء في الخطة المجانية)

---
*🎫 DARK TICKET — Railway Deploy Guide*
