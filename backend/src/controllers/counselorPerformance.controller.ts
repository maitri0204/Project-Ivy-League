import { Request, Response } from 'express';
import { getCounselorPerformance } from '../services/counselorPerformance.service';

export const getCounselorPerformanceHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // Ideally ensure user is ADMIN here, but we'll rely on route middleware or assume role check
        const metrics = await getCounselorPerformance();

        res.status(200).json({
            success: true,
            message: 'Counselor performance metrics retrieved successfully',
            data: metrics,
        });
    } catch (error: any) {
        console.error('Error fetching counselor performance:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch counselor performance',
        });
    }
};
