export type Player = {
  id: string
  name: string
  price: number
  category: 'MS' | 'WS' | 'MD' | 'WD' | 'XD'
}

export type TeamState = {
  players: Array<Player>
  totalCost: number
  msCount: number
  wsCount: number
  anyCount: number
}
