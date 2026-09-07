// ===================================================
// index.js — DARK TICKET
// الملف الرئيسي: يشغّل بوت الديسكورد + خادم الويب Express
// معاً في نفس الوقت بشكل متزامن وكامل.
// ===================================================

'use strict';

// ─── استيراد المكتبات الأساسية ───────────────────────
require('dotenv').config();                              // تحميل متغيرات البيئة من ملف .env

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const express        = require('express');
const session        = require('express-session');
const mongoose       = require('mongoose');
const axios          = require('axios');
const path           = require('path');

// ─── استيراد الموديل ──────────────────────────────────
const BuildConfig = require('./GuildConfig');

// ─── التحقق من متغيرات البيئة الأساسية ───────────────
const REQUIRED_ENV = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'MONGODB_URI',
  'SESSION_SECRET',
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[DARK TICKET] ❌ متغير البيئة مفقود: ${key}`);
    process.exit(1);
  }
});

// ─── ثوابت OAuth2 ─────────────────────────────────────
const DISCORD_API        = 'https://discord.com/api/v10';
const OAUTH_SCOPES       = 'identify guilds';
const CLIENT_ID          = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET      = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI       = process.env.DISCORD_REDIRECT_URI;
const PORT               = parseInt(process.env.PORT || '3000', 10);

// رابط OAuth2 الكامل لتسجيل الدخول
const OAUTH_URL =
  `https://discord.com/api/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(OAUTH_SCOPES)}`;

// ===================================================
// ░░ الجزء الأول: إعداد بوت الديسكورد ░░
// ===================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,               // معلومات السيرفرات
    GatewayIntentBits.GuildMessages,        // الرسائل (للقراءة)
    GatewayIntentBits.MessageContent,       // محتوى الرسائل
    GatewayIntentBits.GuildMembers,         // معلومات الأعضاء
  ],
});

// ─── حدث: جهوزية البوت ────────────────────────────────
client.once('ready', async () => {
  console.log(`[BOT] ✅ تسجّل البوت بنجاح كـ: ${client.user.tag}`);
  console.log(`[BOT] 📡 يخدم ${client.guilds.cache.size} سيرفر(ات).`);

  // تعيين الحالة والنشاط
  client.user.setPresence({
    status: 'online',
    activities: [{ name: '🎫 DARK TICKET | نظام التذاكر', type: 3 }],
  });

  // ─── تم التعديل هنا: كود تسجيل الأوامر المائلة في ديسكورد ───
  const commandsData = [
    {
      name: 'setup',
      description: 'إرسال بانل نظام التذاكر في الروم الحالية',
    }
  ];

  try {
    await client.application.commands.set(commandsData);
    console.log('[BOT] 🚀 تم تسجيل الأوامر المائلة (/) بنجاح في ديسكورد!');
  } catch (error) {
    console.error('[BOT] ❌ خطأ أثناء تسجيل الأوامر المائلة:', error);
  }
});

// ─── حدث: التفاعل (الأزرار والأوامر المائلة) ────────────────────────────
client.on('interactionCreate', async (interaction) => {
  
  // 1. معالجة الأوامر المائلة (Slash Commands)
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup') {
      // قم بكتابة كود إرسال البانل هنا
      await interaction.reply({ content: '⏳ جاري إعداد وإرسال بانل التذاكر...', ephemeral: true });
    }
    return; // إنهاء التنفيذ هنا للأوامر
  }

  // 2. معالجة ضغطات الأزرار (Buttons)
  if (interaction.isButton()) {
    const { customId, guild, member, channel } = interaction;
    // أكمل كود الأزرار الخاص بك هنا لفتح وإغلاق التذاكر...
  }
});

// ─── حدث: التفاعل بالأزرار ────────────────────────────
client.on('interactionCreate', async (interaction) => {
  // نتجاهل أي تفاعل ليس ضغطة زر
  if (!interaction.isButton()) return;

  const { customId, guild, member, channel } = interaction;

  // ======================================================
  // زر: فتح تذكرة جديدة (create_ticket)
  // ======================================================
  if (customId === 'create_ticket') {
    await handleCreateTicket(interaction, guild, member);
    return;
  }

  // ======================================================
  // زر: إغلاق التذكرة (close_ticket)
  // ======================================================
  if (customId === 'close_ticket') {
    await handleCloseTicket(interaction, channel);
    return;
  }
});

