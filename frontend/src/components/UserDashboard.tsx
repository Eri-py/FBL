import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBuildTeam = () => {
    navigate({ to: '/team' })
  }

  const handleViewTeam = () => {
    navigate({ to: '/team' })
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Welcome, {user?.username}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {user?.hasTeam
            ? 'Your team is ready for the season!'
            : 'Build your team to get started!'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {user?.hasTeam ? (
          <>
            <Typography variant="h5" gutterBottom>
              🏸 Your Team is Set!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              Check back when the season starts to see your performance!
            </Typography>
            <Button variant="contained" size="large" onClick={handleViewTeam}>
              View My Team
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              🎯 Build Your Dream Team
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              Create your fantasy badminton team to compete in the upcoming
              season!
            </Typography>
            <Button variant="contained" size="large" onClick={handleBuildTeam}>
              Build Team
            </Button>
          </>
        )}
      </Paper>
    </Container>
  )
}
