import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

type AuthFormProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthForm({ open, onClose, onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await signup(username, password)
      }

      onSuccess()
      setUsername('')
      setPassword('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: 'login' | 'signup',
  ) => {
    setMode(newValue)
    setError('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Tabs value={mode} onChange={handleTabChange} centered>
          <Tab label="Login" value="login" />
          <Tab label="Sign Up" value="signup" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : mode === 'login' ? (
              'Login'
            ) : (
              'Sign Up'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
