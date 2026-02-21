// src/controllers/decision.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware'; //custom request type!
import { createDecision, getUserDecisions, CreateDecisionSchema } from '../services/decision.service';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    //Validate the incoming JSON
    const validatedData = CreateDecisionSchema.parse(req.body);
    
    //Grab the securely extracted userId from our Bouncer middleware
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: No user ID found' });
      return;
    }
    //Pass data to the Service Layer
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
    // Grab the securely extracted userId from our Bouncer
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: No user ID found' });
      return;
    }

    // Ask the Service Layer to fetch all decisions for THIS user only
    const decisions = await getUserDecisions(userId);
    
    res.status(200).json({
      message: 'Decisions retrieved successfully',
      data: decisions
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
};