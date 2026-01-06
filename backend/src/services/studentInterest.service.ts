import StudentIvyService, { IStudentIvyService } from '../models/ivy/StudentIvyService';

export const getStudentInterest = async (
  studentIvyServiceId: string
): Promise<IStudentIvyService> => {
  const service = await StudentIvyService.findById(studentIvyServiceId);

  if (!service) {
    throw new Error('Student Ivy Service not found');
  }

  return service;
};

/**
 * Update student interest - stores as plain text with overwrite allowed
 * No validation logic applied to studentInterest content
 */
export const updateStudentInterest = async (
  studentIvyServiceId: string,
  studentInterest: string
): Promise<IStudentIvyService> => {
  // Direct update - no validation, overwrite allowed
  const updatedService = await StudentIvyService.findByIdAndUpdate(
    studentIvyServiceId,
    { studentInterest },
    { new: true, runValidators: false }
  );

  if (!updatedService) {
    throw new Error('Student Ivy Service not found');
  }

  return updatedService;
};

