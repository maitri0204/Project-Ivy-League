import { Request, Response } from 'express';
import { createStudentIvyService } from '../services/ivyService.service';

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

