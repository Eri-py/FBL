import { Request, Response } from "express";
import prisma from "../lib/prima";

// Get all matches
export const getAllMatches = async (req: Request, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        scores: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a match with player scores
export const createMatch = async (req: Request, res: Response) => {
  try {
    const { name, date, scores } = req.body;

    if (!name || !date || !scores || !Array.isArray(scores)) {
      return res.status(400).json({
        error: "Match name, date, and scores array required",
      });
    }

    // Validate scores format: [{ playerId, points }]
    for (const score of scores) {
      if (!score.playerId || typeof score.points !== "number") {
        return res.status(400).json({
          error: "Each score must have playerId and points",
        });
      }
    }

    // Create match with scores
    const match = await prisma.match.create({
      data: {
        name,
        date: new Date(date),
        scores: {
          create: scores.map((score: any) => ({
            playerId: score.playerId,
            points: score.points,
          })),
        },
      },
      include: {
        scores: {
          include: {
            player: true,
          },
        },
      },
    });

    res.status(201).json({ match });
  } catch (error) {
    console.error("Create match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific match
export const getMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        scores: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json({ match });
  } catch (error) {
    console.error("Get match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
