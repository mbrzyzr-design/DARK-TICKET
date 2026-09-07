// ===================================================
// models/GuildConfig.js
// مخطط قاعدة البيانات لحفظ إعدادات كل سيرفر بشكل مستقل
// ===================================================

const mongoose = require('mongoose');

// تعريف مخطط إعدادات السيرفر
const GuildConfigSchema = new mongoose.Schema(
  {
    // معرّف السيرفر الفريد من ديسكورد
    guildId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // معرّف الروم الذي سيُرسَل فيه بانل التذاكر
    ticketChannelId: {
      type: String,
      default: null,
    },

    // معرّف فئة (Category) التي ستُنشأ فيها رومات التذاكر الخاصة
    categoryId: {
      type: String,
      default: null,
    },

    // معرّف رتبة فريق الدعم الفني التي ستملك صلاحية رؤية التذاكر
    supportRoleId: {
      type: String,
      default: null,
    },

    // عنوان رسالة الـ Embed الخاصة ببانل التذاكر
    embedTitle: {
      type: String,
      default: '🎫 نظام التذاكر',
      maxlength: 256,
    },

    // وصف رسالة الـ Embed الخاصة ببانل التذاكر
    embedDescription: {
      type: String,
      default: 'مرحباً! إذا كنت تحتاج إلى مساعدة، اضغط على الزر أدناه لفتح تذكرة دعم فني وسيتواصل معك فريقنا في أقرب وقت.',
      maxlength: 4096,
    },

    // لون رسالة الـ Embed بصيغة Hex
    embedColor: {
      type: String,
      default: '#8a2be2',
      match: /^#[0-9A-Fa-f]{6}$/,
    },

    // معرّف الرسالة التي أُرسل فيها البانل (لتعديلها لاحقاً بدل إرسال رسالة جديدة)
    panelMessageId: {
      type: String,
      default: null,
    },

    // عداد إجمالي التذاكر المُنشأة في هذا السيرفر
    totalTickets: {
      type: Number,
      default: 0,
    },
  },
  {
    // إضافة حقلي createdAt و updatedAt تلقائياً
    timestamps: true,
  }
);

// دالة مساعدة: تحديث عداد التذاكر وإرجاع الرقم الجديد
GuildConfigSchema.methods.incrementTicketCount = async function () {
  this.totalTickets += 1;
  await this.save();
  return this.totalTickets;
};

// تصدير الموديل للاستخدام في باقي الملفات
module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
