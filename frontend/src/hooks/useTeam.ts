import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Player, TeamState } from '@/types'
import { api } from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'

const MAX_BUDGET = 40

export const useTeam = () => {
  const { user, setUserTeam } = useAuth()
  const queryClient = useQueryClient()

  const [team, setTeam] = useState<TeamState>({
    players: [],
    totalCost: 0,
    msCount: 0,
    wsCount: 0,
    anyCount: 0,
  })

  const [savedTeamName, setSavedTeamName] = useState<string>('')

  // Fetch all available players
  const {
    data: players,
    isLoading: playersLoading,
    error: playersError,
  } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await api.get('/teams/players')
      return response.data.players as Array<Player>
    },
    staleTime: 10 * 60 * 1000,
  })

  // Fetch user's saved team (if authenticated and has team)
  const { data: savedTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['myTeam'],
    queryFn: async () => {
      const response = await api.get('/teams/me')
      return response.data.team
    },
    enabled: !!user && user.hasTeam,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  // Save team mutation
  const saveTeamMutation = useMutation({
    mutationFn: async ({
      name,
      playerIds,
    }: {
      name: string
      playerIds: Array<string>
    }) => {
      const response = await api.post('/teams', { name, playerIds })
      return response.data
    },
    onSuccess: () => {
      // Update user's hasTeam status
      setUserTeam(true)
      // Invalidate queries to refetch team data and auth status
      queryClient.invalidateQueries({ queryKey: ['myTeam'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  // Load saved team into state when data arrives
  useEffect(() => {
    if (savedTeam && savedTeam.players) {
      const loadedPlayers = savedTeam.players as Array<Player>

      const msCount = loadedPlayers.filter((p) => p.category === 'MS').length
      const wsCount = loadedPlayers.filter((p) => p.category === 'WS').length
      const anyCount = 0
      const totalCost = loadedPlayers.reduce((sum, p) => sum + p.price, 0)

      setTeam({
        players: loadedPlayers,
        totalCost,
        msCount,
        wsCount,
        anyCount,
      })

      setSavedTeamName(savedTeam.name || '')
    }
  }, [savedTeam])

  const canAddPlayer = (player: Player): boolean => {
    if (team.players.find((p) => p.id === player.id)) return false
    if (team.totalCost + player.price > MAX_BUDGET) return false

    if (player.category === 'MS' && team.msCount >= 2) return false
    if (player.category === 'WS' && team.wsCount >= 2) return false

    return true
  }

  const addPlayer = (player: Player) => {
    if (!canAddPlayer(player)) return

    setTeam((prev) => ({
      players: [...prev.players, player],
      totalCost: prev.totalCost + player.price,
      msCount: player.category === 'MS' ? prev.msCount + 1 : prev.msCount,
      wsCount: player.category === 'WS' ? prev.wsCount + 1 : prev.wsCount,
      anyCount: 0,
    }))
  }

  const removePlayer = (playerId: string) => {
    const player = team.players.find((p) => p.id === playerId)
    if (!player) return

    setTeam((prev) => ({
      players: prev.players.filter((p) => p.id !== playerId),
      totalCost: prev.totalCost - player.price,
      msCount: player.category === 'MS' ? prev.msCount - 1 : prev.msCount,
      wsCount: player.category === 'WS' ? prev.wsCount - 1 : prev.wsCount,
      anyCount: 0,
    }))
  }

  const saveTeam = async (name: string) => {
    const playerIds = team.players.map((p) => p.id)
    await saveTeamMutation.mutateAsync({ name, playerIds })
  }

  const isTeamValid = team.players.length === 4 && team.totalCost <= MAX_BUDGET
  const isLoading = playersLoading || teamLoading
  const error = playersError

  return {
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
    isSaving: saveTeamMutation.isPending,
    saveError: saveTeamMutation.error,
    MAX_BUDGET,
  }
}
