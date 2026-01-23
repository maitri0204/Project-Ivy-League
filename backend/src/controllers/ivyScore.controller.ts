import { Request, Response } from 'express';
import { getIvyScore, calculateIvyScore } from '../services/ivyScore.service';

/**
 * GET /api/ivy-score/:studentId
 * Get Ivy readiness score for a student
 */
export const getStudentIvyScore = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required',
            });
        }

        const scoreCard = await getIvyScore(studentId as string);

        return res.status(200).json({
            success: true,
            data: scoreCard,
        });
    } catch (error: any) {
        console.error('Error fetching Ivy score:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch Ivy score',
        });
    }
};

/**
 * POST /api/ivy-score/recalculate/:studentId
 * Manually recalculate Ivy score for a student
 */
export const recalculateIvyScore = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required',
            });
        }

        const scoreCard = await calculateIvyScore(studentId as string);

        return res.status(200).json({
            success: true,
            message: 'Score recalculated successfully',
            data: scoreCard,
        });
    } catch (error: any) {
        console.error('Error recalculating Ivy score:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to recalculate Ivy score',
        });
    }
};
