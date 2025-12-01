import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import TeamSummary from './TeamSummary'
import PlayerFeed from './PlayerFeed'
import { useTeam } from '@/hooks/useTeam'

export default function TeamPicker() {
  const {
    team,
    savedTeamName,
    players,
    isLoading,
    error,
    canAddPlayer,
    addPlayer,
    removePlayer,
    saveTeam,
    isTeamValid,
    isSaving,
    saveError,
    MAX_BUDGET,
  } = useTeam()

  const navigate = useNavigate()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState('')

  const isEditing = !!savedTeamName

  const handleSaveClick = () => {
    if (!isTeamValid) return

    // Pre-fill team name if editing
    if (savedTeamName && !teamName) {
      setTeamName(savedTeamName)
    }

    setSaveDialogOpen(true)
  }

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      return
    }

    try {
      await saveTeam(teamName.trim())
      setSaveDialogOpen(false)
      navigate({ to: '/dashboard' })
    } catch (err) {
      // Error is handled by the hook
    }
  }

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
    <>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            🏸 Fantasy Badminton
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {isEditing
              ? `Editing: ${savedTeamName}`
              : `Build your dream team • £${MAX_BUDGET}m budget`}
          </Typography>
        </Box>

        {/* Team Summary */}
        <TeamSummary
          team={team}
          onRemovePlayer={removePlayer}
          isTeamValid={isTeamValid}
          MAX_BUDGET={MAX_BUDGET}
        />

        {/* Save Team Button */}
        {isTeamValid && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveClick}
              sx={{ minWidth: 200 }}
            >
              {isEditing ? 'Update Team' : 'Save Team'}
            </Button>
          </Box>
        )}

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

      {/* Save Team Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Update Your Team' : 'Save Your Team'}
        </DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(saveError as any)?.response?.data?.error ||
                'Failed to save team'}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            margin="normal"
            placeholder="Enter a name for your team"
            disabled={isSaving}
            error={!teamName.trim() && teamName.length > 0}
            helperText={
              !teamName.trim() && teamName.length > 0
                ? 'Team name is required'
                : ''
            }
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your team:
            </Typography>
            {team.players.map((player) => (
              <Typography key={player.id} variant="body2" sx={{ ml: 2 }}>
                • {player.name} - £{player.price}m
              </Typography>
            ))}
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
              Total: £{team.totalCost}m
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTeam}
            variant="contained"
            disabled={isSaving || !teamName.trim()}
          >
            {isSaving ? (
              <CircularProgress size={24} />
            ) : isEditing ? (
              'Update Team'
            ) : (
              'Save Team'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