// ─────────────────────────────────────────────────────────
// دالة: منطق فتح التذكرة
// ─────────────────────────────────────────────────────────
async function handleCreateTicket(interaction, guild, member) {
  try {
    // تأجيل الرد فوراً لتجنب انتهاء وقت التفاعل
    await interaction.deferReply({ ephemeral: true });

    // جلب إعدادات السيرفر من قاعدة البيانات
    const config = await GuildConfig.findOne({ guildId: guild.id });

    if (!config || !config.categoryId || !config.supportRoleId) {
      return interaction.editReply({
        content: '❌ **لم يتم إعداد نظام التذاكر بعد.**\nيرجى التواصل مع إدارة السيرفر.',
      });
    }

    // التحقق من عدم وجود تذكرة مفتوحة لنفس العضو في نفس الفئة
    const categoryChannel = guild.channels.cache.get(config.categoryId);
    if (categoryChannel) {
      const existingTicket = guild.channels.cache.find(
        (ch) =>
          ch.parentId === config.categoryId &&
          ch.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      );

      if (existingTicket) {
        return interaction.editReply({
          content: `❌ **لديك تذكرة مفتوحة بالفعل!**\nيمكنك التوجه إليها هنا: <#${existingTicket.id}>`,
        });
      }
    }

    // إنشاء اسم الروم (بدون رموز خاصة)
    const safeUsername = member.user.username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'user';

    const channelName = `ticket-${safeUsername}`;

    // تعريف الصلاحيات:
    // 1. منع @everyone من رؤية الروم
    // 2. منح صاحب التذكرة صلاحية الرؤية والإرسال
    // 3. منح رتبة الدعم الفني صلاحية الرؤية والإرسال والإدارة
    const permissionOverwrites = [
      {
        // @everyone — لا يرى الروم
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        // صاحب التذكرة — يرى ويرسل
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        // رتبة الدعم — كل الصلاحيات
        id: config.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      },
      {
        // البوت نفسه — كل الصلاحيات لإدارة الروم
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ];

    // إنشاء الروم الخاص بالتذكرة داخل الفئة المحددة
    const ticketChannel = await guild.channels.create({
      name:                 channelName,
      type:                 ChannelType.GuildText,
      parent:               config.categoryId,
      topic:                `تذكرة دعم فني | صاحبها: ${member.user.tag} | ID: ${member.id}`,
      permissionOverwrites: permissionOverwrites,
    });

    // زيادة عداد التذاكر في قاعدة البيانات
    await config.incrementTicketCount();

    // ─── بناء رسالة الترحيب داخل التذكرة ───
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setAuthor({
        name:    'DARK TICKET — نظام الدعم الفني',
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle(`🎫 تذكرة دعم جديدة — #${config.totalTickets}`)
      .setDescription(
        `مرحباً ${member}!\n\n` +
        `شكراً لتواصلك معنا. يرجى شرح مشكلتك بالتفصيل وسيتولى فريق الدعم الرد عليك في أقرب وقت ممكن.\n\n` +
        `> 📌 **نصيحة:** كلما أعطيت تفاصيل أكثر، كان الحل أسرع!`
      )
      .addFields(
        { name: '👤 صاحب التذكرة', value: `${member} (${member.user.tag})`, inline: true },
        { name: '🆔 معرّف العضو',    value: `\`${member.id}\``,              inline: true },
        { name: '📅 وقت الفتح',      value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      )
      .setFooter({ text: `DARK TICKET | ${guild.name}` })
      .setTimestamp();

    // ─── زر إغلاق التذكرة ───
    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 إغلاق التذكرة')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(closeButton);

    // إرسال رسالة الترحيب داخل الروم الجديد
    await ticketChannel.send({
      content: `${member} | <@&${config.supportRoleId}>`,
      embeds:  [welcomeEmbed],
      components: [actionRow],
    });

    // تأكيد للعضو أن التذكرة فُتحت
    await interaction.editReply({
      content: `✅ **تم فتح تذكرتك بنجاح!**\nتفضّل بزيارة: ${ticketChannel}`,
    });

    console.log(`[TICKET] ✅ فتح تذكرة جديدة: ${channelName} | السيرفر: ${guild.name}`);

  } catch (err) {
    console.error('[TICKET] ❌ خطأ في فتح التذكرة:', err);

    // محاولة الرد بالخطأ إذا لم يُردّ بعد
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ حدث خطأ أثناء فتح التذكرة. يرجى المحاولة مجدداً.' });
      } else {
        await interaction.reply({ content: '❌ حدث خطأ أثناء فتح التذكرة.', ephemeral: true });
      }
    } catch (_) { /* تجاهل خطأ الرد المكرر */ }
  }
}

// ─────────────────────────────────────────────────────────
// دالة: منطق إغلاق التذكرة مع عد تنازلي
// ─────────────────────────────────────────────────────────
async function handleCloseTicket(interaction, channel) {
  try {
    // رد فوري غير مؤجل لإظهار الإشعار للعضو
    await interaction.reply({
      content:   '🔒 **جارٍ إغلاق التذكرة...**\nسيتم حذف هذا الروم بعد **5 ثوانٍ**.',
      ephemeral: false,
    });

    // ─── عد تنازلي: 5 → 4 → 3 → 2 → 1 ───
    const countdownSeconds = [5, 4, 3, 2, 1];

    for (const sec of countdownSeconds) {
      await delay(1000); // انتظر ثانية واحدة

      // التحقق من أن الروم لا يزال موجوداً قبل محاولة التعديل
      const stillExists = channel.guild.channels.cache.has(channel.id);
      if (!stillExists) return;

      try {
        await interaction.editReply({
          content: `🔒 **سيتم حذف هذا الروم خلال ${sec} ثانية...**`,
        });
      } catch (_) { /* تجاهل إذا انتهت صلاحية التفاعل */ }
    }

    // انتظر ثانية أخيرة ثم احذف الروم
    await delay(1000);

    // تسجيل قبل الحذف
    console.log(`[TICKET] 🗑️ حذف تذكرة: ${channel.name} | السيرفر: ${channel.guild.name}`);

    await channel.delete('إغلاق التذكرة — DARK TICKET');

  } catch (err) {
    console.error('[TICKET] ❌ خطأ في إغلاق التذكرة:', err);

    try {
      await channel.delete('إغلاق قسري للتذكرة — DARK TICKET').catch(() => {});
    } catch (_) { /* تجاهل */ }
  }
}

// ─────────────────────────────────────────────────────────
// دالة مساعدة: إنشاء وإرسال/تحديث بانل التذاكر في ديسكورد
// تُستدعى من المسار POST /manage/:guildId
// ─────────────────────────────────────────────────────────
async function sendOrUpdateTicketPanel(config) {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    throw new Error('البوت غير موجود في هذا السيرفر أو السيرفر غير متاح.');
  }

  const panelChannel = guild.channels.cache.get(config.ticketChannelId);
  if (!panelChannel) {
    throw new Error('لم يتم العثور على روم البانل. تأكد من صحة الروم المختار.');
  }

  // التحقق من أن البوت لديه صلاحية الإرسال في الروم
  const botMember = guild.members.cache.get(client.user.id);
  if (!panelChannel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages)) {
    throw new Error('البوت لا يملك صلاحية الإرسال في الروم المختار.');
  }

  // ─── بناء الـ Embed ───
  // تحويل لون Hex إلى رقم عشري (مثل: #8a2be2 → 9055202)
  const colorHex = (config.embedColor || '#8a2be2').replace('#', '');
  const colorInt = parseInt(colorHex, 16);

  const panelEmbed = new EmbedBuilder()
    .setColor(colorInt)
    .setTitle(config.embedTitle || '🎫 نظام التذاكر')
    .setDescription(config.embedDescription || 'اضغط على الزر أدناه لفتح تذكرة دعم فني.')
    .setFooter({
      text:    `DARK TICKET | ${guild.name}`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  // ─── زر فتح التذكرة ───
  const openButton = new ButtonBuilder()
    .setCustomId('create_ticket')
    .setLabel('📩 فتح تذكرة')
    .setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder().addComponents(openButton);

  // محاولة تعديل الرسالة القديمة إذا كانت موجودة
  if (config.panelMessageId) {
    try {
      const oldMessage = await panelChannel.messages.fetch(config.panelMessageId);
      await oldMessage.edit({ embeds: [panelEmbed], components: [actionRow] });
      console.log(`[PANEL] ✏️ تحديث البانل الموجود في: ${panelChannel.name} | السيرفر: ${guild.name}`);
      return; // تم التحديث، لا حاجة لإرسال رسالة جديدة
    } catch (_) {
      // الرسالة القديمة غير موجودة أو محذوفة، سنرسل واحدة جديدة
    }
  }

  // إرسال رسالة بانل جديدة
  const sentMessage = await panelChannel.send({
    embeds:     [panelEmbed],
    components: [actionRow],
  });

  // حفظ معرّف الرسالة الجديدة في قاعدة البيانات
  config.panelMessageId = sentMessage.id;
  await config.save();

  console.log(`[PANEL] ✅ إرسال بانل جديد في: ${panelChannel.name} | السيرفر: ${guild.name}`);
}

// ===================================================
// ░░ الجزء الثاني: إعداد خادم Express (الويب) ░░
// ===================================================

const app = express();

// ─── تم التعديل هنا: إعداد محرك القوالب EJS ليقرأ من المجلد الرئيسي مباشرة ───
app.set('view engine', 'ejs');
app.set('views', __dirname); 

// مهم جداً لـ Railway: يخبر Express أنه وراء Reverse Proxy
// حتى تعمل الـ Cookies بشكل صحيح مع HTTPS
app.set('trust proxy', 1);

// ─── تم التعديل هنا: قراءة الملفات الساكنة (CSS/الصور) من المجلد الرئيسي مباشرة ───
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 

// ─── إعداد الجلسات (Sessions) ─────────────────────────
app.use(
  session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure:   process.env.NODE_ENV === 'production', // تلقائي: true في Railway (HTTPS)، false محلياً
      httpOnly: true,           // حماية من XSS
      maxAge:   7 * 24 * 60 * 60 * 1000, // صلاحية 7 أيام
    },
  })
);

