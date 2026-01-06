import { Router } from 'express';
import { getAgentSuggestionsHandler } from '../controllers/agentSuggestion.controller';

const router = Router();

// GET /api/agent-suggestions?studentIvyServiceId=xxx&pointerNo=2&limit=10
// Get ranked agent suggestions based on student interest
router.get('/', getAgentSuggestionsHandler);

export default router;

