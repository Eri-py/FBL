import { Avatar, Button, Card, CardContent, Typography } from '@mui/material'
import { getCategoryName, getPlayerInitials } from '../utils/playerUtils'
import type { Player } from '../types'

interface PlayerCardProps {
  player: Player
  canAddPlayer: (player: Player) => boolean
  onAddPlayer: (player: Player) => void
  isInTeam: boolean
}

export default function PlayerCard({
  player,
  canAddPlayer,
  onAddPlayer,
  isInTeam,
}: PlayerCardProps) {
  const canAdd = canAddPlayer(player)

  return (
    <Card
      sx={{
        width: '100%',
        minWidth: 280,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          cursor: 'pointer',
        },
        border: canAdd ? '2px solid transparent' : '2px solid',
        borderColor: canAdd ? 'transparent' : 'grey.300',
      }}
    >
      <CardContent sx={{ p: 3, textAlign: 'center', width: '100%' }}>
        {/* Player Avatar */}
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            bgcolor: canAdd ? 'primary.main' : 'grey.400',
            fontSize: '1.5rem',
          }}
        >
          {getPlayerInitials(player.name)}
        </Avatar>

        {/* Player Name */}
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {player.name}
        </Typography>

        {/* Player Details */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {getCategoryName(player.category)}
        </Typography>

        <Typography
          variant="h5"
          color="primary.main"
          fontWeight="bold"
          gutterBottom
        >
          £{player.price}m
        </Typography>

        {/* Add Button */}
        <Button
          variant={canAdd ? 'contained' : 'outlined'}
          disabled={!canAdd}
          onClick={() => onAddPlayer(player)}
          fullWidth
          size="large"
        >
          {canAdd ? 'Add to Team' : 'Cannot Add'}
        </Button>

        {/* Reason why disabled */}
        {!canAdd && isInTeam && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: 'block' }}
          >
            Already in team
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
