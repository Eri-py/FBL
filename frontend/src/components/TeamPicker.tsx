import { Box, Container, Typography } from '@mui/material'
import { samplePlayers } from '../data/samplePlayers'
import TeamSummary from './TeamSummary'
import PlayerFeed from './PlayerFeed'
import { useTeam } from '@/hooks/useTeam'

export default function TeamPicker() {
  const {
    team,
    canAddPlayer,
    addPlayer,
    removePlayer,
    isTeamValid,
    MAX_BUDGET,
  } = useTeam()

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          🏸 Fantasy Badminton
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Build your dream team • £{MAX_BUDGET}m budget
        </Typography>
      </Box>

      {/* Team Summary */}
      <TeamSummary
        team={team}
        onRemovePlayer={removePlayer}
        isTeamValid={isTeamValid}
        MAX_BUDGET={MAX_BUDGET}
      />

      {/* Player Feed */}
      <PlayerFeed
        players={samplePlayers}
        canAddPlayer={canAddPlayer}
        onAddPlayer={addPlayer}
        teamPlayers={team.players}
      />
    </Container>
  )
}
