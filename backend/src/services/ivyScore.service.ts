import StudentPointerScore from '../models/ivy/StudentPointerScore';
import StudentIvyScoreCard from '../models/ivy/StudentIvyScoreCard';
import StudentIvyService from '../models/ivy/StudentIvyService';
import { PointerNo } from '../types/PointerNo';

/**
 * Calculate and aggregate scores for a student
 * Each pointer: 0-10 scale
 * Total: Sum of all 6 pointers (max 60)
 */
export const calculateIvyScore = async (studentId: string) => {
    try {
        // Find the student's ivy service record
        const studentService = await StudentIvyService.findOne({ studentId });

        if (!studentService) {
            throw new Error('Student not enrolled in Ivy service');
        }

        // Get all pointer scores for this student
        const pointerScores = await StudentPointerScore.find({
            studentIvyServiceId: studentService._id,
        });

        // Initialize all 6 pointers with 0 score and max 10
        const allPointers = [
            PointerNo.AcademicExcellence,
            PointerNo.SpikeInOneArea,
            PointerNo.LeadershipInitiative,
            PointerNo.GlobalSocialImpact,
            PointerNo.AuthenticStorytelling,
            PointerNo.IntellectualCuriosity,
        ];

        const scoreMap = new Map<PointerNo, { score: number; maxScore: number }>();

        // Initialize all pointers with 0
        allPointers.forEach(pointer => {
            scoreMap.set(pointer, { score: 0, maxScore: 10 });
        });

        // Update with actual scores
        pointerScores.forEach(ps => {
            // Normalize score to 0-10 scale
            const normalizedScore = (ps.scoreObtained / ps.maxScore) * 10;
            scoreMap.set(ps.pointerNo, {
                score: Math.min(10, Math.max(0, normalizedScore)), // Clamp between 0-10
                maxScore: 10,
            });
        });

        // Build pointer scores array
        const formattedScores = allPointers.map(pointer => {
            const scoreData = scoreMap.get(pointer)!;
            return {
                pointerNo: pointer,
                score: Math.round(scoreData.score * 100) / 100, // Round to 2 decimals
                maxScore: scoreData.maxScore,
            };
        });

        // Calculate total score (sum of all 6 pointers)
        const totalScore = formattedScores.reduce((sum, ps) => sum + ps.score, 0);

        // Update or create scorecard
        const scoreCard = await StudentIvyScoreCard.findOneAndUpdate(
            { studentIvyServiceId: studentService._id },
            {
                studentIvyServiceId: studentService._id,
                pointerScores: formattedScores,
                overallScore: Math.round(totalScore * 100) / 100, // Round to 2 decimals
                generatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        // SYNC: Update the main service record with the overall score
        await StudentIvyService.findByIdAndUpdate(studentService._id, {
            overallScore: Math.round(totalScore * 100) / 100,
            updatedAt: new Date()
        });

        return scoreCard;
    } catch (error) {
        console.error('Error calculating Ivy score:', error);
        throw error;
    }
};

/**
 * Get Ivy score for a student
 */
export const getIvyScore = async (studentId: string) => {
    try {
        // Find the student's ivy service record
        const studentService = await StudentIvyService.findOne({ studentId });

        if (!studentService) {
            throw new Error('Student not enrolled in Ivy service');
        }

        // Try to get existing scorecard
        let scoreCard = await StudentIvyScoreCard.findOne({
            studentIvyServiceId: studentService._id,
        }).populate('studentIvyServiceId');

        // If no scorecard exists, calculate it
        if (!scoreCard) {
            scoreCard = await calculateIvyScore(studentId);
        }

        return scoreCard;
    } catch (error) {
        console.error('Error getting Ivy score:', error);
        throw error;
    }
};

/**
 * Update score after evaluation submission
 * This should be called whenever a pointer evaluation is submitted
 */
export const updateScoreAfterEvaluation = async (
    studentIvyServiceId: string,
    pointerNo: PointerNo,
    scoreObtained: number,
    maxScore: number = 10
) => {
    try {
        // Update or create the pointer score
        await StudentPointerScore.findOneAndUpdate(
            { studentIvyServiceId, pointerNo },
            {
                studentIvyServiceId,
                pointerNo,
                scoreObtained,
                maxScore,
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        // Get student ID from service
        const studentService = await StudentIvyService.findById(studentIvyServiceId);
        if (!studentService) {
            throw new Error('Student service not found');
        }

        // Recalculate total score
        await calculateIvyScore(studentService.studentId.toString());

        return { success: true, message: 'Score updated successfully' };
    } catch (error) {
        console.error('Error updating score after evaluation:', error);
        throw error;
    }
};
