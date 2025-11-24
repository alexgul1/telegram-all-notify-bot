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

export class UserStore {
  private filePath: string;
  private users: ChatUsers = {};

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
        this.users = JSON.parse(data);
        console.log('✅ База пользователей загружена');
      } else {
        this.users = {};
        this.saveUsers();
        console.log('✅ Создана новая база пользователей');
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке базы пользователей:', error);
      this.users = {};
    }
  }

  private saveUsers(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.users, null, 2), 'utf-8');
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
}
