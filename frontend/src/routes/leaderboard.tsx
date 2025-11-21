import { createFileRoute } from '@tanstack/react-router'
import Leaderboard from '@/components/Leaderboard'
import { dummyLeaderboard } from '@/data/dummyLeaderboard'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardComponent,
})

function LeaderboardComponent() {
  return <Leaderboard data={dummyLeaderboard} />
}