// ─────────────────────────────────────────────────────────
// Middleware: التحقق من تسجيل الدخول
// يُستخدم لحماية المسارات التي تتطلب صلاحية
// ─────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  // حفظ الرابط المطلوب للتوجيه إليه بعد الدخول
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
}

// ─────────────────────────────────────────────────────────
// Middleware: التحقق من صلاحية إدارة السيرفر
// يتحقق أن المستخدم يملك MANAGE_GUILD في السيرفر المطلوب
// ─────────────────────────────────────────────────────────
function requireGuildAdmin(req, res, next) {
  const { guildId } = req.params;
  const userGuilds  = req.session.guilds || [];

  // حساب قيمة MANAGE_GUILD = 0x20 = 32
  const MANAGE_GUILD = BigInt(0x20);

  const hasPermission = userGuilds.some(
    (g) =>
      g.id === guildId &&
      (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD
  );

  if (!hasPermission) {
    return res.status(403).send(
      '<h2 style="font-family:Arial;color:red;text-align:center;margin-top:50px;">403 — لا تملك صلاحية الوصول لهذا السيرفر.</h2>'
    );
  }

  next();
}

// ===================================================
// ░░ مسارات OAuth2 (تسجيل الدخول) ░░
// ===================================================

// GET /auth/login — توجيه المستخدم لديسكورد للموافقة
app.get('/auth/login', (req, res) => {
  res.redirect(OAUTH_URL);
});

// GET /auth/callback — استقبال كود الموافقة من ديسكورد
app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;

  // المستخدم رفض الموافقة
  if (error || !code) {
    return res.redirect('/?error=access_denied');
  }

  try {
    // ─── الخطوة 1: استبدال الكود بـ Access Token ───
    const tokenResponse = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'authorization_code',
        code:          code,
        redirect_uri:  REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    // ─── الخطوة 2: جلب بيانات المستخدم ───
    const [userResponse, guildsResponse] = await Promise.all([
      axios.get(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      axios.get(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    const user   = userResponse.data;
    const guilds = guildsResponse.data;

    // ─── الخطوة 3: حفظ بيانات المستخدم والسيرفرات في الجلسة ───
    req.session.user   = user;
    req.session.guilds = guilds;

    // التوجيه للصفحة التي كان يحاول الوصول إليها (أو الداشبورد)
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;

    res.redirect(returnTo);

  } catch (err) {
    console.error('[AUTH] ❌ خطأ في OAuth2 Callback:', err.response?.data || err.message);
    res.redirect('/?error=auth_failed');
  }
});

// GET /auth/logout — تسجيل الخروج وحذف الجلسة
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ===================================================
// ░░ المسارات العامة ░░
// ===================================================

// GET / — الصفحة الرئيسية
app.get('/', (req, res) => {
  res.render('index', {
    user: req.session.user || null,
  });
});
// ===================================================
// ░░ مسارات الداشبورد (تتطلب تسجيل دخول) ░░
// ===================================================

// GET /dashboard — قائمة السيرفرات
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userGuilds  = req.session.guilds || [];
    const MANAGE_GUILD = BigInt(0x20);

    // فلترة السيرفرات التي يملك فيها المستخدم صلاحية الإدارة
    const adminGuilds = userGuilds.filter(
      (g) => (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD
    );

    // التحقق من أي السيرفرات يتواجد فيها البوت
    const guildsWithBotStatus = adminGuilds.map((g) => ({
      ...g,
      botPresent: client.guilds.cache.has(g.id),
    }));

    res.render('dashboard', {
      user:     req.session.user,
      guilds:   guildsWithBotStatus,
      clientId: CLIENT_ID,
    });

  } catch (err) {
    console.error('[DASHBOARD] ❌ خطأ في تحميل الداشبورد:', err);
    res.status(500).send('حدث خطأ في تحميل الداشبورد.');
  }
});

// ─────────────────────────────────────────────────────────
// GET /manage/:guildId — صفحة إعداد سيرفر محدد
// ─────────────────────────────────────────────────────────
app.get('/manage/:guildId', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  try {
    // التحقق من تواجد البوت في السيرفر
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).send(
        '<h2 style="font-family:Arial;color:orange;text-align:center;margin-top:50px;">البوت غير موجود في هذا السيرفر. يرجى دعوته أولاً.</h2>'
      );
    }

    // جلب أو إنشاء إعدادات السيرفر من قاعدة البيانات
    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
      config = new GuildConfig({ guildId });
      await config.save();
    }

    // جلب قنوات السيرفر (نصية وفئات)
    const channels = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildCategory)
      .map((ch) => ({
        id:   ch.id,
        name: ch.name,
        type: ch.type, // 0 = نصي، 4 = فئة
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // جلب أدوار السيرفر (بدون @everyone والبوتات)
    const roles = guild.roles.cache
      .filter((r) => !r.managed && r.id !== guild.id)
      .map((r) => ({
        id:       r.id,
        name:     r.name,
        hexColor: r.hexColor,
      }))
      .sort((a, b) => b.position - a.position);

    res.render('manage', {
      user:     req.session.user,
      guild:    { id: guild.id, name: guild.name, icon: guild.icon },
      config:   config.toObject(),
      channels,
      roles,
      success:  req.query.success === '1',
      error:    req.query.error || null,
    });

  } catch (err) {
    console.error('[MANAGE] ❌ خطأ في تحميل صفحة الإدارة:', err);
    res.status(500).send('حدث خطأ في تحميل صفحة الإدارة.');
  }
});

