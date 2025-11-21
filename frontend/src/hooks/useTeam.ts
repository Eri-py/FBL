import { useState } from 'react'
import type { Player, TeamState } from '../types'

const MAX_BUDGET = 50

export const useTeam = () => {
  const [team, setTeam] = useState<TeamState>({
    players: [],
    totalCost: 0,
    msCount: 0,
    wsCount: 0,
    anyCount: 0,
  })

  const canAddPlayer = (player: Player): boolean => {
    if (team.players.find((p) => p.id === player.id)) return false
    if (team.totalCost + player.price > MAX_BUDGET) return false

    if (player.category === 'MS' && team.msCount >= 2) return false
    if (player.category === 'WS' && team.wsCount >= 2) return false
    if (team.anyCount >= 1 && !['MS', 'WS'].includes(player.category))
      return false

    return true
  }

  const addPlayer = (player: Player) => {
    if (!canAddPlayer(player)) return

    setTeam((prev) => ({
      players: [...prev.players, player],
      totalCost: prev.totalCost + player.price,
      msCount: player.category === 'MS' ? prev.msCount + 1 : prev.msCount,
      wsCount: player.category === 'WS' ? prev.wsCount + 1 : prev.wsCount,
      anyCount: !['MS', 'WS'].includes(player.category)
        ? prev.anyCount + 1
        : prev.anyCount,
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
      anyCount: !['MS', 'WS'].includes(player.category)
        ? prev.anyCount - 1
        : prev.anyCount,
    }))
  }

  const isTeamValid = team.players.length === 5 && team.totalCost <= MAX_BUDGET

  return {
    team,
    canAddPlayer,
    addPlayer,
    removePlayer,
    isTeamValid,
    MAX_BUDGET,
  }
}
