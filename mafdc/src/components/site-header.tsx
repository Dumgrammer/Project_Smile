import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsDropdown } from "@/components/notifications"
import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Joyride, { Step } from "react-joyride"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const pathname = usePathname()

  const buildSteps = (): Step[] => {
    const s: Step[] = []
    
    // Appointments page tour
    if (pathname === '/appointments') {
      if (document.querySelector('#tour-new-apt')) s.push({ target: '#tour-new-apt', content: 'Create a new appointment.', disableBeacon: true })
      if (document.querySelector('#tour-nav-controls')) s.push({ target: '#tour-nav-controls', content: 'Use these to navigate dates.' })
      if (document.querySelector('#tour-view-controls')) s.push({ target: '#tour-view-controls', content: 'Switch between Month, Week, and Day views.' })
      if (document.querySelector('#tour-calendar')) s.push({ target: '#tour-calendar', content: 'This is your calendar. Click a slot to add or an event to edit.' })
      if (document.querySelector('#tour-today-schedule')) s.push({ target: '#tour-today-schedule', content: 'View today\'s appointments and manage them.' })
      if (document.querySelector('#tour-archived')) s.push({ target: '#tour-archived', content: 'View and filter archived appointments.' })
    }
    
    // Dashboard page tour
    else if (pathname === '/dashboard') {
      if (document.querySelector('#tour-dashboard-stats')) s.push({ target: '#tour-dashboard-stats', content: 'View key statistics and metrics.', disableBeacon: true })
      if (document.querySelector('#tour-recent-activity')) s.push({ target: '#tour-recent-activity', content: 'See recent patient activities and updates.' })
    }
    
    // Patients page tour
    else if (pathname === '/patients' || pathname === '/patients/list') {
      if (document.querySelector('#tour-patient-list')) s.push({ target: '#tour-patient-list', content: 'View and manage all patients.', disableBeacon: true })
      if (document.querySelector('#tour-add-patient')) s.push({ target: '#tour-add-patient', content: 'Add new patients to the system.' })
      if (document.querySelector('#tour-archive-toggle')) s.push({ target: '#tour-archive-toggle', content: 'Toggle between active and archived patients.' })
      if (document.querySelector('#tour-customize-columns')) s.push({ target: '#tour-customize-columns', content: 'Show/hide table columns to customize your view.' })
      // Add a tour step about the actions menu by targeting the Actions column header
      if (document.querySelector('#tour-actions-column')) s.push({ target: '#tour-actions-column', content: 'Each patient row has a three-dot menu (⋮) in this Actions column that provides options like view profile, update, archive, or delete.' })
    }
    
    // Inquiries page tour
    else if (pathname === '/inquiries') {
      if (document.querySelector('#tour-inquiry-list')) s.push({ target: '#tour-inquiry-list', content: 'View and manage customer inquiries.', disableBeacon: true })
      if (document.querySelector('#tour-inquiry-filters')) s.push({ target: '#tour-inquiry-filters', content: 'Filter inquiries by status.' })
      if (document.querySelector('#search-filter')) s.push({ target: '#search-filter', content: 'Search inquiries by customer name, email, or subject.' })
    }
    
    // Logs page tour
    else if (pathname === '/logs') {
      if (document.querySelector('#tour-logs-stats')) s.push({ target: '#tour-logs-stats', content: 'View system statistics and activity metrics.', disableBeacon: true })
      if (document.querySelector('#tour-logs-table')) s.push({ target: '#tour-logs-table', content: 'Monitor admin activities and system events.' })
    }
    
    // Settings page tour
    else if (pathname === '/settings') {
      if (document.querySelector('#tour-dark-mode')) s.push({ target: '#tour-dark-mode', content: 'Toggle dark mode for better visibility.', disableBeacon: true })
      if (document.querySelector('#tour-font-size')) s.push({ target: '#tour-font-size', content: 'Adjust font size for accessibility.' })
    }
    
    return s
  }

  const startTour = (e: React.MouseEvent) => {
    e.preventDefault()
    // Build steps only when tour is started to ensure elements exist
    const s = buildSteps()
    if (s.length > 0) {
      setSteps(s)
      setRun(true)
    } else {
      // Show a message if no tour steps are available
      console.log('No tour steps available for this page')
    }
  }
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex-1" />
        <NotificationsDropdown />
        <Link href="#" aria-label="Help" onClick={startTour} className="ml-1 inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </Link>
      </div>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        scrollToFirstStep
        styles={{
          options: {
            primaryColor: '#7c3aed',
            zIndex: 10000,
          },
        }}
        callback={(data) => {
          const { status } = data
          if (status === 'finished' || status === 'skipped') setRun(false)
        }}
      />
    </header>
  )
}
