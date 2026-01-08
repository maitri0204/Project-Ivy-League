import mongoose from 'mongoose';
import User from '../models/ivy/User';
import StudentIvyService from '../models/ivy/StudentIvyService';
import StudentIvyScoreCard from '../models/ivy/StudentIvyScoreCard';
import StudentSubmission from '../models/ivy/StudentSubmission';
import CounselorEvaluation from '../models/ivy/CounselorEvaluation';
import EssaySubmission from '../models/ivy/EssaySubmission';
import EssayEvaluation from '../models/ivy/EssayEvaluation';
import Pointer6Evaluation from '../models/ivy/Pointer6Evaluation';
import { USER_ROLE } from '../types/roles';

export interface CounselorMetrics {
    counselorId: string;
    counselorName: string;
    email: string;
    studentsHandled: number;
    averageStudentScore: number;
    taskCompletionRate: number; // Percentage (0-100)
}

export const getCounselorPerformance = async (): Promise<CounselorMetrics[]> => {
    // 1. Get all counselors
    const counselors = await User.find({ role: USER_ROLE.COUNSELOR });

    const metrics: CounselorMetrics[] = [];

    for (const counselor of counselors) {
        // 2. Get students handled
        const services = await StudentIvyService.find({ counselorId: counselor._id });
        const studentsHandled = services.length;
        const serviceIds = services.map(s => s._id);

        if (studentsHandled === 0) {
            metrics.push({
                counselorId: counselor._id.toString(),
                counselorName: counselor.name,
                email: counselor.email,
                studentsHandled: 0,
                averageStudentScore: 0,
                taskCompletionRate: 0,
            });
            continue;
        }

        // 3. Average Student Score
        const scoreCards = await StudentIvyScoreCard.find({
            studentIvyServiceId: { $in: serviceIds },
        });

        let totalScore = 0;
        if (scoreCards.length > 0) {
            totalScore = scoreCards.reduce((sum, card) => sum + card.overallScore, 0);
        }
        const averageStudentScore = scoreCards.length > 0 ? (totalScore / scoreCards.length) : 0;

        // 4. Task Completion Rate
        // Metric: (Completed Evaluations / Total Submissions) * 100
        // We check Generic Pointers (Activities) + Essay + Pointer 6

        // A. Generic Activities (Pointers 2-4)
        // Find all submissions for this counselor's students
        const studentSubmissions = await StudentSubmission.find({
            studentIvyServiceId: { $in: serviceIds }
        });
        const subIds = studentSubmissions.map(s => s._id);
        const activityEvaluations = await CounselorEvaluation.find({
            studentSubmissionId: { $in: subIds }
        });

        // B. Essay (Pointer 5)
        // Find all essay submissions for this counselor's students
        // Note: EssaySubmission doesn't strictly have a direct 'evaluated' flag, we check EssayEvaluation
        const essaySubmissions = await EssaySubmission.find({
            studentIvyServiceId: { $in: serviceIds }
        });
        const essaySubIds = essaySubmissions.map(s => s._id);
        const essayEvaluations = await EssayEvaluation.find({
            essaySubmissionId: { $in: essaySubIds }
        });

        // C. Pointer 6 (Curiosity) doesn't have "submissions" in the same way (course list + certs).
        // Usually P6 is evaluated once per student.
        // Let's stick to Activity + Essay for "Task Completion Rate" as they are the bulk of work.

        const totalSubmissions = studentSubmissions.length + essaySubmissions.length;
        const totalEvaluations = activityEvaluations.length + essayEvaluations.length;

        let taskCompletionRate = 0;
        if (totalSubmissions > 0) {
            taskCompletionRate = (totalEvaluations / totalSubmissions) * 100;
            // Cap at 100 just in case (though math shouldn't allow >100 unless data inconsistency)
            taskCompletionRate = Math.min(100, taskCompletionRate);
        } else {
            // If no submissions, assume 100% (nothing pending) or 0%?
            // "N/A" is better, but defaulting to 100 (kept up to date) or 0.
            // If they have students but no submissions, they might be waiting. Let's say 100% "up to date".
            // Actually, standard is usually 0 if no data, or ignore.
            // Let's use 0 ensures they get attention if they have students but no activity.
            // But if students haven't submitted, it's not counselor fault.
            // Let's calculate rate ONLY if there are submissions.
            taskCompletionRate = totalSubmissions > 0 ? (totalEvaluations / totalSubmissions) * 100 : 0;
        }

        metrics.push({
            counselorId: counselor._id.toString(),
            counselorName: counselor.name,
            email: counselor.email,
            studentsHandled,
            averageStudentScore,
            taskCompletionRate,
        });
    }

    return metrics;
};
