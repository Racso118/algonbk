import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import ApointRoutes from './routes/apoint.routes';
import { dbConnection } from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apoints', ApointRoutes);

// Database connection
(async () => {
  try {
    await dbConnection.query('SELECT 1'); // verifies pool can query the DB
    console.log('Database connected successfully');
  } catch (err: any) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
})();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});