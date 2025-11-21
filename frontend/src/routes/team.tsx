import { createFileRoute } from '@tanstack/react-router'
import TeamPicker from '@/components/TeamPicker'

export const Route = createFileRoute('/team')({
  component: TeamComponent,
})

function TeamComponent() {
  return <TeamPicker />
}
