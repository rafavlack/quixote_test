import express from 'express';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Wrapper API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
