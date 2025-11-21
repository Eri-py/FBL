import { Box, Stack, Typography } from '@mui/material'
import PlayerCard from './PlayerCard'
import type { Player } from '../types'

interface PlayerFeedProps {
  players: Array<Player>
  canAddPlayer: (player: Player) => boolean
  onAddPlayer: (player: Player) => void
  teamPlayers: Array<Player>
}

export default function PlayerFeed({
  players,
  canAddPlayer,
  onAddPlayer,
  teamPlayers,
}: PlayerFeedProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ ml: 1, mb: 2 }}>
        Available Players
      </Typography>

      <Stack
        direction="row"
        height="100%"
        gap={2}
        paddingBlock={2}
        sx={{
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'grey.800',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'grey.400',
            borderRadius: 4,
          },
          scrollBehavior: 'smooth',
        }}
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY * 5
        }}
      >
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            canAddPlayer={canAddPlayer}
            onAddPlayer={onAddPlayer}
            isInTeam={teamPlayers.some((p) => p.id === player.id)}
          />
        ))}
      </Stack>
    </Box>
  )
}
