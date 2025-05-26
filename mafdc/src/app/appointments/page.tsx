'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, parse, startOfWeek, getDay, isToday, parseISO } from 'date-fns';
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
import { useAppointments } from '@/hooks/appointments/appointmentHooks';
import { PatientSearch } from "@/components/patient-search";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname } from 'next/navigation';

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

const CustomToolbar = (toolbar: any) => {
  const goToToday = () => {
    toolbar.onNavigate('TODAY');
  };

  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToView = (view: string) => {
    toolbar.onView(view);
  };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={goToBack}>
          Back
        </button>
        <button type="button" onClick={goToToday}>
          Today
        </button>
        <button type="button" onClick={goToNext}>
          Next
        </button>
      </span>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
      <span className="rbc-btn-group">
        <button
          type="button"
          className={toolbar.view === 'month' ? 'rbc-active' : ''}
          onClick={() => goToView('month')}
        >
          Month
        </button>
        <button
          type="button"
          className={toolbar.view === 'week' ? 'rbc-active' : ''}
          onClick={() => goToView('week')}
        >
          Week
        </button>
        <button
          type="button"
          className={toolbar.view === 'day' ? 'rbc-active' : ''}
          onClick={() => goToView('day')}
        >
          Day
        </button>
      </span>
    </div>
  );
};

export default function AppointmentsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    loading, 
    error, 
    getAppointments, 
    createAppointment, 
    updateAppointment, 
    cancelAppointment,
    getArchivedAppointments
  } = useAppointments();

  const [events, setEvents] = useState<any[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<any[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    title: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [pathname]);

  useEffect(() => {
    fetchAppointments();
    fetchArchivedAppointments();
  }, [key]);

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      
      if (!response || !Array.isArray(response)) {
        console.error('Invalid appointments response:', response);
        toast.error('Failed to fetch appointments: Invalid response format');
        return;
      }

      const formattedEvents = response.map((apt: any) => {
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
        };
      });
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      toast.error('Failed to fetch appointments');
    }
  };

  const fetchArchivedAppointments = async (date?: Date) => {
    try {
      const response = await getArchivedAppointments(
        date ? { date: format(date, 'yyyy-MM-dd') } : undefined
      );
      setArchivedEvents(response);
    } catch (err) {
      console.error('Failed to fetch archived appointments:', err);
      toast.error('Failed to fetch archived appointments');
    }
  };

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
      
      toast.success('Appointment created successfully');
      setShowAppointmentModal(false);
      fetchAppointments(); // Refresh the appointments list
    } catch (err) {
      console.error('Failed to create appointment:', err);
      toast.error('Failed to create appointment');
    }
  };
  
  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event);
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await updateAppointment(selectedAppointment.id, {
        date: format(selectedAppointment.start, 'yyyy-MM-dd'),
        startTime: format(selectedAppointment.start, 'HH:mm'),
        endTime: format(selectedAppointment.end, 'HH:mm'),
        title: selectedAppointment.title,
      });
      
      toast.success('Appointment updated successfully');
      setShowEditModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to update appointment:', err);
      toast.error('Failed to update appointment');
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await cancelAppointment(selectedAppointment.id);
      toast.success('Appointment cancelled successfully');
      setShowEditModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      toast.error('Failed to cancel appointment');
    }
  };

  // Custom business hours - clinic is closed on Wednesdays
  const businessHours = {
    start: new Date(0, 0, 0, 9, 0), // 9:00 AM
    end: new Date(0, 0, 0, 19, 0),  // 7:00 PM
  };

  // Define business days (all days except Wednesday)
  const businessDays = useMemo(() => [0, 1, 2, 3, 4, 5, 6], []);

  // Check if a date is within business hours
  const isWithinBusinessHours = (date: Date) => {
    const hours = date.getHours();
    return hours >= 9 && hours < 19; // Between 9am and 7pm
  };
  
  // Update handleSelectSlot to use business logic
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!isWithinBusinessHours(start) || !isWithinBusinessHours(end)) {
      toast.error('Please select a time between 9:00 AM and 7:00 PM.');
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
                <div className="flex justify-between items-center mb-4">
                  <div>
                  <h1 className="text-3xl font-bold">Appointments</h1>
                  <p className="text-slate-600">Manage patient appointments and schedule</p>
                  </div>
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700"
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
              <div className="px-4 lg:px-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Left sidebar with upcoming appointments */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Upcoming</CardTitle>
                    <CardDescription>Today's appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                    {todaysAppointments.map(event => (
                          <div key={event.id} className="p-2 border rounded-md">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-slate-500">
                              {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                            </div>
                          </div>
                        ))}
                    {todaysAppointments.length === 0 && (
                        <div className="text-center py-4 text-slate-500">No appointments today</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              {/* Main calendar using react-big-calendar */}
              <div className="md:col-span-3 h-[calc(100vh-250px)] bg-white rounded-lg shadow p-2">
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">Active Appointments</TabsTrigger>
                    <TabsTrigger value="archived">Archived Appointments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <div className="h-[calc(100vh-250px)] bg-white rounded-lg shadow p-2">
                      <div className="flex justify-between items-center mb-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => navigate('PREV')}>
                            Back
                          </Button>
                          <Button variant="outline" onClick={() => navigate('TODAY')}>
                            Today
                          </Button>
                          <Button variant="outline" onClick={() => navigate('NEXT')}>
                            Next
                          </Button>
                        </div>
                        <div className="text-lg font-semibold">
                          {view === Views.DAY 
                            ? format(date, 'EEEE, MMMM d, yyyy')
                            : format(date, 'MMMM yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant={view === Views.MONTH ? 'default' : 'outline'} 
                            onClick={() => changeView(Views.MONTH)}
                          >
                            Month
                          </Button>
                          <Button 
                            variant={view === Views.WEEK ? 'default' : 'outline'} 
                            onClick={() => changeView(Views.WEEK)}
                          >
                            Week
                          </Button>
                          <Button 
                            variant={view === Views.DAY ? 'default' : 'outline'} 
                            onClick={() => changeView(Views.DAY)}
                          >
                            Day
                          </Button>
                        </div>
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
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Archived Appointments</h2>
                        <div className="flex items-center gap-4">
                          <Label htmlFor="dateFilter" className="whitespace-nowrap">Filter by date:</Label>
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
                            className="max-w-xs"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const dateInput = document.getElementById('dateFilter') as HTMLInputElement;
                              if (dateInput) dateInput.value = '';
                              fetchArchivedAppointments();
                            }}
                          >
                            Show All
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {archivedEvents.length === 0 ? (
                          <p className="text-gray-500">No archived appointments found</p>
                        ) : (
                          archivedEvents.map((event) => (
                            <div
                              key={event._id}
                              className="p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-gray-500">
                                    Patient: {event.patient.firstName} {event.patient.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Date: {format(new Date(event.date), 'MMMM d, yyyy')}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Time: {event.startTime} - {event.endTime}
                                  </div>
                                </div>
                                <Badge variant="destructive">Cancelled</Badge>
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
                  console.log('Selected patient ID:', patientId);
                  setNewAppointment(prev => {
                    const updated = {...prev, patientId};
                    console.log('Updated appointment state:', updated);
                    return updated;
                  });
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
                    
                    // Preserve the time when changing the date
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
              onClick={handleCancelAppointment}
              disabled={selectedAppointment?.status === 'Cancelled'}
            >
              Cancel Appointment
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Close
              </Button>
              <Button onClick={handleUpdateAppointment}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
} 