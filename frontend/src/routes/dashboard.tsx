import { createFileRoute } from '@tanstack/react-router'
import UserDashboard from '@/components/UserDashboard'

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return <UserDashboard />
}
