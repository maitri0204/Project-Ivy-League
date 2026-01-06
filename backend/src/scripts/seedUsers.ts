require('dotenv').config();

import mongoose from 'mongoose';
import User from '../models/ivy/User';
import { USER_ROLE } from '../types/roles';

const seedUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`ℹ️  Database already has ${existingUsers} users. Skipping seed.`);
      console.log('💡 To re-seed, delete all users first.');
      process.exit(0);
    }

    // Create test students
    const students = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john.student@example.com',
        password: 'password123', // In production, this should be hashed
        role: USER_ROLE.STUDENT,
        isVerified: true,
      },
      {
        name: 'Jane Smith',
        email: 'jane.student@example.com',
        password: 'password123',
        role: USER_ROLE.STUDENT,
        isVerified: true,
      },
      {
        name: 'Bob Johnson',
        email: 'bob.student@example.com',
        password: 'password123',
        role: USER_ROLE.STUDENT,
        isVerified: true,
      },
    ]);

    // Create test counselors
    const counselors = await User.insertMany([
      {
        name: 'Dr. Sarah Wilson',
        email: 'wilson.counselor@example.com',
        password: 'password123',
        role: USER_ROLE.COUNSELOR,
        isVerified: true,
      },
      {
        name: 'Dr. Michael Brown',
        email: 'brown.counselor@example.com',
        password: 'password123',
        role: USER_ROLE.COUNSELOR,
        isVerified: true,
      },
      {
        name: 'Dr. Emily Davis',
        email: 'davis.counselor@example.com',
        password: 'password123',
        role: USER_ROLE.COUNSELOR,
        isVerified: true,
      },
    ]);

    console.log('✅ Seeded test users successfully!');
    console.log(`   - ${students.length} students created`);
    console.log(`   - ${counselors.length} counselors created`);
    console.log('\n📋 Test Users Created:');
    console.log('\nStudents:');
    students.forEach((s) => console.log(`   - ${s.name} (${s.email})`));
    console.log('\nCounselors:');
    counselors.forEach((c) => console.log(`   - ${c.name} (${c.email})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
