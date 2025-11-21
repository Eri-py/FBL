import {
  Avatar,
  Box,
  Card,
  CardContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { LeaderboardEntry } from '@/data/dummyLeaderboard'

type LeaderboardProps = {
  data: Array<LeaderboardEntry>
}

export default function Leaderboard({ data }: LeaderboardProps) {
  const topThree = data.slice(0, 3)
  const restOfPlayers = data.slice(3)

  const getPlayerInitials = (username: string) => {
    return username
      .split('_')
      .map((word) => word[0].toUpperCase())
      .join('')
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700' // Gold
      case 2:
        return '#C0C0C0' // Silver
      case 3:
        return '#CD7F32' // Bronze
      default:
        return 'primary.main'
    }
  }

  return (
    <Box>
      {/* Top 3 Cards */}
      <Stack
        direction="row"
        spacing={2}
        mb={4}
        justifyContent="space-between"
        flexWrap="wrap"
      >
        {topThree.map((player) => (
          <Card
            key={player.id}
            sx={{
              flex: 1,
              minWidth: 280,
              position: 'relative',
              border: player.rank === 1 ? '2px solid #FFD700' : 'none',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Avatar with Rank Badge */}
                <Box position="relative">
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.25rem',
                    }}
                  >
                    {getPlayerInitials(player.username)}
                  </Avatar>
                  {/* Rank Badge on Avatar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: getRankBadgeColor(player.rank),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  >
                    {player.rank}
                  </Box>
                </Box>

                {/* Player Info */}
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {player.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    @{player.username}
                  </Typography>
                </Box>
              </Stack>

              {/* Stats Row */}
              <Stack direction="row" spacing={2} mt={2}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    WINS
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {Math.floor(Math.random() * 500 + 400)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    MATCHES
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {Math.floor(Math.random() * 300 + 700)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    POINTS
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {player.points.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Global Ranking Table */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Global Ranking
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>User name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                Points
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restOfPlayers.map((player) => (
              <TableRow
                key={player.id}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Rank */}
                <TableCell>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'action.selected',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {player.rank}
                  </Box>
                </TableCell>

                {/* User Info */}
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                      }}
                    >
                      {getPlayerInitials(player.username)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {player.username}
                    </Typography>
                  </Stack>
                </TableCell>

                {/* Team Name */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {player.teamName}
                  </Typography>
                </TableCell>

                {/* Points */}
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {player.points.toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
