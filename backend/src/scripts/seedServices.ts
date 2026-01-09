require('dotenv').config();

import mongoose from 'mongoose';
import User from '../models/ivy/User';
import StudentIvyService from '../models/ivy/StudentIvyService';
import { USER_ROLE } from '../types/roles';
import { ServiceStatus } from '../types/ServiceStatus';

const seedServices = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all students
        const students = await User.find({ role: USER_ROLE.STUDENT });
        if (students.length === 0) {
            console.error('❌ No students found. Run seedUsers.ts first.');
            process.exit(1);
        }

        // Find all counselors
        const counselors = await User.find({ role: USER_ROLE.COUNSELOR });
        if (counselors.length === 0) {
            console.error('❌ No counselors found. Run seedUsers.ts first.');
            process.exit(1);
        }

        console.log(`Found ${students.length} students and ${counselors.length} counselors.`);

        let createdCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const counselor = counselors[i % counselors.length]; // Round-robin assignment

            // Check if service already exists
            const existing = await StudentIvyService.findOne({ studentId: student._id });
            if (existing) {
                console.log(`ℹ️  Service already exists for ${student.name}`);
                continue;
            }

            const service = await StudentIvyService.create({
                studentId: student._id,
                counselorId: counselor._id,
                status: ServiceStatus.Active,
                overallScore: 0,
                studentInterest: 'General',
            });

            console.log(`✅ Created service for ${student.name}`);
            console.log(`   - Student ID: ${student._id}`);
            console.log(`   - Service ID: ${service._id}`);
            createdCount++;
        }

        console.log(`\n✅ Seeded ${createdCount} services successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding services:', error);
        process.exit(1);
    }
};

seedServices();
