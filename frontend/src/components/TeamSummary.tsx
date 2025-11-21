import { Alert, Box, Chip, Paper, Typography } from '@mui/material'
import type { TeamState } from '../types'

interface TeamSummaryProps {
  team: TeamState
  onRemovePlayer: (playerId: string) => void
  isTeamValid: boolean
  MAX_BUDGET: number
}

export default function TeamSummary({
  team,
  onRemovePlayer,
  isTeamValid,
  MAX_BUDGET,
}: TeamSummaryProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Your Team ({team.players.length}/5)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {team.msCount} MS • {team.wsCount} WS • {team.anyCount} Other
          </Typography>
        </Box>

        <Typography
          variant="h6"
          color={team.totalCost > MAX_BUDGET ? 'error' : 'text.primary'}
          fontWeight="bold"
        >
          £{team.totalCost}m / £{MAX_BUDGET}m
        </Typography>
      </Box>

      {/* Selected Players */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {team.players.map((player) => (
          <Chip
            key={player.id}
            label={`${player.name.split(' ')[0]} • £${player.price}m`}
            onDelete={() => onRemovePlayer(player.id)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>

      {/* Validation Alert */}
      {!isTeamValid && (
        <Alert severity="info" sx={{ mt: 2, color: 'text.primary' }}>
          {
            "Select 5 players (2 Men's Singles, 2 Women's Singles, 1 Other) within budget"
          }
        </Alert>
      )}
    </Paper>
  )
}
