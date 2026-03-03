import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { adminRouter } from './routes/admin.routes';
import { authRouter } from './routes/auth.routes';
import { studentRouter } from './routes/student.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'su-attend', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(env.PORT, () => {
  console.log(`SU Attend API running on port ${env.PORT}`);
});
