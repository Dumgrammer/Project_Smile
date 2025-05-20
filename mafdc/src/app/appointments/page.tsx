'use client';

import { useState, useMemo } from 'react';
import { format, parse, startOfWeek, getDay, isWednesday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
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

const initialAppointments = [
  {
    id: 1,
    title: 'Braces Adjustment - Karl Lacap',
    start: new Date("2025-05-20T09:00:00"),
    end: new Date("2025-05-20T10:00:00"),
    allDay: false,
  },
  {
    id: 2,
    title: 'Consultation - Ma. Cattleya Crisolo',
    start: new Date(2023, 5, 15, 11, 0),
    end: new Date(2023, 5, 15, 12, 0),
    allDay: false,
  },
  {
    id: 3,
    title: 'Braces Removal - Keith Lacap',
    start: new Date(2023, 5, 16, 14, 0),
    end: new Date(2023, 5, 16, 15, 30),
    allDay: false,
  },
];

export default function AppointmentsPage() {
  const [events, setEvents] = useState(initialAppointments);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
  });

  // Add new appointment
  const handleCreateAppointment = () => {
    if (!newAppointment.title) {
      window.alert('Please enter an appointment title.');
      return;
    }
    const startDateTime = new Date(newAppointment.date);
    const [startHour, startMinute] = newAppointment.startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    // Always use the same date for end
    const endDateTime = new Date(newAppointment.date);
    const [endHour, endMinute] = newAppointment.endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // If end time is 00:00, set it to 23:59 instead (or show an error)
    if (endHour === 0 && endMinute === 0) {
      endDateTime.setHours(23, 59, 59, 999);
    }

    // Validation: end must be after start and on the same day
    if (
      endDateTime <= startDateTime ||
      startDateTime.toDateString() !== endDateTime.toDateString()
    ) {
      window.alert('End time must be after start time and on the same day.');
      return;
    }

    // Check for overlap
    const hasOverlap = events.some(event => {
      return (
        event.start instanceof Date &&
        event.start.toDateString() === startDateTime.toDateString() &&
        (startDateTime < event.end && endDateTime > event.start)
      );
    });

    if (hasOverlap) {
      window.alert('This time slot is already occupied by another appointment.');
      return;
    }

    setEvents([
      ...events,
      {
        id: events.length + 1,
        title: newAppointment.title,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
      },
    ]);
    setShowAppointmentModal(false);
  };

  const handleSelectEvent = (event: any) => {
    window.alert(`Selected appointment: ${event.title}`);
  };

  // Custom business hours - clinic is closed on Wednesdays
  const businessHours = {
    start: new Date(0, 0, 0, 9, 0), // 9:00 AM
    end: new Date(0, 0, 0, 19, 0),  // 7:00 PM
  };

  // Define business days (all days except Wednesday)
  const businessDays = useMemo(() => [0, 1, 2, 4, 5, 6], []);

  // Check if a date is within business hours
  const isWithinBusinessHours = (date: Date) => {
    if (isWednesday(date)) {
      return false; // Clinic is closed on Wednesdays
    }
    const hours = date.getHours();
    return hours >= 9 && hours < 19; // Between 9am and 7pm
  };

  // Update handleSelectSlot to use business logic
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (isWednesday(start)) {
      window.alert('The clinic is closed on Wednesdays.');
      return;
    }
    if (!isWithinBusinessHours(start) || !isWithinBusinessHours(end)) {
      window.alert('Please select a time between 9:00 AM and 7:00 PM.');
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

  console.log(events.map(e => ({
    title: e.title,
    start: e.start.toString(),
    end: e.end.toString()
  })));

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
                    {events
                      .filter(event => 
                        event.start instanceof Date &&
                        event.start.getDate() === new Date().getDate() &&
                        event.start.getMonth() === new Date().getMonth() &&
                        event.start.getFullYear() === new Date().getFullYear()
                      )
                      .map(event => (
                        <div key={event.id} className="p-2 border rounded-md">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-slate-500">
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                        </div>
                      ))}
                    {events.filter(event => 
                      event.start instanceof Date &&
                      event.start.getDate() === new Date().getDate() &&
                      event.start.getMonth() === new Date().getMonth() &&
                      event.start.getFullYear() === new Date().getFullYear()
                    ).length === 0 && (
                      <div className="text-center py-4 text-slate-500">No appointments today</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Main calendar using react-big-calendar */}
              <div className="md:col-span-3 h-[calc(100vh-250px)] bg-white rounded-lg shadow p-2">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  selectable
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                  defaultView={Views.WEEK}
                  step={30}
                  timeslots={1}
                  style={{ height: '100%' }}
                  popup
                  min={businessHours.start}
                  max={businessHours.end}
                  showMultiDayTimes={false}
                />
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
              <Label htmlFor="title">Appointment Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Braces Adjustment - Patient Name" 
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
    </SidebarProvider>
  );
} 