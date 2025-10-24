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
dbConnection.connect((err: Error | null) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Database connected successfully');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});