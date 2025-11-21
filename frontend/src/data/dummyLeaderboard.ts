export type LeaderboardEntry = {
  id: string
  username: string
  rank: number
  points: number
  teamName: string
  change: 'up' | 'down' | 'same'
}

export const dummyLeaderboard: Array<LeaderboardEntry> = [
  {
    id: '1',
    username: 'badminton_pro',
    rank: 1,
    points: 1245,
    teamName: 'Smash Kings',
    change: 'up',
  },
  {
    id: '2',
    username: 'net_queen',
    rank: 2,
    points: 1187,
    teamName: 'Net Dominators',
    change: 'same',
  },
  {
    id: '3',
    username: 'shuttle_master',
    rank: 3,
    points: 1156,
    teamName: 'Shuttle Warriors',
    change: 'down',
  },
  {
    id: '4',
    username: 'rally_royale',
    rank: 4,
    points: 1098,
    teamName: 'Rally Royals',
    change: 'up',
  },
  {
    id: '5',
    username: 'drop_shot_dan',
    rank: 5,
    points: 1043,
    teamName: 'Drop Shot Dynasty',
    change: 'up',
  },
  {
    id: '6',
    username: 'clear_expert',
    rank: 6,
    points: 987,
    teamName: 'Clear Champions',
    change: 'down',
  },
  {
    id: '7',
    username: 'drive_dominator',
    rank: 7,
    points: 932,
    teamName: 'Drive Demons',
    change: 'same',
  },
  {
    id: '8',
    username: 'smash_sultan',
    rank: 8,
    points: 876,
    teamName: 'Smash Squad',
    change: 'up',
  },
  {
    id: '9',
    username: 'backcourt_boss',
    rank: 9,
    points: 821,
    teamName: 'Backcourt Bandits',
    change: 'down',
  },
  {
    id: '10',
    username: 'feint_fanatic',
    rank: 10,
    points: 765,
    teamName: 'Feint Masters',
    change: 'same',
  },
]
