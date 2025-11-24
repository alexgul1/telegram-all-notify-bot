import * as fs from 'fs';
import * as path from 'path';

interface User {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  added_at: string;
}

interface ChatUsers {
  [chatId: string]: {
    [userId: string]: User;
  };
}

interface ChatPhrases {
  [chatId: string]: string[];
}

interface StoreData {
  users: ChatUsers;
  customPhrases?: ChatPhrases; // Кастомные фразы для каждого чата
  lastUpdateId?: number; // ID последнего обработанного update
}

export class UserStore {
  private filePath: string;
  private users: ChatUsers = {};
  private customPhrases: ChatPhrases = {};
  private lastUpdateId?: number;

  constructor(filePath: string = './data/users.json') {
    this.filePath = filePath;
    this.ensureDataDir();
    this.loadUsers();
  }

  private ensureDataDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadUsers(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);

        // Поддержка старого формата (только users) и нового (users + lastUpdateId + customPhrases)
        if (parsed.users) {
          this.users = parsed.users;
          this.customPhrases = parsed.customPhrases || {};
          this.lastUpdateId = parsed.lastUpdateId;
        } else {
          // Старый формат - только users
          this.users = parsed;
          this.customPhrases = {};
          this.lastUpdateId = undefined;
        }

        const updateInfo = this.lastUpdateId ? ` (offset: ${this.lastUpdateId})` : '';
        console.log(`✅ База пользователей загружена${updateInfo}`);
      } else {
        this.users = {};
        this.customPhrases = {};
        this.lastUpdateId = undefined;
        this.saveUsers();
        console.log('✅ Создана новая база пользователей');
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке базы пользователей:', error);
      this.users = {};
      this.customPhrases = {};
      this.lastUpdateId = undefined;
    }
  }

  private saveUsers(): void {
    try {
      const data: StoreData = {
        users: this.users,
        customPhrases: this.customPhrases,
        lastUpdateId: this.lastUpdateId,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Ошибка при сохранении базы пользователей:', error);
    }
  }

  addUser(chatId: number, userId: number, username?: string, firstName?: string, lastName?: string): void {
    const chatIdStr = chatId.toString();
    const userIdStr = userId.toString();

    if (!this.users[chatIdStr]) {
      this.users[chatIdStr] = {};
    }

    // Обновляем данные пользователя (на случай если он изменил username)
    this.users[chatIdStr][userIdStr] = {
      id: userId,
      username: username,
      first_name: firstName || 'User',
      last_name: lastName,
      added_at: this.users[chatIdStr][userIdStr]?.added_at || new Date().toISOString(),
    };

    this.saveUsers();
  }

  getUsers(chatId: number): User[] {
    const chatIdStr = chatId.toString();
    if (!this.users[chatIdStr]) {
      return [];
    }
    return Object.values(this.users[chatIdStr]);
  }

  getUserCount(chatId: number): number {
    return this.getUsers(chatId).length;
  }

  removeUser(chatId: number, userId: number): boolean {
    const chatIdStr = chatId.toString();
    const userIdStr = userId.toString();

    if (this.users[chatIdStr] && this.users[chatIdStr][userIdStr]) {
      delete this.users[chatIdStr][userIdStr];
      this.saveUsers();
      return true;
    }
    return false;
  }

  clearChat(chatId: number): void {
    const chatIdStr = chatId.toString();
    delete this.users[chatIdStr];
    this.saveUsers();
  }

  createTags(chatId: number): string {
    const users = this.getUsers(chatId);

    if (users.length === 0) {
      return '';
    }

    const tags = users.map(user => {
      // Если есть username - используем @username
      if (user.username) {
        return `@${user.username}`;
      }
      // Иначе создаем mention по ID
      return `[${user.first_name}](tg://user?id=${user.id})`;
    });

    return tags.join(' ');
  }

  // Методы для работы с offset
  getLastUpdateId(): number | undefined {
    return this.lastUpdateId;
  }

  setLastUpdateId(updateId: number): void {
    this.lastUpdateId = updateId;
    this.saveUsers();
  }

  // Методы для работы с кастомными фразами
  addCustomPhrase(chatId: number, phrase: string): void {
    const chatIdStr = chatId.toString();

    if (!this.customPhrases[chatIdStr]) {
      this.customPhrases[chatIdStr] = [];
    }

    // Проверяем что такой фразы еще нет
    if (!this.customPhrases[chatIdStr].includes(phrase)) {
      this.customPhrases[chatIdStr].push(phrase);
      this.saveUsers();
    }
  }

  getCustomPhrases(chatId: number): string[] {
    const chatIdStr = chatId.toString();
    return this.customPhrases[chatIdStr] || [];
  }

  removeCustomPhrase(chatId: number, index: number): boolean {
    const chatIdStr = chatId.toString();

    if (this.customPhrases[chatIdStr] && index >= 0 && index < this.customPhrases[chatIdStr].length) {
      this.customPhrases[chatIdStr].splice(index, 1);
      this.saveUsers();
      return true;
    }
    return false;
  }

  clearCustomPhrases(chatId: number): void {
    const chatIdStr = chatId.toString();
    delete this.customPhrases[chatIdStr];
    this.saveUsers();
  }
}
