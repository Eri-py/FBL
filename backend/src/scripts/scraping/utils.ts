export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function parseScore(scoreText: string): {
  homeGamesWon: number;
  awayGamesWon: number;
  homeScoreParts: string[];
  awayScoreParts: string[];
} {
  const scoreParts = scoreText.split(/[\s\n]+/).filter((s) => s && s !== "-");
  return {
    homeGamesWon: 0,
    awayGamesWon: 0,
    homeScoreParts: scoreParts,
    awayScoreParts: scoreParts,
  };
}
