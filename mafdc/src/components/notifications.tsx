"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IconBellRinging, IconX, IconEye, IconTrash, IconPhone, IconMail, IconCalendar } from "@tabler/icons-react"
import { useAppointments } from "@/hooks/appointments/appointmentHooks"
import { toast } from "sonner"

// Interface for missed appointment data from API
interface MissedAppointment {
  id: string;
  patientName: string;
  appointmentTime: string;
  service: string;
  status: string;
  phone: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  patientId: string;
}

export function NotificationsDropdown() {
  const [showAll, setShowAll] = useState(false)
  const [notifications, setNotifications] = useState<MissedAppointment[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { getMissedAppointments, updateMissedAppointments } = useAppointments()

  // Fetch missed appointments on component mount
  useEffect(() => {
    fetchMissedAppointments()
  }, [])

  const fetchMissedAppointments = async () => {
    try {
      setIsLoading(true)
      const missedAppointments = await getMissedAppointments()
      setNotifications(missedAppointments || [])
    } catch (error) {
      console.error('Error fetching missed appointments:', error)
      toast.error('Failed to fetch missed appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3)
  const hasMoreNotifications = notifications.length > 3

  const handleCancelAll = async () => {
    try {
      setIsLoading(true)
      await updateMissedAppointments()
      setNotifications([])
      setIsOpen(false)
      setIsModalOpen(false)
      toast.success('All missed appointments have been cancelled')
    } catch (error) {
      console.error('Error cancelling all appointments:', error)
      toast.error('Failed to cancel missed appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissNotification = async (id: string) => {
    try {
      // For individual dismiss, we'll just remove it from the local state
      // The backend will handle the actual cancellation when updateMissedAppointments is called
      setNotifications(prev => prev.filter(notification => notification.id !== id))
      toast.success('Notification dismissed')
    } catch (error) {
      console.error('Error dismissing notification:', error)
      toast.error('Failed to dismiss notification')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 relative"
            aria-label="Notifications"
            disabled={isLoading}
          >
            <IconBellRinging className="h-6 w-6" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {notifications.length > 99 ? '99+' : notifications.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <DropdownMenuLabel className="text-base font-semibold">
                Notifications
              </DropdownMenuLabel>
              {notifications.length > 0 && (
                <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      disabled={isLoading}
                    >
                      <IconTrash className="h-3 w-3 mr-1" />
                      Cancel All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel All Missed Appointments</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel all missed appointments? This will mark them as cancelled in the system and send notifications to patients. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Cancel All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <IconBellRinging className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No missed appointments</p>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.patientName}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissNotification(notification.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          disabled={isLoading}
                        >
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {notification.service}
                      </p>
                      <p className="text-xs text-destructive font-medium mb-1">
                        Missed: {formatDate(notification.appointmentTime)}
                      </p>
                      {showAll && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>📞 {notification.phone}</p>
                          <p>📧 {notification.email}</p>
                          <p>📅 {formatFullDate(notification.appointmentTime)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2 flex gap-2">
                {hasMoreNotifications && !showAll && (
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        disabled={isLoading}
                      >
                        <IconEye className="h-3 w-3 mr-1" />
                        See All ({notifications.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <IconBellRinging className="h-5 w-5" />
                          All Missed Appointments ({notifications.length})
                        </DialogTitle>
                        <DialogDescription>
                          Detailed view of all missed appointments from the system
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {notification.patientName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {notification.service}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">
                                  Missed Appointment
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDismissNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  disabled={isLoading}
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Appointment Time:</span>
                                </div>
                                <p className="text-destructive font-medium ml-6">
                                  {formatFullDate(notification.appointmentTime)}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Phone:</span>
                                </div>
                                <p className="ml-6">{notification.phone}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <IconMail className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Email:</span>
                                </div>
                                <p className="ml-6">{notification.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              disabled={isLoading}
                            >
                              <IconTrash className="h-3 w-3 mr-1" />
                              Cancel All Appointments
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel All Missed Appointments</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel all missed appointments? This will mark them as cancelled in the system and send notifications to patients. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCancelAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, Cancel All
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {showAll && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(false)}
                    className="flex-1 h-8 text-xs"
                    disabled={isLoading}
                  >
                    Show Less
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                      disabled={isLoading}
                    >
                      <IconTrash className="h-3 w-3 mr-1" />
                      Cancel All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel All Missed Appointments</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel all missed appointments? This will mark them as cancelled in the system and send notifications to patients. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Cancel All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
