import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import MyTeam from './MyTeam'
import { useAuth } from '@/contexts/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBuildTeam = () => {
    navigate({ to: '/team' })
  }

  // If user has a team, show the team display
  if (user?.hasTeam) {
    return <MyTeam />
  }

  // If no team, show welcome message with build team button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Welcome, {user?.username}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Build your team to get started!
        </Typography>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          🎯 Build Your Dream Team
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
          Create your fantasy badminton team to compete in the upcoming season!
        </Typography>
        <Button variant="contained" size="large" onClick={handleBuildTeam}>
          Build Team
        </Button>
      </Paper>
    </Container>
  )
}
