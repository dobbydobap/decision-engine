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
    include: {
      options: true,
      criteria: true,
    }
  });
  return decisions;
};

//get a single decision with all its inner details 
export const getDecisionById = async (decisionId: string, userId: string) => {
  const decision = await prisma.decision.findFirst({
    where: { 
      id: decisionId,
      userId: userId, //Security check: Ensure the user actually owns this decision
    },
    include: {
      options: {
        include: {
          scores: true, //fetchs the scores attached to each option
        }
      },
      criteria: true,
    }
  });

  if (!decision) {
    throw new Error('Decision not found or unauthorized');
  }

  return decision;
};

//calculation engine 
export const evaluateDecision = async (decisionId: string, userId: string) => {
  //grab the fully populated decision
  const decision = await getDecisionById(decisionId, userId);

  //create a map of Criteria IDs to their Weights so we can look them up quickly
  const criteriaWeights: Record<string, number> = {};
  decision.criteria.forEach(c => {
    criteriaWeights[c.id] = c.weight;
  });

  //calculate the final score for each option
  const evaluatedOptions = decision.options.map(option => {
    let totalScore = 0;
    const scoreBreakdown: any[] = [];

    //Go through every score this option has
    option.scores.forEach(score => {
      //Find the weight of the criterion this score belongs to
      const weight = criteriaWeights[score.criterionId];
      
      // If the criterion exists, do the math!
      if (weight) {
        const weightedScore = score.value * weight;
        totalScore += weightedScore;

        //Keeping a record of the math for the frontend to display
        scoreBreakdown.push({
          criterionId: score.criterionId,
          originalValue: score.value,
          weightApplied: weight,
          calculatedPoints: weightedScore
        });
      }
    });
    return {
      id: option.id,
      name: option.name,
      totalScore: totalScore,
      breakdown: scoreBreakdown
    };
  });

  //sorting the options from highest score to lowest score
  evaluatedOptions.sort((a, b) => b.totalScore - a.totalScore);

  return {
    decisionId: decision.id,
    title: decision.title,
    winner: evaluatedOptions.length > 0 ? evaluatedOptions[0] : null,
    rankings: evaluatedOptions
  };
};

//delete a decision securily 
export const deleteDecision = async (decisionId: string, userId: string) => {
  //we reuse our existing function to ensure the user actually owns this decision...
  await getDecisionById(decisionId, userId);
  await prisma.decision.delete({
    where: { id: decisionId },
  });

  return true;
};