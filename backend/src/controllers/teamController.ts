import { Request, Response } from "express";
import prisma from "../lib/prima";

// Get all available players
export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ category: "asc" }, { price: "desc" }],
    });

    res.json({ players });
  } catch (error) {
    console.error("Get players error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get current user's team
export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const team = await prisma.team.findUnique({
      where: { userId },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Transform the response to match frontend expectations
    const formattedTeam = {
      id: team.id,
      name: team.name,
      userId: team.userId,
      players: team.players.map((tp) => ({
        id: tp.player.id,
        name: tp.player.name,
        price: tp.player.price,
        category: tp.player.category,
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    res.json({ team: formattedTeam });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create or update user's team
export const saveTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, playerIds } = req.body;

    if (!name || !playerIds || !Array.isArray(playerIds)) {
      return res.status(400).json({ error: "Team name and player IDs required" });
    }

    if (playerIds.length !== 5) {
      return res.status(400).json({ error: "Team must have exactly 5 players" });
    }

    // Fetch the players to validate categories and budget
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== 5) {
      return res.status(400).json({ error: "Invalid player IDs" });
    }

    // Validate budget (max 50)
    const totalCost = players.reduce((sum, p) => sum + p.price, 0);
    if (totalCost > 50) {
      return res.status(400).json({ error: "Team exceeds budget of £50m" });
    }

    // Validate team composition: 2 MS, 2 WS, 1 Other
    const msCount = players.filter((p) => p.category === "MS").length;
    const wsCount = players.filter((p) => p.category === "WS").length;
    const otherCount = players.filter((p) => !["MS", "WS"].includes(p.category)).length;

    if (msCount !== 2 || wsCount !== 2 || otherCount !== 1) {
      return res.status(400).json({
        error: "Team must have 2 Men's Singles, 2 Women's Singles, and 1 Other player",
      });
    }

    // Check if user already has a team
    const existingTeam = await prisma.team.findUnique({
      where: { userId },
      include: { players: true },
    });

    if (existingTeam) {
      // Update existing team
      // Delete old team players
      await prisma.teamPlayer.deleteMany({
        where: { teamId: existingTeam.id },
      });

      // Update team name
      await prisma.team.update({
        where: { id: existingTeam.id },
        data: { name },
      });

      // Add new players
      await prisma.teamPlayer.createMany({
        data: playerIds.map((playerId) => ({
          teamId: existingTeam.id,
          playerId,
        })),
      });

      res.json({
        message: "Team updated successfully",
        team: { id: existingTeam.id, name, playerIds },
      });
    } else {
      // Create new team
      const team = await prisma.team.create({
        data: {
          name,
          userId,
          players: {
            create: playerIds.map((playerId) => ({
              playerId,
            })),
          },
        },
      });

      res.status(201).json({
        message: "Team created successfully",
        team: { id: team.id, name, playerIds },
      });
    }
  } catch (error) {
    console.error("Save team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
