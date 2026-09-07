# 🎫 DARK TICKET — دليل التشغيل الكامل

---

## 📋 المتطلبات الأساسية قبل البدء

| المتطلب | الإصدار | رابط التحميل |
|---|---|---|
| Node.js | v18 أو أحدث | https://nodejs.org |
| MongoDB | محلي أو Atlas | https://www.mongodb.com |
| حساب Discord Developer | — | https://discord.com/developers |

---

## 🔑 الخطوة 1 — إنشاء التطبيق في Discord Developer Portal

1. افتح: https://discord.com/developers/applications
2. اضغط **"New Application"** وسمّه "DARK TICKET"
3. من القائمة الجانبية اختر **"Bot"**:
   - اضغط **"Add Bot"**
   - اضغط **"Reset Token"** وانسخ التوكن ← هذا هو DISCORD_TOKEN
   - فعّل هذه الـ Privileged Intents:
     ✅ SERVER MEMBERS INTENT
     ✅ MESSAGE CONTENT INTENT

4. من القائمة الجانبية اختر **"OAuth2"** → **"General"**:
   - انسخ **Client ID** ← هذا هو DISCORD_CLIENT_ID
   - اضغط **"Reset Secret"** وانسخه ← هذا هو DISCORD_CLIENT_SECRET

5. من **"OAuth2"** → **"Redirects"**:
   - اضغط **"Add Redirect"**
   - أضف: http://localhost:3000/auth/callback
   - اضغط **"Save Changes"**

---

## 🤖 الخطوة 2 — دعوة البوت لسيرفرك

افتح هذا الرابط في المتصفح (ضع Client ID الخاص بك):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID_HERE&permissions=8&scope=bot%20applications.commands
```

> ⚠️ صلاحية 8 = Administrator (مطلوبة لإنشاء الرومات وتعديل الصلاحيات)

---

## ⚙️ الخطوة 3 — إعداد ملف البيئة (.env)

انسخ الملف وعدّله:

```bash
cp .env.example .env
```

افتح ملف `.env` وعبّئ القيم:

```env
DISCORD_TOKEN=توكن_البوت_هنا
DISCORD_CLIENT_ID=client_id_هنا
DISCORD_CLIENT_SECRET=client_secret_هنا
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
MONGODB_URI=mongodb://localhost:27017/dark-ticket
PORT=3000
SESSION_SECRET=اكتب_هنا_نص_عشوائي_طويل_لا_يعرفه_احد
```

> 💡 للـ SESSION_SECRET: اكتب أي نص عشوائي طويل مثل:
> mY$uP3r$3cr3tK3y!DarkTicket2024#NotPublic

---

## 🗄️ الخطوة 4 — تشغيل MongoDB

### الخيار A: MongoDB محلي (مثبّت على جهازك)
```bash
# Windows: شغّل خدمة MongoDB من Services
# Mac:
brew services start mongodb-community
# Linux:
sudo systemctl start mongod
```

### الخيار B: MongoDB Atlas (مجاني على السحابة) ← الأسهل
1. افتح https://www.mongodb.com/atlas
2. أنشئ حساباً مجانياً
3. أنشئ Cluster مجاني (M0)
4. من **"Connect"** اختر **"Drivers"** وانسخ الرابط
5. ضعه في MONGODB_URI مع كلمة مرورك

---

## 📦 الخطوة 5 — تثبيت المكتبات وتشغيل المشروع

```bash
# تثبيت جميع المكتبات
npm install

# تشغيل المشروع
npm start
```

### ✅ ستشاهد في Terminal:
```
╔══════════════════════════════════════════╗
║         🎫  DARK TICKET  STARTING        ║
╚══════════════════════════════════════════╝
[DB]  ✅ اتصال MongoDB ناجح!
[BOT] ✅ تسجّل البوت بنجاح كـ: DARK TICKET#1234
[WEB] 🌐 خادم الويب يعمل على: http://localhost:3000
[DARK TICKET] 🚀 كل الأنظمة تعمل بنجاح!
```

---

## 🌐 الخطوة 6 — استخدام لوحة التحكم

1. افتح المتصفح: **http://localhost:3000**
2. اضغط **"تسجيل الدخول عبر ديسكورد"**
3. وافق على الصلاحيات في ديسكورد
4. ستظهر لك السيرفرات التي فيها البوت وتملك صلاحية إدارتها
5. اضغط **"إعداد التذاكر"** بجانب سيرفرك
6. في صفحة الإدارة:
   - اختر روم البانل (حيث سيُرسَل الزر)
   - اختر الفئة (حيث ستُنشأ التذاكر)
   - اختر رتبة الدعم الفني
   - خصّص العنوان والوصف واللون
   - اضغط **"حفظ وإرسال البانل التفاعلي"**
7. 🎉 البانل سيظهر فوراً في سيرفرك!

---

## 🎫 كيف يعمل نظام التذاكر؟

```
العضو يضغط "📩 فتح تذكرة"
         ↓
البوت ينشئ روم خاص: ticket-username
         ↓
الروم مرئي فقط لـ: صاحب التذكرة + رتبة الدعم
         ↓
رسالة ترحيبية + زر "🔒 إغلاق التذكرة"
         ↓
عند الإغلاق: عد تنازلي 5 ثوانٍ → حذف الروم
```

---

## 🔧 استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `Missing required env variable` | تأكد من وجود ملف `.env` وتعبئة جميع القيم |
| `MongoServerError` | تأكد أن MongoDB يعمل أو الرابط صحيح |
| `TokenInvalid` | التوكن خاطئ، أعد نسخه من Developer Portal |
| البوت لا يُنشئ رومات | تأكد من صلاحية Administrator عند دعوة البوت |
| صفحة OAuth تعطي خطأ | تأكد أن Redirect URI مضاف بالضبط في Developer Portal |
| `Cannot find module` | شغّل `npm install` مجدداً |

---

## 📂 هيكل المشروع

```
dark-ticket/
├── 📄 index.js              ← الملف الرئيسي (البوت + الخادم)
├── 📄 package.json          ← تعريف المشروع والمكتبات
├── 📄 .env.example          ← نموذج متغيرات البيئة
├── 📁 models/
│   └── 📄 GuildConfig.js   ← مخطط قاعدة البيانات
└── 📁 views/
    ├── 📄 index.ejs         ← الصفحة الرئيسية
    ├── 📄 dashboard.ejs     ← صفحة اختيار السيرفر
    └── 📄 manage.ejs        ← لوحة إدارة التذاكر
```

---

## 🚀 نشر المشروع على الإنترنت (اختياري)

### على Railway.app (مجاني):
1. افتح https://railway.app وسجّل بـ GitHub
2. اضغط **"New Project"** → **"Deploy from GitHub repo"**
3. ارفع المشروع على GitHub أولاً
4. في Railway: اضغط **"Variables"** وأضف كل متغيرات `.env`
5. غيّر `DISCORD_REDIRECT_URI` لرابط Railway بدل localhost
6. أضف نفس الرابط الجديد في Discord Developer Portal

---

*🎫 DARK TICKET — صُنع بـ ❤️*
