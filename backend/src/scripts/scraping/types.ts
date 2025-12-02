export type CompletedMatch = {
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  date: string;
  winner: string;
};

export type DayResult = {
  date: string;
  dateScraped: Date;
  matches: CompletedMatch[];
};

export type ScrapeResult = {
  totalMatches: number;
  dayResults: DayResult[];
  scrapedDates: string[];
};
