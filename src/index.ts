import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import { phrases } from './phrases';

config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в переменных окружения!');
  console.error('Создайте файл .env на основе .env.example и добавьте токен от @BotFather');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Функция для получения случайной фразы
function getRandomPhrase(): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Функция для получения всех участников чата и создания тегов
async function tagAllMembers(ctx: Context): Promise<string> {
  if (!ctx.chat || ctx.chat.type === 'private') {
    return '⚠️ Эта команда работает только в группах!';
  }

  try {
    const chatId = ctx.chat.id;
    const administrators = await ctx.telegram.getChatAdministrators(chatId);

    // Получаем количество участников
    const chatMembersCount = await ctx.telegram.getChatMembersCount(chatId);

    // Создаем теги для всех администраторов (а в них обычно входят и обычные участники если группа небольшая)
    const tags: string[] = [];

    for (const admin of administrators) {
      const user = admin.user;
      if (!user.is_bot) {
        // Используем username если есть, иначе first_name
        if (user.username) {
          tags.push(`@${user.username}`);
        } else {
          // Для пользователей без username создаем текстовое упоминание
          tags.push(`[${user.first_name}](tg://user?id=${user.id})`);
        }
      }
    }

    // Если нашли мало людей, добавляем невидимые упоминания для всех
    // (это обойдет ограничение API, но не получится тегнуть всех поименно)
    if (tags.length < 5 && chatMembersCount > 10) {
      return `⚠️ В больших группах Telegram ограничивает получение списка всех участников.\n\nНайдено участников для тега: ${tags.length}\n\nВы можете:\n1. Дать боту права администратора (тогда он увидит больше участников)\n2. Использовать команду всё равно для тега найденных участников\n3. Добавить участников вручную через reply на их сообщения\n\nТеги найденных: ${tags.join(' ')}`;
    }

    return tags.join(' ');
  } catch (error) {
    console.error('Ошибка при получении участников:', error);
    return '⚠️ Не удалось получить список участников. Убедитесь что бот является администратором группы!';
  }
}

// Команда /start
bot.command('start', (ctx) => {
  const welcomeMessage = `
🎮 **Бот для сбора на CS готов!**

**Доступные команды:**

/cs - Позвать всех играть в CS с рандомной фразой
/phrase - Получить случайную мотивационную фразу
/help - Показать это сообщение

**Как использовать:**
1. Добавьте бота в группу
2. Дайте боту права администратора (чтобы он мог видеть участников)
3. Используйте команду /cs когда хотите собрать команду!

Бот будет тегать всех участников группы с прикольной фразой про CS! 🔥
`;
  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

// Команда /help
bot.command('help', (ctx) => {
  const helpMessage = `
📖 **Помощь по боту**

**Команды:**
• /cs - Тегнуть всех и позвать играть
• /phrase - Случайная фраза (без тега)
• /start - Приветственное сообщение
• /help - Эта справка

**Советы:**
• Бот работает только в группах
• Для лучшей работы дайте боту права администратора
• Фразы выбираются случайно из 500+ вариантов
• Можно использовать в любых чатах где есть бот

**Проблемы?**
Если бот не тегает всех участников - убедитесь что он администратор группы.

Приятной игры! 🎯
`;
  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Команда /phrase - просто случайная фраза без тегов
bot.command('phrase', (ctx) => {
  const phrase = getRandomPhrase();
  ctx.reply(`💬 ${phrase}`);
});

// Основная команда /cs - тегаем всех и зовем играть
bot.command('cs', async (ctx) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.reply('⚠️ Эта команда работает только в группах!');
    return;
  }

  const phrase = getRandomPhrase();
  const tags = await tagAllMembers(ctx);

  // Проверяем, является ли результат сообщением об ошибке
  if (tags.startsWith('⚠️')) {
    ctx.reply(tags, { parse_mode: 'Markdown' });
    return;
  }

  const message = `🎮 ${phrase}\n\n${tags}`;

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Альтернативные команды (алиасы)
bot.command('го', async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

bot.command('игра', async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

bot.command('катка', async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat!.id, '⚡ Используй /cs чтобы позвать всех!');
});

// Обработка упоминаний бота в сообщениях
bot.on(message('text'), async (ctx) => {
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
