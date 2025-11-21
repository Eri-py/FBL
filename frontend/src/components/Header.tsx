import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import AuthForm from './AuthForm'
import { useThemeToggle } from '@/hooks/useThemeToggle'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { isDark, toggleTheme } = useThemeToggle()
  const { user, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()

  const handleAuthSuccess = () => {
    setAuthOpen(false)
    // Redirect based on whether user has a team
    if (user?.hasTeam) {
      navigate({ to: '/dashboard' })
    } else {
      navigate({ to: '/team' })
    }
  }

  const handleProfileClick = () => {
    if (user?.hasTeam) {
      navigate({ to: '/dashboard' })
    } else {
      navigate({ to: '/team' })
    }
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          {/* Left: Project Name - Clickable to go home */}
          <Link
            to="/"
            style={{ textTransform: 'unset', textDecoration: 'unset' }}
          >
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1565c0, #42a5f5)',
                backgroundClip: 'text',
                color: 'transparent',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              🏸 Fantasy Badminton
            </Typography>
          </Link>

          {/* Right: Auth + Theme */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}
          >
            {user ? (
              <>
                <Button
                  color="inherit"
                  onClick={handleProfileClick}
                  sx={{ fontWeight: 600 }}
                >
                  Profile
                </Button>
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  sx={{ fontWeight: 600 }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setAuthOpen(true)}
                sx={{ fontWeight: 600 }}
              >
                Join League
              </Button>
            )}
            <IconButton onClick={toggleTheme} color="inherit">
              {isDark ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <AuthForm
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
