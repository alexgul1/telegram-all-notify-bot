# 🎮 Telegram CS Tagging Bot

Телеграм бот для сбора команды на Counter-Strike! Тегает всех участников группы с прикольными фразами на игровую тематику.

## 🌟 Возможности

- 🎯 Тегает всех участников группы по команде `/cs`
- 💬 500+ прикольных фраз на тематику CS и игр
- 🎲 Случайный выбор фразы при каждом вызове
- 📝 Автоматически запоминает всех кто пишет в группе
- 🔄 Обрабатывает пропущенные сообщения при перезапуске
- 💾 Сохраняет offset - не теряет пользователей при downtime
- 👥 Не требует прав администратора!
- 💾 Надежное хранение в JSON
- 🤖 Простая настройка через @BotFather
- 🚀 Готов к деплою с PM2

## 📋 Требования

- Node.js 18+
- npm или yarn
- PM2 (для продакшен режима)
- Telegram Bot Token от [@BotFather](https://t.me/BotFather)

## 🛠 Установка

### 1. Клонируйте репозиторий и установите зависимости

```bash
npm install
```

### 2. Создайте бота в Telegram

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям (придумайте имя и username)
4. Скопируйте полученный токен

### 3. Настройте переменные окружения

```bash
cp .env.example .env
```

Откройте `.env` и добавьте ваш токен:

```env
BOT_TOKEN=ваш_токен_от_BotFather
```

### 4. Соберите проект

```bash
npm run build
```

## 🚀 Запуск

### Режим разработки

```bash
npm run dev
```

### Продакшен (с PM2)

```bash
# Первый запуск
pm2 start ecosystem.config.js

# Проверка статуса
pm2 status

# Логи
pm2 logs telegram-cs-bot

# Перезапуск
pm2 restart telegram-cs-bot

# Остановка
pm2 stop telegram-cs-bot

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

## 🖥️ VPS Deployment

To keep the bot running 24/7 you need a server. Here are the best options:

### Choosing a Server

#### 🆓 Free Options (Always Free)

| Provider | Specs | Cost |
|----------|-------|------|
| [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) | 1 GB RAM, 1 vCPU (AMD) | **Free forever** |
| [Google Cloud](https://cloud.google.com/free) | 1 GB RAM, 0.25 vCPU (e2-micro) | **Free forever** |

> **Recommended: Oracle Cloud** — more resources, better performance for bots. A credit card is required to sign up but you will **not** be charged.

#### 💰 Cheap Paid Options (~$3–5/mo)

| Provider | Specs | Cost |
|----------|-------|------|
| [Hetzner Cloud](https://www.hetzner.com/cloud) | 2 GB RAM, 1 vCPU, 20 GB SSD | ~€3.5/mo |
| [Contabo](https://contabo.com/) | 8 GB RAM, 4 vCPU, 50 GB SSD | ~€5/mo |
| [Vultr](https://www.vultr.com/) | 512 MB RAM, 1 vCPU, 10 GB SSD | ~$2.5/mo |
| [DigitalOcean](https://www.digitalocean.com/) | 512 MB RAM, 1 vCPU, 10 GB SSD | ~$4/mo |

> **Recommended: Hetzner** — best price/performance in Europe. Servers in Germany, Finland, and the US.

---

### Step-by-step guides for free providers

- [Oracle Cloud Free Tier — full guide](docs/deploy-oracle-cloud.md)
- [Google Cloud Free Tier — full guide](docs/deploy-google-cloud.md)

---

### General Deployment (Ubuntu 22.04)

#### 1. Create a server

In your provider's control panel:
1. Create a new server / droplet / instance
2. Choose **Ubuntu 22.04 LTS** as the OS
3. Minimum specs: 512 MB RAM, 1 vCPU
4. Note the assigned **IP address**

#### 2. Connect via SSH

**Windows** (PowerShell or [PuTTY](https://www.putty.org/)):
```bash
ssh root@YOUR_SERVER_IP
```

**Mac / Linux** (Terminal):
```bash
ssh root@YOUR_SERVER_IP
```

#### 3. Update the system

```bash
apt update && apt upgrade -y
```

#### 4. Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version  # should print v18.x.x or higher
```

#### 5. Install PM2

```bash
npm install -g pm2
```

#### 6. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/telegram-all-notify-bot.git
cd telegram-all-notify-bot
```

#### 7. Install dependencies and build

```bash
npm install
npm run build
```

#### 8. Create the .env file

```bash
cp .env.example .env
nano .env
```

Paste your token:

```env
BOT_TOKEN=your_token_from_BotFather
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

#### 9. Start the bot

```bash
pm2 start ecosystem.config.js
pm2 status              # status should be "online"
pm2 logs telegram-cs-bot  # verify the logs
```

#### 10. Enable auto-start on server reboot

```bash
pm2 startup
# Copy and run the command PM2 prints (starts with "sudo env ...")
pm2 save
```

---

### Updating the bot

```bash
cd ~/telegram-all-notify-bot
git pull
npm run build
pm2 restart telegram-cs-bot
```

---

### Basic server hardening

Create a dedicated user instead of running as root:

```bash
adduser botuser
usermod -aG sudo botuser
su - botuser
```

Enable the firewall (allow SSH only):

```bash
ufw allow ssh
ufw enable
```

---

## 📱 Использование

### 1. Добавьте бота в группу

1. Откройте вашу группу в Telegram
2. Нажмите на название группы → "Добавить участников"
3. Найдите вашего бота и добавьте его

### 2. Зарегистрируйте всех участников

**Бот автоматически запоминает всех кто пишет в группе!**

Два способа добавиться:
- Просто написать любое сообщение в чат
- Отправить команду `/register`

Попросите всех участников написать `/register` чтобы добавиться в список!

### 3. Используйте команды

- `/cs` - Тегнуть всех и позвать играть (основная команда!)
- `/register` - Добавить себя в список игроков
- `/list` - Посмотреть всех кто в списке
- `/phrase` - Получить случайную фразу без тегов
- `/start` - Приветственное сообщение
- `/help` - Справка по командам

**Примечание:** Права администратора боту НЕ нужны! Он работает в обычном режиме.

## 💡 Примеры использования

```
Пользователь: /cs

Бот: 🎮 RUSH B NO STOP CYKA BLYAT!!!

@user1 @user2 @user3 @user4 @user5...
```

## 🎭 Фразы

В боте более 500 разнообразных фраз:
- Классические мемы CS
- Олдскульные референсы
- Мотивационные призывы
- Агрессивные (но шуточные) фразы
- Рофельные и хайповые выражения
- CS:GO специфика
- И многое другое!

Фразы хранятся в `src/phrases.ts` и их можно легко редактировать или добавлять новые.

## 📁 Структура проекта

```
telegram-all-notify-bot/
├── src/
│   ├── index.ts          # Основной файл бота
│   ├── phrases.ts        # База фраз (500+)
│   └── userStore.ts      # Управление базой пользователей
├── data/                 # База пользователей (создается автоматически)
│   └── users.json        # JSON с данными пользователей
├── dist/                 # Скомпилированный код (после build)
├── logs/                 # Логи PM2 (создается автоматически)
├── .env                  # Переменные окружения (создать вручную)
├── .env.example          # Пример конфигурации
├── ecosystem.config.js   # Конфигурация PM2
├── package.json          # Зависимости проекта
├── tsconfig.json         # Настройки TypeScript
└── README.md            # Этот файл
```

## 🔧 Настройка PM2

PM2 автоматически:
- Перезапускает бота при сбоях
- Ротирует логи
- Позволяет запустить бота при старте системы
- Контролирует использование памяти

Логи сохраняются в папке `logs/`:
- `err.log` - ошибки
- `out.log` - обычный вывод
- `combined.log` - все логи вместе

## ⚙️ Дополнительные команды npm

```bash
npm run build    # Компиляция TypeScript в JavaScript
npm run dev      # Запуск в режиме разработки
npm run start    # Запуск скомпилированного кода
npm run watch    # Автокомпиляция при изменениях
```

## 💾 Как работает хранение пользователей

Бот использует простую JSON базу данных с умной системой синхронизации:

**Основные возможности:**
- Автоматически создается папка `data/` при первом запуске
- Файл `data/users.json` содержит всех пользователей всех чатов
- Данные обновляются при каждом сообщении пользователя
- Сохраняется: ID, username, имя, фамилия, дата добавления
- Каждый чат имеет свой список пользователей
- База не теряется при перезапуске бота

**Автоматическая обработка пропущенных сообщений:**
- Бот сохраняет offset (ID последнего обработанного сообщения)
- При перезапуске автоматически получает все сообщения что пришли пока он был выключен
- Обрабатывает до 100 пропущенных сообщений за раз
- Добавляет новых пользователей из пропущенных сообщений
- Telegram хранит updates до 24 часов

**Это значит:**
- Если бот был выключен несколько часов - он не пропустит новых участников!
- Все кто писал пока бот был offline, будут добавлены при следующем запуске
- Не нужно просить всех заново регистрироваться после перезапуска

**Важно:** Папка `data/` добавлена в `.gitignore` и не коммитится в репозиторий!

## 🐛 Решение проблем

### Бот не тегает всех участников

**Причина:** Участники еще не добавлены в базу бота.

**Решение:**
1. Попросите всех написать `/register` в группе
2. Или просто попросите всех написать любое сообщение
3. Проверьте список командой `/list`
4. Бот запоминает всех автоматически при первом сообщении

### Бот не отвечает

**Проверьте:**
1. Правильность токена в `.env`
2. Запущен ли процесс: `pm2 status`
3. Логи: `pm2 logs telegram-cs-bot`
4. Есть ли интернет подключение на сервере

### Ошибка "BOT_TOKEN не найден"

Убедитесь что:
1. Файл `.env` создан (не `.env.example`)
2. В `.env` есть строка `BOT_TOKEN=ваш_токен`
3. Нет пробелов вокруг знака `=`

## 📝 Добавление своих фраз

Откройте `src/phrases.ts` и добавьте свои фразы в массив `phrases`:

```typescript
export const phrases = [
  "Ваша новая фраза!",
  "Еще одна крутая фраза!",
  // ... остальные фразы
];
```

После изменений пересоберите и перезапустите:

```bash
npm run build
pm2 restart telegram-cs-bot
```

## 🤝 Вклад в проект

Нашли баг или хотите добавить фичу? Создавайте issue или pull request!

## 📄 Лицензия

MIT

## 🎮 Приятной игры!

Удачных каток и побед! 🏆
