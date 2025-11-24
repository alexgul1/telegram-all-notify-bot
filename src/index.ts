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

// Функция для получения случайной фразы (глобальные + кастомные для чата)
function getRandomPhrase(chatId?: number): string {
  let allPhrases = [...phrases];

  // Добавляем кастомные фразы если есть chatId
  if (chatId) {
    const customPhrases = userStore.getCustomPhrases(chatId);
    allPhrases = [...allPhrases, ...customPhrases];
  }

  return allPhrases[Math.floor(Math.random() * allPhrases.length)];
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

**Основные команды:**

/cs - Позвать всех играть в CS с рандомной фразой
/register - Добавить себя в список (если не писал в чат)
/list - Посмотреть кто в списке
/phrase - Получить случайную фразу

**Кастомные фразы:**

/addphrase <текст> - Добавить свою фразу
/listphrases - Список кастомных фраз группы
/removephrase <номер> - Удалить фразу

**Как это работает:**
Бот автоматически запоминает всех, кто пишет в группе!
Когда кто-то пишет /cs, бот тегает всех из списка с прикольной фразой.
У бота 600+ встроенных фраз + ваши кастомные! 🔥

Количество людей в базе: ${userStore.getUserCount(ctx.chat?.id || 0)}
Кастомных фраз: ${userStore.getCustomPhrases(ctx.chat?.id || 0).length}
`;
  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

// Команда /help
bot.command('help', (ctx) => {
  addUserToStore(ctx);

  const helpMessage = `
📖 **Помощь по боту**

**Основные команды:**
• /cs - Тегнуть всех и позвать играть
• /register - Добавиться в список игроков
• /list - Посмотреть кто в списке
• /phrase - Случайная фраза (без тега)

**Кастомные фразы группы:**
• /addphrase <текст> - Добавить свою фразу
• /listphrases - Показать все кастомные фразы
• /removephrase <номер> - Удалить фразу по номеру

**Примеры:**
/addphrase ВАСА ПИСА КИК СОУ! Го играть!
/addphrase Бинго банго! Катка началась!

**Как это работает:**
• Бот автоматически добавляет в список всех, кто пишет в группе
• Команда /cs тегает всех из списка с прикольной фразой
• 600+ встроенных фраз + ваши кастомные для группы!
• Каждая группа имеет свой список кастомных фраз

**Советы:**
• При первом запуске попросите всех написать /register
• Права администратора боту НЕ нужны!
• Добавляйте свои внутренние шутки через /addphrase

Приятной игры! 🎯
`;
  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Команда /phrase - просто случайная фраза без тегов
bot.command('phrase', (ctx) => {
  addUserToStore(ctx);
  const phrase = getRandomPhrase(ctx.chat?.id);
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

  const phrase = getRandomPhrase(ctx.chat.id);
  const message = `🎮 ${phrase}\n\n${tags}`;

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Команда /addphrase - добавить кастомную фразу для группы
bot.command('addphrase', (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);

  // Получаем текст после команды
  const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

  if (!args) {
    ctx.reply('⚠️ Укажите фразу после команды!\nПример: /addphrase Вперед на врага!');
    return;
  }

  userStore.addCustomPhrase(ctx.chat.id, args);
  ctx.reply(`✅ Фраза добавлена: "${args}"\n\nТеперь она будет использоваться вместе с основными фразами при вызове /cs`);
});

// Команда /listphrases - показать все кастомные фразы группы
bot.command('listphrases', (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);

  const customPhrases = userStore.getCustomPhrases(ctx.chat.id);

  if (customPhrases.length === 0) {
    ctx.reply('📝 У этой группы пока нет кастомных фраз.\n\nДобавьте первую командой:\n/addphrase Ваша фраза');
    return;
  }

  const phraseList = customPhrases.map((phrase, index) => {
    return `${index + 1}. ${phrase}`;
  }).join('\n');

  ctx.reply(`📝 **Кастомные фразы группы (${customPhrases.length}):**\n\n${phraseList}\n\n_Удалить: /removephrase номер_`, { parse_mode: 'Markdown' });
});

// Команда /removephrase - удалить кастомную фразу
bot.command('removephrase', (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  addUserToStore(ctx);

  const args = ctx.message.text.split(' ').slice(1);
  const index = parseInt(args[0]);

  if (isNaN(index) || index < 1) {
    ctx.reply('⚠️ Укажите номер фразы!\nПример: /removephrase 3\n\nСписок фраз: /listphrases');
    return;
  }

  const success = userStore.removeCustomPhrase(ctx.chat.id, index - 1);

  if (success) {
    ctx.reply(`✅ Фраза #${index} удалена!`);
  } else {
    ctx.reply(`⚠️ Фраза #${index} не найдена. Проверьте список: /listphrases`);
  }
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
      const phrase = getRandomPhrase(ctx.chat?.id);
      ctx.reply(`💬 ${phrase}\n\nИспользуй /cs чтобы позвать всех!`);
    }
  }
});

// Middleware для отслеживания update_id
bot.use((ctx, next) => {
  if (ctx.update && ctx.update.update_id) {
    userStore.setLastUpdateId(ctx.update.update_id);
  }
  return next();
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`❌ Ошибка для ${ctx.updateType}:`, err);
});

// Функция для обработки пропущенных updates при запуске
async function processPendingUpdates(): Promise<number> {
  const lastUpdateId = userStore.getLastUpdateId();
  const offset = lastUpdateId ? lastUpdateId + 1 : undefined;

  console.log('🔄 Проверка пропущенных сообщений...');
  if (offset) {
    console.log(`   Последний обработанный update: ${lastUpdateId}`);
  } else {
    console.log('   Первый запуск, история не обрабатывается');
  }

  try {
    // Получаем все пропущенные updates (максимум 100 за раз)
    const updates = await bot.telegram.getUpdates(0, 100, offset || 0, undefined);

    if (updates.length === 0) {
      console.log('✅ Нет пропущенных сообщений');
      return 0;
    }

    console.log(`📥 Обработка ${updates.length} пропущенных сообщений...`);

    let addedUsers = 0;
    let processedChats = new Set<number>();

    for (const update of updates) {
      // Обрабатываем только сообщения с текстом от пользователей
      if ('message' in update && update.message && 'text' in update.message && update.message.from && !update.message.from.is_bot) {
        const chatId = update.message.chat.id;
        const user = update.message.from;

        // Добавляем пользователя
        userStore.addUser(
          chatId,
          user.id,
          user.username,
          user.first_name,
          user.last_name
        );

        processedChats.add(chatId);
        addedUsers++;
      }

      // Обновляем offset
      userStore.setLastUpdateId(update.update_id);
    }

    console.log(`✅ Добавлено пользователей: ${addedUsers} из ${processedChats.size} чата(ов)`);
    return addedUsers;
  } catch (error) {
    console.error('❌ Ошибка при обработке пропущенных сообщений:', error);
    return 0;
  }
}

// Запуск бота
console.log('🚀 Бот запускается...');

// Сначала обрабатываем пропущенные updates
processPendingUpdates()
  .then((count) => {
    if (count > 0) {
      console.log(`📊 База обновлена: +${count} пользователей`);
    }
    // Затем запускаем бота в обычном режиме
    return bot.launch();
  })
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
