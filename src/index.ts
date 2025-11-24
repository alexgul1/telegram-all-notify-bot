import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import { phrases } from './phrases';
import { UserStore } from './userStore';

config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в переменных окружения!');
  console.error('Создайте файл .env на основе .env.example и добавьте токен от @BotFather');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const userStore = new UserStore();

// Функция для получения случайной фразы
function getRandomPhrase(): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Функция для добавления пользователя в базу
function addUserToStore(ctx: Context): void {
  if (!ctx.from || ctx.from.is_bot || !ctx.chat) return;

  userStore.addUser(
    ctx.chat.id,
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
    ctx.from.last_name
  );
}

// Команда /start
bot.command('start', (ctx) => {
  addUserToStore(ctx);

  const welcomeMessage = `
🎮 **Бот для сбора на CS готов!**

**Доступные команды:**

/cs - Позвать всех играть в CS с рандомной фразой
/register - Добавить себя в список (если не писал в чат)
/list - Посмотреть кто в списке
/phrase - Получить случайную мотивационную фразу
/help - Показать это сообщение

**Как это работает:**
Бот автоматически запоминает всех, кто пишет в группе!
Когда кто-то пишет /cs, бот тегает всех из списка.

**Первый запуск:**
Просто попросите всех написать что-нибудь в группе или /register,
и бот запомнит их! 🔥

Количество людей в базе этого чата: ${userStore.getUserCount(ctx.chat?.id || 0)}
`;
  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

// Команда /help
bot.command('help', (ctx) => {
  addUserToStore(ctx);

  const helpMessage = `
📖 **Помощь по боту**

**Команды:**
• /cs - Тегнуть всех и позвать играть
• /register - Добавиться в список игроков
• /list - Посмотреть кто в списке
• /phrase - Случайная фраза (без тега)
• /start - Приветственное сообщение
• /help - Эта справка

**Как это работает:**
• Бот автоматически добавляет в список всех, кто пишет в группе
• Используйте /register если хотите добавиться не отправляя сообщение
• Команда /cs тегает всех из списка с прикольной фразой
• 500+ разных фраз на тематику CS и игр!

**Советы:**
• При первом запуске попросите всех написать /register
• Права администратора боту НЕ нужны!
• Бот работает в любых группах и супергруппах

Приятной игры! 🎯
`;
  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Команда /phrase - просто случайная фраза без тегов
bot.command('phrase', (ctx) => {
  addUserToStore(ctx);
  const phrase = getRandomPhrase();
  ctx.reply(`💬 ${phrase}`);
});

// Команда /register - добавить себя в список игроков
bot.command('register', (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);
  const username = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name;
  const count = userStore.getUserCount(ctx.chat.id);
  ctx.reply(`✅ ${username} добавлен в список! Всего игроков: ${count}`);
});

// Команда /list - показать всех кто в списке
bot.command('list', (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);
  const users = userStore.getUsers(ctx.chat.id);

  if (users.length === 0) {
    ctx.reply('📝 Список пока пуст! Напишите что-нибудь в чат или /register чтобы добавиться.');
    return;
  }

  const userList = users.map((user, index) => {
    const name = user.username ? `@${user.username}` : user.first_name;
    return `${index + 1}. ${name}`;
  }).join('\n');

  ctx.reply(`📝 **Список игроков (${users.length}):**\n\n${userList}`, { parse_mode: 'Markdown' });
});

// Основная команда /cs - тегаем всех и зовем играть
bot.command('cs', async (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);

  const tags = userStore.createTags(ctx.chat.id);

  if (!tags) {
    ctx.reply('⚠️ В списке еще никого нет! Попросите всех написать /register или любое сообщение в чат.');
    return;
  }

  const phrase = getRandomPhrase();
  const message = `🎮 ${phrase}\n\n${tags}`;

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Альтернативные команды (алиасы)
bot.command('го', async (ctx) => {
  addUserToStore(ctx);
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

bot.command('игра', async (ctx) => {
  addUserToStore(ctx);
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

bot.command('катка', async (ctx) => {
  addUserToStore(ctx);
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

// Обработка всех текстовых сообщений - добавляем пользователей в базу
bot.on(message('text'), async (ctx) => {
  // Добавляем пользователя в базу при любом сообщении
  addUserToStore(ctx);

  const text = ctx.message.text.toLowerCase();
  const botUsername = ctx.botInfo.username.toLowerCase();

  // Если бота упомянули и есть ключевые слова
  if (text.includes(`@${botUsername}`) || text.includes(botUsername)) {
    if (
      text.includes('го') ||
      text.includes('игра') ||
      text.includes('катка') ||
      text.includes('cs') ||
      text.includes('кс') ||
      text.includes('играть')
    ) {
      const phrase = getRandomPhrase();
      ctx.reply(`💬 ${phrase}\n\nИспользуй /cs чтобы позвать всех!`);
    }
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`❌ Ошибка для ${ctx.updateType}:`, err);
});

// Запуск бота
console.log('🚀 Бот запускается...');
bot.launch()
  .then(() => {
    console.log('✅ Бот успешно запущен!');
    console.log(`📱 Бот @${bot.botInfo?.username} готов к работе!`);
  })
  .catch((err) => {
    console.error('❌ Ошибка при запуске бота:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('⚠️  Получен сигнал SIGINT, останавливаем бота...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('⚠️  Получен сигнал SIGTERM, останавливаем бота...');
  bot.stop('SIGTERM');
});
