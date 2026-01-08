import { Request, Response } from 'express';
import { createStudentIvyService, getStudentsForCounselor, updateStudentInterest, getStudentIvyServiceById } from '../services/ivyService.service';

export const createIvyService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, counselorId } = req.body;

    // Validate input
    if (!studentId || !counselorId) {
      res.status(400).json({
        success: false,
        message: 'studentId and counselorId are required'
      });
      return;
    }

    // Call service layer
    const newService = await createStudentIvyService(studentId, counselorId);

    // Return created document
    res.status(201).json({
      success: true,
      message: 'Ivy League service created successfully',
      data: newService,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create Ivy League service',
    });
  }
};

export const getStudentsForCounselorHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { counselorId } = req.params;

    if (!counselorId) {
      res.status(400).json({ success: false, message: 'counselorId is required' });
      return;
    }

    const students = await getStudentsForCounselor(counselorId);

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch students',
    });
  }
};

export const updateInterestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { interest } = req.body;

    if (!interest) {
      res.status(400).json({ success: false, message: 'Interest is required' });
      return;
    }

    const updatedService = await updateStudentInterest(serviceId, interest);

    res.status(200).json({
      success: true,
      data: updatedService,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update interest',
    });
  }
};

export const getServiceDetailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const service = await getStudentIvyServiceById(serviceId);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch service details',
    });
  }
};

