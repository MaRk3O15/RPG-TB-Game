// Express server — serves static files + REST API for auth and progress
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rpg-tb-game-secret-2026';
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static game files
app.use(express.static('.'));

// --- Auth middleware ---
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Не авторизований' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userName = decoded.name;
    next();
  } catch {
    res.status(401).json({ error: 'Невалідний токен' });
  }
}

// --- Routes ---

// Register new user
app.post('/api/register', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Введи ім'я та пароль" });
  if (name.length < 2) return res.status(400).json({ error: "Ім'я занадто коротке" });
  if (password.length < 4) return res.status(400).json({ error: 'Пароль мінімум 4 символи' });

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) return res.status(400).json({ error: "Це ім'я вже зайняте" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, password: hashed } });

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET);
  res.json({ token, name: user.name, progress: {} });
});

// Login
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Введи ім'я та пароль" });

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return res.status(400).json({ error: 'Користувача не знайдено' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Невірний пароль' });

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET);
  res.json({ token, name: user.name, progress: user.progress || {} });
});

// Save progress (requires auth)
app.post('/api/progress', authenticate, async (req, res) => {
  const { progress } = req.body;
  await prisma.user.update({
    where: { id: req.userId },
    data: { progress },
  });
  res.json({ ok: true });
});

// Load progress (requires auth)
app.get('/api/progress', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json({ progress: user?.progress || {} });
});

// Verify token
app.get('/api/me', authenticate, (req, res) => {
  res.json({ name: req.userName });
});

app.listen(PORT, '::', () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
