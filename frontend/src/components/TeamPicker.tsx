import { Box, CircularProgress, Container, Typography } from '@mui/material'
import TeamSummary from './TeamSummary'
import PlayerFeed from './PlayerFeed'
import { useTeam } from '@/hooks/useTeam'

export default function TeamPicker() {
  const {
    team,
    players,
    isLoading,
    error,
    canAddPlayer,
    addPlayer,
    removePlayer,
    isTeamValid,
    MAX_BUDGET,
  } = useTeam()

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading players...</Typography>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
        <Typography color="error">
          Failed to load players. Please try again.
        </Typography>
      </Container>
    )
  }

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
      {players && (
        <PlayerFeed
          players={players}
          canAddPlayer={canAddPlayer}
          onAddPlayer={addPlayer}
          teamPlayers={team.players}
        />
      )}
    </Container>
  )
}
