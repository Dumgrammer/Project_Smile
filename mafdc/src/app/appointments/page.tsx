'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, parse, startOfWeek, getDay, isToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './appointments.css';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppointments, AppointmentNotes } from '@/hooks/appointments/appointmentHooks';
import { PatientSearch } from "@/components/patient-search";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AppointmentsPage() {

  const useAppointmentsHook = useAppointments();
  const getAppointments = useAppointmentsHook.getAppointments;
  const getArchivedAppointments = useAppointmentsHook.getArchivedAppointments;
  const createAppointment = useAppointmentsHook.createAppointment;
  const cancelAppointment = useAppointmentsHook.cancelAppointment;
  const completeAppointment = useAppointmentsHook.completeAppointment;
  const createAppointmentNotes = useAppointmentsHook.createAppointmentNotes;
  const rescheduleAppointment = useAppointmentsHook.rescheduleAppointment;

  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    status: string;
    patient: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
    date: string;
    startTime: string;
    endTime: string;
  }>>([]);
  const [archivedEvents, setArchivedEvents] = useState<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    status: string;
    patient: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
    date: string;
    startTime: string;
    endTime: string;
  }>>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    title: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    status: string;
    patient: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState<AppointmentNotes>({
    treatmentNotes: '',
    reminderNotes: '',
    payment: {
      amount: 0,
      status: 'Pending'
    }
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showMonthAppointmentsModal, setShowMonthAppointmentsModal] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getAppointments();
      if (!response || !Array.isArray(response)) {
        console.error('Invalid appointments response:', response);
        toast.error('Failed to fetch appointments: Invalid response format');
        return;
      }

      const formattedEvents = response.map((apt: {
        _id: string;
        title: string;
        date: string;
        startTime: string;
        endTime: string;
        status: string;
        patient: {
          firstName: string;
          middleName?: string;
          lastName: string;
        };
      }) => {
        // Parse the ISO date string
        const appointmentDate = new Date(apt.date);
        
        // Get the date part in YYYY-MM-DD format
        const dateStr = format(appointmentDate, 'yyyy-MM-dd');
        
        // Create start and end dates by combining date and time
        const start = new Date(`${dateStr}T${apt.startTime}`);
        const end = new Date(`${dateStr}T${apt.endTime}`);

        return {
          id: apt._id,
          title: `${apt.title} - ${apt.patient.firstName} ${apt.patient.lastName}`,
          start,
          end,
          allDay: false,
          status: apt.status,
          patient: apt.patient,
          date: dateStr,
          startTime: apt.startTime,
          endTime: apt.endTime
        };
      });
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      toast.error('Failed to fetch appointments');
    }
  }, [getAppointments, setEvents]);

  const fetchArchivedAppointments = useCallback(async (date?: Date) => {
    try {
      const response = await getArchivedAppointments(
        date ? { date: format(date, 'yyyy-MM-dd') } : undefined
      );
      if (Array.isArray(response)) {
        const formattedArchivedEvents = response.map((apt: {
          _id: string;
          title: string;
          date: string;
          startTime: string;
          endTime: string;
          status: string;
          patient: {
            firstName: string;
            middleName?: string;
            lastName: string;
          };
        }) => {
          const appointmentDate = new Date(apt.date);
          const dateStr = format(appointmentDate, 'yyyy-MM-dd');
          const start = new Date(`${dateStr}T${apt.startTime}`);
          const end = new Date(`${dateStr}T${apt.endTime}`);

          return {
            id: apt._id,
            title: `${apt.title} - ${apt.patient.firstName} ${apt.patient.lastName}`,
            start,
            end,
            allDay: false,
            status: apt.status,
            patient: apt.patient,
            date: dateStr,
            startTime: apt.startTime,
            endTime: apt.endTime
          };
        });
        setArchivedEvents(formattedArchivedEvents);
      }
    } catch (err) {
      console.error('Failed to fetch archived appointments:', err);
      toast.error('Failed to fetch archived appointments');
    }
  }, [getArchivedAppointments, setArchivedEvents]);

  // Memoize the loadData function to prevent it from changing on every render
  const loadData = useCallback(async () => {
    await fetchAppointments();
    await fetchArchivedAppointments();
  }, [fetchAppointments, fetchArchivedAppointments]);

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (mounted) {
        await loadData();
      }
    };

    initializeData();

    return () => {
      mounted = false;
      setEvents([]);
      setArchivedEvents([]);
    };
  }, [loadData]); // Now we only depend on the memoized loadData function

  // Add new appointment
  const handleCreateAppointment = async () => {
    if (!newAppointment.title || !newAppointment.patientId) {
      toast.error('Please enter all required fields.');
      return;
    }

    try {
      await createAppointment({
        patientId: newAppointment.patientId,
        title: newAppointment.title,
        date: format(newAppointment.date, 'yyyy-MM-dd'),
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
      });
      
      setSuccessMessage('Appointment created successfully and confirmation email has been sent to the patient');
      setShowSuccessModal(true);
      setShowAppointmentModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to create appointment:', err);
      toast.error('Failed to create appointment');
    }
  };
  
  const handleSelectEvent = (event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    status: string;
    patient: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    setSelectedAppointment(event);
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      // Get the original appointment date and time
      const originalDate = selectedAppointment.date;
      const originalStartTime = selectedAppointment.startTime;
      const originalEndTime = selectedAppointment.endTime;

      // Get the new date and time
      let newDate, newStartTime, newEndTime;
      
      // If the date has changed, use the new date
      if (selectedAppointment.date !== originalDate) {
        newDate = selectedAppointment.date;
      } else {
        newDate = originalDate;
      }

      // If the time has changed, use the new time
      if (selectedAppointment.startTime !== originalStartTime) {
        newStartTime = selectedAppointment.startTime;
      } else {
        newStartTime = originalStartTime;
      }

      if (selectedAppointment.endTime !== originalEndTime) {
        newEndTime = selectedAppointment.endTime;
      } else {
        newEndTime = originalEndTime;
      }

      await rescheduleAppointment(selectedAppointment.id, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      setShowEditModal(false);
      fetchAppointments();
      toast.success('Appointment updated successfully');
    } catch (err) {
      console.error('Failed to update appointment:', err);
      toast.error('Failed to update appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      setShowEditModal(false);
      fetchAppointments();
      toast.success('Appointment cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
      setShowEditModal(false);
      fetchAppointments();
      toast.success('Appointment marked as completed');
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      toast.error('Failed to complete appointment');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    try {
      await createAppointmentNotes(selectedAppointment.id, appointmentNotes);
      setShowNotesModal(false);
      toast.success('Notes saved successfully');
    } catch (err) {
      console.error('Failed to save notes:', err);
      toast.error('Failed to save notes');
    }
  };

  // Remove unused businessHours and businessDays
  const isWithinBusinessHours = (date: Date) => {
    const hours = date.getHours();
    return hours >= 9 && hours < 17; // 9 AM to 5 PM
  };
  
  // Update handleSelectSlot to use business logic
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!isWithinBusinessHours(start)) {
      toast.error('Please select a time between 9 AM and 5 PM');
      return;
    }

    setNewAppointment({
      ...newAppointment,
      date: start,
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    });
    setShowAppointmentModal(true);
  };
  
  // Get today's appointments
  const todaysAppointments = useMemo(() => {
    return events.filter(event => 
      event.start instanceof Date && 
      isToday(event.start)
    );
  }, [events]);

  // Get all appointments for the current month
  const monthAppointments = useMemo(() => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return events.filter(event => {
      return event.start.getMonth() === month && event.start.getFullYear() === year;
    });
  }, [events, date]);

  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    switch (action) {
      case 'PREV':
        if (view === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === Views.WEEK) {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (view === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === Views.WEEK) {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          newDate.setDate(newDate.getDate() + 1);
        }
        break;
      case 'TODAY':
        newDate = new Date();
        break;
    }
    
    setDate(newDate);
  };

  const changeView = (newView: View) => {
    setView(newView);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Appointments</h1>
                  <p className="text-slate-600 text-sm sm:text-base">Manage patient appointments and schedule</p>
                </div>
                <Button 
                  className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto mt-2 sm:mt-0"
                  onClick={() => {
                    setNewAppointment({
                      patientId: '',
                      title: '',
                      date: new Date(),
                      startTime: '09:00',
                      endTime: '10:00',
                    });
                    setShowAppointmentModal(true);
                  }}
                >
                  New Appointment
                </Button>
              </div>
            </div>
            <div className="px-0 sm:px-4 md:px-6 flex flex-col md:grid md:grid-cols-4 gap-4">
              {/* Upcoming appointments card - always on top on mobile */}
              <Card className="mb-4 shadow-none rounded-none md:mb-0 md:shadow md:rounded-lg md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Upcoming</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Today&apos;s appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {todaysAppointments.map(event => (
                      <div key={`today-${event.id}`} className="p-2 border rounded-md">
                        <div className="font-medium text-sm sm:text-base">{event.title}</div>
                        <div className="text-xs sm:text-sm text-slate-500">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          {event.status === 'Scheduled' && (
                            <>
                              <Button 
                                key={`complete-${event.id}`}
                                variant="outline" 
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => handleCompleteAppointment(event.id)}
                              >
                                Complete
                              </Button>
                              <Button 
                                key={`reschedule-${event.id}`}
                                variant="outline" 
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  setSelectedAppointment(event);
                                  setShowEditModal(true);
                                }}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                key={`cancel-${event.id}`}
                                variant="destructive" 
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  handleCancelAppointment(event.id);
                                  console.log(event);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {event.status === 'Finished' && (
                            <Badge key={`completed-${event.id}`} className="bg-green-500 w-full sm:w-auto text-center">Completed</Badge>
                          )}
                          {event.status === 'Cancelled' && (
                            <Badge key={`cancelled-${event.id}`} variant="destructive" className="w-full sm:w-auto text-center">Cancelled</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {todaysAppointments.length === 0 && (
                      <div key="no-appointments" className="text-center py-4 text-slate-500 text-sm">No appointments today</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Main calendar using react-big-calendar */}
              <div className="shadow-none rounded-none md:shadow md:rounded-lg md:col-span-3 h-[350px] md:h-[calc(100vh-250px)] bg-white p-2">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="mb-4 flex flex-row w-full justify-center bg-slate-100 rounded-full shadow-sm p-1 gap-2">
                      <TabsTrigger value="active" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600">Active Appointments</TabsTrigger>
                      <TabsTrigger value="archived" className="flex-1 px-4 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600">Archived Appointments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                      <div className="h-[calc(100vh-250px)] bg-white rounded-none shadow-none md:shadow md:rounded-lg p-2">
                        {/* Responsive navigation: two rows on mobile, one row split on desktop */}
                        <div className="flex flex-col gap-2 justify-center items-center mb-4 w-full md:flex-row md:justify-between md:items-center md:mb-6">
                          {/* Left group: Back, Today, Next */}
                          <div className="flex flex-row gap-2 w-full max-w-xs justify-center md:max-w-none md:w-auto md:justify-start">
                            <Button variant="outline" size="sm" onClick={() => navigate('PREV')} className="flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2">Back</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('TODAY')} className="flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2">Today</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('NEXT')} className="flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2">Next</Button>
                        </div>
                          {/* Right group: Month, Week, Day */}
                          <div className="flex flex-row gap-2 w-full max-w-xs justify-center md:max-w-none md:w-auto md:justify-end mt-2 md:mt-0">
                            {view === Views.MONTH ? (
                              <Popover open={showMonthMenu} onOpenChange={setShowMonthMenu}>
                                <PopoverTrigger asChild>
                          <Button 
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 w-full px-0 py-2 text-xs md:text-base ring-2 ring-violet-200 flex items-center justify-center gap-1 md:w-auto md:px-4 md:py-2`}
                                    onClick={() => setShowMonthMenu((open) => !open)}
                                  >
                                    Month <span className="ml-1">▼</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="center" className="w-48 p-2">
                                  <button
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm"
                                    onClick={() => {
                                      setShowMonthAppointmentsModal(true);
                                      setShowMonthMenu(false);
                                    }}
                                  >
                                    View All Appointments
                                  </button>
                                  <button
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm"
                                    onClick={() => {
                                      setShowAppointmentModal(true);
                                      setShowMonthMenu(false);
                                    }}
                                  >
                                    Create Appointment
                                  </button>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2`}
                            onClick={() => changeView(Views.MONTH)}
                          >
                            Month
                          </Button>
                            )}
                          <Button 
                              variant="outline"
                            onClick={() => changeView(Views.WEEK)}
                              size="sm"
                              className={`flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2 ${view === Views.WEEK ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Week
                          </Button>
                          <Button 
                              variant="outline"
                            onClick={() => changeView(Views.DAY)}
                              size="sm"
                              className={`flex-1 w-full px-0 py-2 text-xs md:text-base md:w-auto md:px-4 md:py-2 ${view === Views.DAY ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Day
                          </Button>
                        </div>
                      </div>
                        <div className="w-full text-center text-xs font-semibold mb-2 md:text-lg">
                          {view === Views.DAY 
                            ? format(date, 'EEEE, MMMM d, yyyy')
                            : format(date, 'MMMM yyyy')}
                        </div>
                    <Calendar
                      localizer={localizer}
                      events={events}
                      startAccessor="start"
                      endAccessor="end"
                        style={{ height: 'calc(100% - 60px)' }}
                      onSelectEvent={handleSelectEvent}
                      onSelectSlot={handleSelectSlot}
                      selectable
                        view={view}
                        onView={changeView}
                        date={date}
                        onNavigate={(newDate) => {
                          setDate(newDate);
                        }}
                        min={new Date(0, 0, 0, 9, 0, 0)}
                        max={new Date(0, 0, 0, 19, 0, 0)}
                        step={30}
                        timeslots={1}
                        formats={{
                          timeGutterFormat: (date) => format(date, 'HH:mm'),
                          eventTimeRangeFormat: ({ start, end }) => 
                            `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
                        }}
                        toolbar={false}
                        popup
                        showMultiDayTimes={false}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="archived">
                      <div className="bg-white rounded-none shadow-none md:shadow md:rounded-lg p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
                          <h2 className="text-base sm:text-xl font-semibold">Archived Appointments</h2>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
                            <Label htmlFor="dateFilter" className="whitespace-nowrap text-xs sm:text-sm">Filter by date:</Label>
                          <Input
                            id="dateFilter"
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value);
                                fetchArchivedAppointments(date);
                              } else {
                                fetchArchivedAppointments(); // Show all when date is cleared
                              }
                            }}
                              className="w-full sm:w-auto max-w-xs"
                          />
                          <Button 
                            variant="outline" 
                              size="sm"
                            onClick={() => {
                              const dateInput = document.getElementById('dateFilter') as HTMLInputElement;
                              if (dateInput) dateInput.value = '';
                              fetchArchivedAppointments();
                            }}
                              className="w-full sm:w-auto"
                          >
                            Show All
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {archivedEvents.length === 0 ? (
                          <p key="no-archived" className="text-gray-500 text-sm">No archived appointments found</p>
                        ) : (
                          archivedEvents.map((event) => (
                            <div
                              key={`archived-${event.id}`}
                              className="p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                                <div>
                                  <div className="font-medium text-sm sm:text-base">{event.title}</div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    Patient&apos;s: {event.patient.firstName} {event.patient.lastName}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    Date: {format(new Date(event.date), 'MMMM d, yyyy')}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    Time: {event.startTime} - {event.endTime}
                                  </div>
                                </div>
                                <Badge key={`archived-badge-${event.id}`} variant="destructive" className="w-full sm:w-auto text-center">Cancelled</Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Appointment Creation Dialog */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Patient</Label>
              <PatientSearch 
                onSelect={(patientId) => {
                    setNewAppointment(prev => ({...prev, patientId}));
                }}
                selectedPatientId={newAppointment.patientId}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Braces Adjustment" 
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50">
                {format(newAppointment.date, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  min="09:00" 
                  max="18:45" 
                  step={900}
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment({...newAppointment, startTime: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  min="09:15" 
                  max="19:00" 
                  step={900}
                  value={newAppointment.endTime}
                  onChange={(e) => setNewAppointment({...newAppointment, endTime: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentModal(false)}>Cancel</Button>
            <Button onClick={handleCreateAppointment}>Create Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Patient</Label>
                <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50">
                  {selectedAppointment.patient.firstName} {selectedAppointment.patient.middleName || ''} {selectedAppointment.patient.lastName}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Appointment Title</Label>
                <Input 
                  id="editTitle" 
                  value={selectedAppointment.title}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    title: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={format(selectedAppointment.start, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    const currentStart = selectedAppointment.start;
                    const currentEnd = selectedAppointment.end;
                    newDate.setHours(currentStart.getHours(), currentStart.getMinutes());
                    const newEnd = new Date(newDate);
                    newEnd.setHours(currentEnd.getHours(), currentEnd.getMinutes());
                    setSelectedAppointment({
                      ...selectedAppointment,
                      start: newDate,
                      end: newEnd
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editStartTime">Start Time</Label>
                  <Input 
                    id="editStartTime" 
                    type="time" 
                    min="09:00" 
                    max="18:45" 
                    step={900}
                    value={format(selectedAppointment.start, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newStart = new Date(selectedAppointment.start);
                      newStart.setHours(parseInt(hours), parseInt(minutes));
                      setSelectedAppointment({
                        ...selectedAppointment,
                        start: newStart
                      });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndTime">End Time</Label>
                  <Input 
                    id="editEndTime" 
                    type="time" 
                    min="09:15" 
                    max="19:00" 
                    step={900}
                    value={format(selectedAppointment.end, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newEnd = new Date(selectedAppointment.end);
                      newEnd.setHours(parseInt(hours), parseInt(minutes));
                      setSelectedAppointment({
                        ...selectedAppointment,
                        end: newEnd
                      });
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50">
                  {selectedAppointment.status}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                setSelectedAppointment(null);
                setShowEditModal(false);
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleUpdateAppointment}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Appointment Notes</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Patient</Label>
                <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50">
                  {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="treatmentNotes">Treatment Notes</Label>
                <Textarea
                  id="treatmentNotes"
                  placeholder="Enter treatment details..."
                  value={appointmentNotes.treatmentNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAppointmentNotes({
                    ...appointmentNotes,
                    treatmentNotes: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reminderNotes">Reminder Notes</Label>
                <Textarea
                  id="reminderNotes"
                  placeholder="Enter any reminders or follow-up notes..."
                  value={appointmentNotes.reminderNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAppointmentNotes({
                    ...appointmentNotes,
                    reminderNotes: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={appointmentNotes.payment.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppointmentNotes({
                    ...appointmentNotes,
                    payment: {
                      ...appointmentNotes.payment,
                      amount: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={appointmentNotes.payment.status}
                  onValueChange={(value: 'Paid' | 'Pending' | 'Partial') => setAppointmentNotes({
                    ...appointmentNotes,
                    payment: {
                      ...appointmentNotes.payment,
                      status: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl text-center">{successMessage}</DialogTitle>
            <p className="text-sm text-gray-500 text-center mt-2">
              The changes have been saved successfully.
            </p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Month Appointments Modal */}
        <Dialog open={showMonthAppointmentsModal} onOpenChange={setShowMonthAppointmentsModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Appointments for {format(date, 'MMMM yyyy')}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto divide-y">
              {monthAppointments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No appointments this month.</div>
              ) : (
                monthAppointments.map(event => (
                  <div key={event.id} className="py-3">
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">{format(event.start, 'EEEE, MMMM d, yyyy h:mm a')}</div>
                    <div className="text-xs text-gray-500">Patient: {event.patient?.firstName} {event.patient?.lastName}</div>
                    <div className="text-xs text-gray-500">Status: {event.status}</div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button className="w-full" onClick={() => setShowMonthAppointmentsModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </SidebarProvider>
  );
} 