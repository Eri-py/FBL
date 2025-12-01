import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Player } from '@/types'
import { api } from '@/lib/axios'
import { getCategoryName, getPlayerInitials } from '@/utils/playerUtils'

type SavedTeam = {
  id: string
  name: string
  userId: string
  players: Array<Player>
  createdAt: string
  updatedAt: string
}

export default function MyTeam() {
  const navigate = useNavigate()

  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['myTeam'],
    queryFn: async () => {
      const response = await api.get('/teams/me')
      return response.data.team as SavedTeam
    },
    retry: false,
  })

  const handleEditTeam = () => {
    navigate({ to: '/team' })
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your team...</Typography>
      </Container>
    )
  }

  if (error || !teamData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">Failed to load team</Typography>
        <Button onClick={() => navigate({ to: '/team' })} sx={{ mt: 2 }}>
          Build Team
        </Button>
      </Container>
    )
  }

  const totalCost = teamData.players.reduce((sum, p) => sum + p.price, 0)
  const msPlayers = teamData.players.filter((p) => p.category === 'MS')
  const wsPlayers = teamData.players.filter((p) => p.category === 'WS')
  const otherPlayers = teamData.players.filter(
    (p) => !['MS', 'WS'].includes(p.category),
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          {teamData.name}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Total Value: £{totalCost}m / £40m
        </Typography>
      </Box>

      {/* Team Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {teamData.players.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Players
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {msPlayers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Men's Singles
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {wsPlayers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Women's Singles
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {otherPlayers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Other Category
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Button */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button variant="contained" size="large" onClick={handleEditTeam}>
          Edit Team
        </Button>
      </Box>

      {/* Players Grid */}
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Your Players
        </Typography>

        <Grid container spacing={3}>
          {teamData.players.map((player) => (
            <Grid key={player.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.25rem',
                      }}
                    >
                      {getPlayerInitials(player.name)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" noWrap>
                        {player.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getCategoryName(player.category)}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        £{player.price}m
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Team Info */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Team created: {new Date(teamData.createdAt).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: {new Date(teamData.updatedAt).toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}
