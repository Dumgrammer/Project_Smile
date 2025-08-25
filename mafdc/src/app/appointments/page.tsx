'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, isToday } from 'date-fns';
import './appointments.css';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppointments } from '@/hooks/appointments/appointmentHooks';
import { AppointmentNotes } from '@/interface/appointment';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppointmentDialogs } from "./dialog";
import { WeekCalendar } from '@/components/calendar';

type CalendarView = 'month' | 'week' | 'day';

export default function AppointmentsPage() {

  const useAppointmentsHook = useAppointments();
  const getAppointments = useAppointmentsHook.getAppointments;
  const getArchivedAppointments = useAppointmentsHook.getArchivedAppointments;
  const createAppointment = useAppointmentsHook.createAppointment;
  const cancelAppointment = useAppointmentsHook.cancelAppointment;
  const completeAppointment = useAppointmentsHook.completeAppointment;

  const updateAppointment = useAppointmentsHook.updateAppointment;

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
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [view, setView] = useState<CalendarView>('week');
  const [date, setDate] = useState(new Date());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState<AppointmentNotes>({
    treatmentNotes: '',
    reminderNotes: '',
    payment: {
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

    // Prevent creating appointments on past days
    {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDay = new Date(newAppointment.date);
      selectedDay.setHours(0, 0, 0, 0);
      if (selectedDay < today) {
        toast.error("You can't schedule on a past day");
        return;
      }
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
    setIsRescheduling(false);
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      if (isRescheduling) {
        // Handle rescheduling
        const rescheduleData = {
          date: format(selectedAppointment.start, 'yyyy-MM-dd'),
          startTime: format(selectedAppointment.start, 'HH:mm'),
          endTime: format(selectedAppointment.end, 'HH:mm'),
          title: selectedAppointment.title
        };

        await useAppointmentsHook.rescheduleAppointment(selectedAppointment.id, rescheduleData);
        setShowEditModal(false);
        setIsRescheduling(false);
        fetchAppointments();
        toast.success('Appointment rescheduled successfully and email notification sent to patient');
      } else {
        // Handle regular updates
      const updateData: {
        date?: string;
        startTime?: string;
        endTime?: string;
        status?: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
        title?: string;
      } = {};

      // Check if date has changed
      if (selectedAppointment.date) {
        updateData.date = format(selectedAppointment.start, 'yyyy-MM-dd');
      }

      // Check if time has changed
      if (selectedAppointment.startTime) {
        updateData.startTime = format(selectedAppointment.start, 'HH:mm');
      }

      if (selectedAppointment.endTime) {
        updateData.endTime = format(selectedAppointment.end, 'HH:mm');
      }

      // Check if status has changed
      if (selectedAppointment.status) {
        updateData.status = selectedAppointment.status as 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
      }

      // Check if title has changed
      if (selectedAppointment.title) {
        updateData.title = selectedAppointment.title;
      }

      // Use updateAppointment for comprehensive updates including status
      await updateAppointment(selectedAppointment.id, updateData);

      setShowEditModal(false);
      fetchAppointments();
      toast.success('Appointment updated successfully and email notification sent to patient');
      }
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
      // Open notes modal for completion
      setSelectedAppointment(events.find(event => event.id === appointmentId) || null);
      setShowNotesModal(true);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to open completion modal:', err);
      toast.error('Failed to open completion modal');
    }
  };

  const handleRescheduleAppointment = async (appointmentId: string) => {
    try {
      const appointment = events.find(event => event.id === appointmentId);
      if (!appointment) {
        toast.error('Appointment not found');
        return;
      }
      
      // Set the appointment for rescheduling
      setSelectedAppointment(appointment);
      setIsRescheduling(true);
      setShowEditModal(true);
      
      toast.info('Please select a new date and time for the appointment');
    } catch (err) {
      console.error('Failed to open reschedule modal:', err);
      toast.error('Failed to open reschedule modal');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    try {
      // Complete the appointment with notes
      await completeAppointment(selectedAppointment.id, appointmentNotes);
      setShowNotesModal(false);
      setAppointmentNotes({
        treatmentNotes: '',
        reminderNotes: '',
        payment: {
          status: 'Pending'
        }
      });
      fetchAppointments();
      toast.success('Appointment completed and notes saved successfully');
    } catch (err) {
      console.error('Failed to complete appointment with notes:', err);
      toast.error('Failed to complete appointment with notes');
    }
  };

  // Remove unused businessHours and businessDays
  const isWithinBusinessHours = (date: Date) => {
    const hours = date.getHours();
    return hours >= 9 && hours < 17; // 9 AM to 5 PM
  };

  const isPastDay = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(targetDate);
    day.setHours(0, 0, 0, 0);
    return day < today;
  };
  
  // Update handleSelectSlot to use business logic
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (isPastDay(start)) {
      toast.error("You can't schedule on a past day");
      return;
    }
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

  // Visible range helpers for custom calendar
  const startOfWeekMonday = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day + 6) % 7;
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfWeekMonday = (d: Date) => {
    const s = startOfWeekMonday(d);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    e.setMilliseconds(-1);
    return e;
  };
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  const visibleEvents = useMemo(() => {
    if (view === 'day') {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      return events.filter(e => e.start >= start && e.start <= end);
    }
    if (view === 'week') {
      const start = startOfWeekMonday(date);
      const end = endOfWeekMonday(date);
      return events.filter(e => e.start >= start && e.start <= end);
    }
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return events.filter(e => e.start >= start && e.start <= end);
  }, [events, date, view]);

  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    
    switch (action) {
      case 'PREV':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === 'week') {
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

  const changeView = (newView: CalendarView) => {
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
                  id="tour-new-apt"
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
            <div className="px-2 sm:px-4 lg:px-6 flex flex-col lg:grid lg:grid-cols-5 xl:grid-cols-4 gap-4">
              {/* Upcoming appointments card - responsive sidebar */}
              <Card id="tour-today-schedule" className="mb-4 shadow-sm rounded-lg lg:mb-0 lg:col-span-1 dark:bg-[#0b1020] dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base lg:text-lg">Today&apos;s Schedule</CardTitle>
                  <CardDescription className="text-xs lg:text-sm">Upcoming appointments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] lg:max-h-[calc(100vh-350px)] overflow-y-auto">
                    {todaysAppointments.map(event => (
                    <div key={`today-${event.id}`} className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="font-medium text-sm lg:text-base text-violet-700 mb-1">{event.title}</div>
                      <div className="text-xs lg:text-sm text-slate-600 mb-2">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                      <div className="flex flex-wrap gap-1">
                          {(event.status === 'Scheduled' || event.status === 'Rescheduled') && (
                            <>
                              <Button 
                                key={`complete-${event.id}`}
                                variant="outline" 
                                size="sm"
                              className="text-xs px-2 py-1 h-7"
                                onClick={() => handleCompleteAppointment(event.id)}
                              >
                                Complete
                              </Button>
                              <Button 
                                key={`reschedule-${event.id}`}
                                variant="outline" 
                                size="sm"
                              className="text-xs px-2 py-1 h-7"
                              onClick={() => handleRescheduleAppointment(event.id)}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                key={`cancel-${event.id}`}
                                variant="destructive" 
                                size="sm"
                              className="text-xs px-2 py-1 h-7"
                                onClick={() => {
                                  handleCancelAppointment(event.id);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {event.status === 'Finished' && (
                          <Badge key={`completed-${event.id}`} className="bg-green-500 text-xs">Completed</Badge>
                          )}
                          {event.status === 'Cancelled' && (
                          <Badge key={`cancelled-${event.id}`} variant="destructive" className="text-xs">Cancelled</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {todaysAppointments.length === 0 && (
                    <div key="no-appointments" className="text-center py-8 text-slate-500 text-sm">
                      <div className="text-2xl mb-2">📅</div>
                      <div>No appointments today</div>
                  </div>
                  )}
                </CardContent>
              </Card>
              {/* Main calendar using react-big-calendar */}
              <div className="shadow-sm rounded-lg lg:col-span-4 xl:col-span-3 h-[400px] sm:h-[500px] lg:h-[calc(100vh-200px)] bg-white dark:bg-[#0b1020]">
                <Tabs defaultValue="active" className="w-full h-full flex flex-col">
                    <TabsList className="mb-4 flex flex-row w-full max-w-md mx-auto justify-center bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm p-1">
                      <TabsTrigger value="active" className="flex-1 px-3 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">Active</TabsTrigger>
                      <TabsTrigger value="archived" className="flex-1 px-3 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">Archived</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="flex-1 flex flex-col">
                      <div className="flex-1 bg-white dark:bg-[#0b1020] rounded-lg shadow-sm border dark:border-slate-700 p-3 sm:p-4">
                        {/* Compact responsive navigation */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
                          {/* Navigation controls */}
                          <div id="tour-nav-controls" className="flex gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate('PREV')} className="px-3 py-1.5 text-xs sm:text-sm">← Back</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('TODAY')} className="px-3 py-1.5 text-xs sm:text-sm">Today</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('NEXT')} className="px-3 py-1.5 text-xs sm:text-sm">Next →</Button>
                        </div>
                          {/* View controls */}
                          <div id="tour-view-controls" className="flex gap-1 sm:gap-2">
                            {view === 'month' ? (
                              <Popover open={showMonthMenu} onOpenChange={setShowMonthMenu}>
                                <PopoverTrigger asChild>
                          <Button 
                                    variant="outline"
                                    size="sm"
                                    className="px-3 py-1.5 text-xs sm:text-sm ring-2 ring-violet-200 flex items-center gap-1"
                                    onClick={() => setShowMonthMenu((open) => !open)}
                                  >
                                    Month <span className="text-xs">▼</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-48 p-2">
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
                                className="px-3 py-1.5 text-xs sm:text-sm"
                            onClick={() => changeView('month')}
                          >
                            Month
                          </Button>
                            )}
                          <Button 
                              variant="outline"
                            onClick={() => changeView('week')}
                              size="sm"
                              className={`px-3 py-1.5 text-xs sm:text-sm ${view === 'week' ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Week
                          </Button>
                          <Button 
                              variant="outline"
                            onClick={() => changeView('day')}
                              size="sm"
                              className={`px-3 py-1.5 text-xs sm:text-sm ${view === 'day' ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Day
                          </Button>
                        </div>
                      </div>
                        <div className="w-full text-center text-sm sm:text-lg font-semibold mb-3 text-violet-700">
                          {view === 'day' 
                            ? format(date, 'EEEE, MMMM d, yyyy')
                            : format(date, 'MMMM yyyy')}
                        </div>
                        <div id="tour-calendar" className="flex-1 min-h-0 w-full">
                    {view !== 'month' ? (
                      <WeekCalendar
                        date={date}
                        events={visibleEvents.map(e => ({ id: e.id, title: e.title, start: e.start, end: e.end }))}
                        daysCount={view === 'day' ? 1 : 7}
                        onSlotClick={(start, end) => handleSelectSlot({ start, end })}
                        onEventClick={(ev) => {
                          const found = visibleEvents.find(e => e.id === ev.id) || events.find(e => e.id === ev.id);
                          if (found) handleSelectEvent(found as any);
                        }}
                      />
                    ) : (
                      <div className="grid grid-cols-7 gap-[1px] bg-slate-200 dark:bg-slate-700 h-full rounded">
                        {(() => {
                          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                          const startWeekday = (firstDay.getDay() + 6) % 7;
                          const firstCell = new Date(firstDay);
                          firstCell.setDate(firstCell.getDate() - startWeekday);
                          return Array.from({ length: 42 }, (_, i) => {
                          const d = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + i);
                          const dayEvents = visibleEvents.filter(e => e.start.getFullYear() === d.getFullYear() && e.start.getMonth() === d.getMonth() && e.start.getDate() === d.getDate());
                          const isOtherMonth = d.getMonth() !== date.getMonth();
                          return (
                            <div key={i} className={`bg-white dark:bg-[#0b1020] p-2 text-xs border dark:border-slate-800 ${isOtherMonth ? 'opacity-50' : ''}`} onClick={() => { setDate(d); setView('day'); }}>
                              <div className="text-right text-slate-500 dark:text-slate-400 mb-1">{d.getDate()}</div>
                              <div className="space-y-1 max-h-28 overflow-auto">
                                {dayEvents.map(ev => (
                                  <div key={ev.id} className="rounded px-2 py-1 bg-violet-600/90 text-white truncate">
                                    {ev.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                          });
                        })()}
                      </div>
                    )}
                        </div>
                    </div>
                  </TabsContent>

                  <TabsContent id="tour-archived" value="archived" className="flex-1 flex flex-col">
                      <div className="flex-1 bg-white dark:bg-[#0b1020] rounded-lg shadow-sm border dark:border-slate-700 p-3 sm:p-4 flex flex-col">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
                          <h2 className="text-lg sm:text-xl font-semibold text-violet-700">Archived Appointments</h2>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <Label htmlFor="dateFilter" className="text-xs sm:text-sm text-slate-600">Filter by date:</Label>
                            <div className="flex gap-2">
                          <Input
                            id="dateFilter"
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value);
                                fetchArchivedAppointments(date);
                              } else {
                                    fetchArchivedAppointments();
                              }
                            }}
                                className="w-full sm:w-auto max-w-[200px]"
                          />
                          <Button 
                            variant="outline" 
                              size="sm"
                            onClick={() => {
                              const dateInput = document.getElementById('dateFilter') as HTMLInputElement;
                              if (dateInput) dateInput.value = '';
                              fetchArchivedAppointments();
                            }}
                                className="px-3 py-1.5 text-xs sm:text-sm"
                          >
                                Clear
                          </Button>
                        </div>
                      </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                        {archivedEvents.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="text-4xl mb-3">📋</div>
                              <p className="text-slate-500 text-sm">No archived appointments found</p>
                            </div>
                        ) : (
                          archivedEvents.map((event) => (
                            <div
                              key={`archived-${event.id}`}
                              className="p-3 sm:p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/40 dark:border-slate-700 transition-colors"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm sm:text-base text-violet-700 dark:text-violet-300 mb-1">{event.title}</div>
                                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-0.5">
                                      <div>Patient: {event.patient.firstName} {event.patient.lastName}</div>
                                      <div>Date: {format(new Date(event.date), 'MMMM d, yyyy')}</div>
                                      <div>Time: {event.startTime} - {event.endTime}</div>
                                  </div>
                                  </div>
                                  <Badge key={`archived-badge-${event.id}`} variant="destructive" className="self-start text-xs">Cancelled</Badge>
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

      <AppointmentDialogs
        // Appointment Creation Dialog
        showAppointmentModal={showAppointmentModal}
        setShowAppointmentModal={setShowAppointmentModal}
        newAppointment={newAppointment}
        setNewAppointment={setNewAppointment}
        handleCreateAppointment={handleCreateAppointment}

        // Edit Appointment Modal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedAppointment={selectedAppointment}
        setSelectedAppointment={setSelectedAppointment}
        isRescheduling={isRescheduling}
        setIsRescheduling={setIsRescheduling}
        handleUpdateAppointment={handleUpdateAppointment}

        // Notes Modal
        showNotesModal={showNotesModal}
        setShowNotesModal={setShowNotesModal}
        appointmentNotes={appointmentNotes}
        setAppointmentNotes={setAppointmentNotes}
        handleSaveNotes={handleSaveNotes}

        // Success Modal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        successMessage={successMessage}

        // Month Appointments Modal
        showMonthAppointmentsModal={showMonthAppointmentsModal}
        setShowMonthAppointmentsModal={setShowMonthAppointmentsModal}
        monthAppointments={monthAppointments}
        date={date}
      />

    </SidebarProvider>
  );
} 