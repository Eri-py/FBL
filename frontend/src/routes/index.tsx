import { createFileRoute } from '@tanstack/react-router'
import { Box, Container, Typography } from '@mui/material'
import Leaderboard from '@/components/Leaderboard'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          🏸 Fantasy Badminton League
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Compete with players worldwide
        </Typography>
      </Box>

      <Leaderboard />
    </Container>
  )
}