// ─────────────────────────────────────────────────────────
// POST /manage/:guildId — حفظ الإعدادات وإرسال البانل
// ─────────────────────────────────────────────────────────
app.post('/manage/:guildId', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  try {
    const {
      ticketChannelId,
      categoryId,
      supportRoleId,
      embedTitle,
      embedDescription,
      embedColor,
    } = req.body;

    // ─── التحقق من الحقول الإلزامية ───
    if (!ticketChannelId || !categoryId || !supportRoleId) {
      return res.redirect(
        `/manage/${guildId}?error=${encodeURIComponent('يرجى تعبئة جميع الحقول الإلزامية: الروم، الفئة، والرتبة.')}`
      );
    }

    // ─── التحقق من صحة لون الـ Hex ───
    const colorToSave = /^#[0-9A-Fa-f]{6}$/.test(embedColor) ? embedColor : '#8a2be2';

    // ─── تحديث أو إنشاء إعدادات السيرفر في DB ───
    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      {
        $set: {
          ticketChannelId,
          categoryId,
          supportRoleId,
          embedTitle:       (embedTitle       || '🎫 نظام التذاكر').trim().slice(0, 256),
          embedDescription: (embedDescription || 'اضغط على الزر أدناه لفتح تذكرة.').trim().slice(0, 1024),
          embedColor:       colorToSave,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // ─── إرسال أو تحديث البانل في ديسكورد ───
    await sendOrUpdateTicketPanel(config);

    // التوجيه مع رسالة النجاح
    res.redirect(`/manage/${guildId}?success=1`);

  } catch (err) {
    console.error('[MANAGE POST] ❌ خطأ في حفظ الإعدادات:', err);
    res.redirect(
      `/manage/${guildId}?error=${encodeURIComponent(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مجدداً.')}`
    );
  }
});

// ─────────────────────────────────────────────────────────
// مسار 404 — صفحة غير موجودة
// ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send(`
    <div style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;font-family:'Arial',sans-serif;background:#0b0b12;color:#f0e6ff;
      text-align:center;padding:2rem;
    ">
      <div style="font-size:5rem;margin-bottom:1rem;">🎫</div>
      <h1 style="font-size:4rem;font-weight:900;color:#8a2be2;margin-bottom:0.5rem;">404</h1>
      <p style="font-size:1.2rem;color:#8b85a0;margin-bottom:2rem;">الصفحة التي تبحث عنها غير موجودة.</p>
      <a href="/" style="
        padding:0.8rem 2rem;background:linear-gradient(135deg,#6d28d9,#8a2be2);
        color:#fff;text-decoration:none;border-radius:0.7rem;font-size:1rem;font-weight:700;
      ">← العودة للرئيسية</a>
    </div>
  `);
});

// ===================================================
// ░░ الجزء الثالث: تشغيل كل شيء معاً ░░
// ===================================================

async function startApplication() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         🎫  DARK TICKET  STARTING        ║');
  console.log('╚══════════════════════════════════════════╝');

  try {
    // ─── 1. الاتصال بقاعدة البيانات MongoDB ───
    console.log('[DB] 🔌 جارٍ الاتصال بـ MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 ثوانٍ مهلة الاتصال
    });
    console.log('[DB] ✅ اتصال MongoDB ناجح!');

    // ─── 2. تشغيل بوت الديسكورد ───
    console.log('[BOT] 🔌 جارٍ تسجيل دخول البوت...');
    await client.login(process.env.DISCORD_TOKEN);

    // ─── 3. تشغيل خادم Express ───
    app.listen(PORT, () => {
      console.log(`[WEB] 🌐 خادم الويب يعمل على: http://localhost:${PORT}`);
      console.log('[DARK TICKET] 🚀 كل الأنظمة تعمل بنجاح!');
    });

  } catch (err) {
    console.error('[DARK TICKET] ❌ فشل تشغيل التطبيق:', err.message);
    process.exit(1);
  }
}

// ─── معالجة الأخطاء غير المتوقعة ─────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] ⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ERROR] 💥 Uncaught Exception:', err.message);
  process.exit(1);
});

// ─── معالجة إيقاف التشغيل بشكل نظيف ─────────────────
process.on('SIGINT', async () => {
  console.log('\n[DARK TICKET] 🛑 إيقاف التشغيل...');
  client.destroy();
  await mongoose.disconnect();
  console.log('[DARK TICKET] 👋 تم الإيقاف بنجاح. إلى اللقاء!');
  process.exit(0);
});

// ─── دالة مساعدة: تأخير بالـ ms ──────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── بدء التشغيل ──────────────────────────────────────
startApplication();
