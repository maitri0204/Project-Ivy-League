import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import ivyServiceRoutes from './routes/ivyService.routes';
import userRoutes from './routes/user.routes';
import excelUploadRoutes from './routes/excelUpload.routes';
import studentInterestRoutes from './routes/studentInterest.routes';
import agentSuggestionRoutes from './routes/agentSuggestion.routes';
import pointer5Routes from './routes/pointer5.routes';
import pointer6Routes from './routes/pointer6.routes';
<<<<<<< HEAD
import pointerActivityRoutes from './routes/pointerActivity.routes';
=======
import pointer234ActivityRoutes from './routes/pointer234Activity.routes';
>>>>>>> b2960f9b4d97283f403a2bc5fd6f3cf5c65d2e9e

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic test route
app.get('/', (_req: Request, res: Response) => {
  res.send('API is running!');
});

// Routes
app.use('/api/ivy-service', ivyServiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/excel-upload', excelUploadRoutes);
app.use('/api/student-interest', studentInterestRoutes);
app.use('/api/agent-suggestions', agentSuggestionRoutes);
app.use('/api/pointer5', pointer5Routes);
app.use('/api/pointer6', pointer6Routes);
<<<<<<< HEAD
app.use('/api/pointer/activity', pointerActivityRoutes);
=======
app.use('/api/pointer', pointer234ActivityRoutes);
>>>>>>> b2960f9b4d97283f403a2bc5fd6f3cf5c65d2e9e

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // These options work well for both local and Atlas MongoDB
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();