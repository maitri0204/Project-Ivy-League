import mongoose from 'mongoose';
import StudentIvyService, { IStudentIvyService } from '../models/ivy/StudentIvyService';
import User from '../models/ivy/User';
import { ServiceStatus } from '../types/ServiceStatus';

export const createStudentIvyService = async (
  studentId: string,
  counselorId: string
): Promise<IStudentIvyService> => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID format');
  }
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselor ID format');
  }

  // Validate both IDs exist
  const student = await User.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const counselor = await User.findById(counselorId);
  if (!counselor) {
    throw new Error('Counselor not found');
  }

  // Prevent duplicate Ivy service for same student
  const existingService = await StudentIvyService.findOne({ studentId });
  if (existingService) {
    throw new Error('Student already has an Ivy League service assigned');
  }

  // Create new service with default status = active
  const newService = await StudentIvyService.create({
    studentId: new mongoose.Types.ObjectId(studentId),
    counselorId: new mongoose.Types.ObjectId(counselorId),
    status: ServiceStatus.Active,
  });

  return newService;
};

export const getStudentsForCounselor = async (counselorId: string) => {
  if (!mongoose.Types.ObjectId.isValid(counselorId)) {
    throw new Error('Invalid counselor ID format');
  }

  const services = await StudentIvyService.find({ counselorId })
    .populate('studentId', 'name email')
    .sort({ createdAt: -1 });

  return services;
};

export const updateStudentInterest = async (serviceId: string, interest: string) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new Error('Invalid service ID');
  }

  const service = await StudentIvyService.findByIdAndUpdate(
    serviceId,
    { studentInterest: interest },
    { new: true }
  );

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

export const getStudentIvyServiceById = async (serviceId: string) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new Error('Invalid service ID');
  }
  return await StudentIvyService.findById(serviceId).populate('studentId', 'name email');
};

