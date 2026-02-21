import { prisma } from '../utils/db';
import { z } from 'zod';

// We only need a title to start a decision. The user ID will come from the JWT token.
export const CreateDecisionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
});

//create a Decision
export const createDecision = async (title: string, userId: string) => {
  const newDecision = await prisma.decision.create({
    data: {
      title,
      userId, // We link the decision directly to the user who created it
    },
  });

  return newDecision;
};

//Get All Decisions for a User
export const getUserDecisions = async (userId: string) => {
  const decisions = await prisma.decision.findMany({
    where: { 
      userId: userId // Only fetch decisions belonging to this specific user
    },
    orderBy: { 
      createdAt: 'desc' // Show the newest decisions first
    },
  });

  return decisions;
};