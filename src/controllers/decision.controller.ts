import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createDecision, getUserDecisions, getDecisionById, CreateDecisionSchema, evaluateDecision, deleteDecision } from '../services/decision.service';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = CreateDecisionSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: No user ID found' });
      return;
    }

    const newDecision = await createDecision(validatedData.title, userId);
    
    res.status(201).json({
      message: 'Decision created successfully',
      data: newDecision
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decisions = await getUserDecisions(userId);
    
    res.status(200).json({
      message: 'Decisions retrieved successfully',
      data: decisions
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
};

//get a single decision by its ID
export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const decisionId = req.params.id as string; // Assuming the route is something like /api/decisions/:id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Pass both IDs to the service to ensure the user actually owns this decision
    const decision = await getDecisionById(decisionId, userId);
    
    res.status(200).json({
      message: 'Decision retrieved successfully',
      data: decision
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
//calculation engine on a specific decision
export const evaluate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const decisionId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Call the Engine!
    const results = await evaluateDecision(decisionId, userId);
    
    res.status(200).json({
      message: 'Decision evaluated successfully',
      data: results
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

//handles the HTTP request to delete a decision
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const decisionId = req.params.id as string;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await deleteDecision(decisionId, userId);
    res.status(200).json({
      message: 'Decision and all associated data deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};