import { Request, Response } from 'express';
import { getAgentSuggestions } from '../services/agentSuggestion.service';
import { PointerNo } from '../types/PointerNo';

/**
 * GET /api/agent-suggestions
 * Get all strategically suitable agent suggestions based on student interest and pointer number
 * 
 * Query parameters:
 * - studentInterest: Required - Student's interest text
 * - pointerNo: Required - Pointer number (2, 3, or 4)
 */
export const getAgentSuggestionsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentInterest, pointerNo } = req.query;

    // Validate required parameters
    if (!studentInterest) {
      res.status(400).json({
        success: false,
        message: 'studentInterest is required',
      });
      return;
    }

    if (!pointerNo) {
      res.status(400).json({
        success: false,
        message: 'pointerNo is required (2, 3, or 4)',
      });
      return;
    }

    // Validate and convert pointerNo
    const pointerNum = parseInt(pointerNo as string, 10);
    if (
      pointerNum !== PointerNo.SpikeInOneArea &&
      pointerNum !== PointerNo.LeadershipInitiative &&
      pointerNum !== PointerNo.GlobalSocialImpact
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid pointerNo. Must be 2, 3, or 4',
      });
      return;
    }

    // Validate studentInterest
    if (typeof studentInterest !== 'string' || studentInterest.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'studentInterest must be a non-empty string',
      });
      return;
    }

    // Get all suitable suggestions (no ranking, no scores)
    const suggestions = await getAgentSuggestions(
      studentInterest as string,
      pointerNum as PointerNo.SpikeInOneArea | PointerNo.LeadershipInitiative | PointerNo.GlobalSocialImpact
    );

    // Format response as pure JSON array
    const activities = suggestions.map((activity) => ({
      _id: activity._id,
      title: activity.title,
      description: activity.description,
      tags: activity.tags,
      pointerNo: activity.pointerNo,
    }));

    // Return pure JSON array of activities
    res.status(200).json(activities);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get agent suggestions',
    });
  }
};
