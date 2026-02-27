import express from 'express';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.routes.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Routes
app.use('/api', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Wrapper API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
