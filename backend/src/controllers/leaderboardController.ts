import { Request, Response } from "express";
import prisma from "../lib/prima";

// Get leaderboard with team scores
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Get all teams with their players
    const teams = await prisma.team.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
        players: {
          include: {
            player: {
              include: {
                scores: true,
              },
            },
          },
        },
      },
    });

    // Calculate total points for each team
    const leaderboard = teams.map((team) => {
      const totalPoints = team.players.reduce((sum, tp) => {
        const playerPoints = tp.player.scores.reduce((pSum, score) => pSum + score.points, 0);
        return sum + playerPoints;
      }, 0);

      return {
        id: team.id,
        teamName: team.name,
        username: team.user.username,
        userId: team.userId,
        points: totalPoints,
        playerCount: team.players.length,
      };
    });

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({ leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
