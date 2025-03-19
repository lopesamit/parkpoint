import fs from 'fs';
import path from 'path';
import { compare, hash } from 'bcrypt';

const USERS_FILE_PATH = path.join(process.cwd(), 'app/data/users.json');

interface User {
  id: string;
  username: string;
  password: string;
}

export async function getUsers(): Promise<User[]> {
  if (!fs.existsSync(USERS_FILE_PATH)) {
    fs.writeFileSync(USERS_FILE_PATH, '[]');
    return [];
  }
  const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
  return JSON.parse(data);
}

export async function saveUsers(users: User[]): Promise<void> {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
}

export async function createUser(username: string, password: string): Promise<User | null> {
  const users = await getUsers();
  
  // Check if user already exists
  if (users.some(user => user.username === username)) {
    return null;
  }

  const hashedPassword = await hash(password, 10);
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    password: hashedPassword,
  };

  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  const users = await getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return null;
  }

  const isValid = await compare(password, user.password);
  return isValid ? user : null;
} 