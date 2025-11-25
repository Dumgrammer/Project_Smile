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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppointments } from '@/hooks/appointments/appointmentHooks';
import { AppointmentNotes, AppointmentEvent } from '@/interface/appointment';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppointmentDialogs } from "./dialog";
import { WeekCalendar } from '@/components/calendar';
import Cookies from 'js-cookie';
import AuthGuard from '@/components/AuthGuard';

type CalendarView = 'month' | 'week' | 'day';

interface AdminData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AppointmentsPage() {
  const useAppointmentsHook = useAppointments();
  const getAppointments = useAppointmentsHook.getAppointments;
  const getArchivedAppointments = useAppointmentsHook.getArchivedAppointments;
  const createAppointment = useAppointmentsHook.createAppointment;
  const cancelAppointment = useAppointmentsHook.cancelAppointment;
  const completeAppointment = useAppointmentsHook.completeAppointment;
  const getAppointmentNotes = useAppointmentsHook.getAppointmentNotes;

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
  const [finishedEvents, setFinishedEvents] = useState<Array<{
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
  const [view, setView] = useState<CalendarView>('week'); // Always start with 'week' to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [remarkedAppointments, setRemarkedAppointments] = useState<Set<string>>(new Set());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [superadminTabInitialized, setSuperadminTabInitialized] = useState(false);
  const [viewManuallySet, setViewManuallySet] = useState(false);

  const isSuperadmin = adminData?.role?.toLowerCase() === 'superadmin';

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
        patient?: {
          firstName: string;
          middleName?: string;
          lastName: string;
        } | null;
      }) => {
        // Parse the ISO date string
        const appointmentDate = new Date(apt.date);
        const dateStr = format(appointmentDate, 'yyyy-MM-dd');
        // Create start and end dates by combining date and time
        const start = new Date(`${dateStr}T${apt.startTime}`);
        const end = new Date(`${dateStr}T${apt.endTime}`);

        const hasPatient = !!apt.patient;
        const safePatient = apt.patient || { firstName: 'Unknown', lastName: 'Patient' } as {
          firstName: string;
          middleName?: string;
          lastName: string;
        };

        return {
          id: apt._id,
          title: hasPatient ? `${apt.title} - ${safePatient.firstName} ${safePatient.lastName}` : apt.title,
          start,
          end,
          allDay: false,
          status: apt.status,
          patient: hasPatient ? safePatient : { firstName: 'Unknown', lastName: 'Patient' },
          date: dateStr,
          startTime: apt.startTime,
          endTime: apt.endTime
        };
      });
      
      setEvents(formattedEvents);
      
      // Check for existing notes on today's Finished appointments (async, non-blocking)
      formattedEvents.forEach(async (event) => {
        if (event.status === 'Finished' && isToday(event.start)) {
          try {
            const notes = await getAppointmentNotes(event.id);
            if (notes && (notes.treatmentNotes || notes.reminderNotes)) {
              setRemarkedAppointments(prev => new Set(prev).add(event.id));
            }
          } catch {
            // If notes don't exist or error, assume no notes
          }
        }
      });
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      toast.error('Failed to fetch appointments');
    }
  }, [getAppointments, getAppointmentNotes, setEvents]);

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
          patient?: {
            firstName: string;
            middleName?: string;
            lastName: string;
          } | null;
        }) => {
          const appointmentDate = new Date(apt.date);
          const dateStr = format(appointmentDate, 'yyyy-MM-dd');
          const start = new Date(`${dateStr}T${apt.startTime}`);
          const end = new Date(`${dateStr}T${apt.endTime}`);

          const hasPatient = !!apt.patient;
          const safePatient = apt.patient || { firstName: 'Unknown', lastName: 'Patient' } as {
            firstName: string;
            middleName?: string;
            lastName: string;
          };

          return {
            id: apt._id,
            title: hasPatient ? `${apt.title} - ${safePatient.firstName} ${safePatient.lastName}` : apt.title,
            start,
            end,
            allDay: false,
            status: apt.status,
            patient: hasPatient ? safePatient : { firstName: 'Unknown', lastName: 'Patient' },
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

  // Fetch finished appointments from API
  const fetchFinishedAppointments = useCallback(async (date?: Date) => {
    try {
      const response = await getAppointments(
        date ? { date: format(date, 'yyyy-MM-dd'), status: 'Finished' } : { status: 'Finished' }
      );
      if (Array.isArray(response)) {
        const formattedFinishedEvents = response.map((apt: {
          _id: string;
          title: string;
          date: string;
          startTime: string;
          endTime: string;
          status: string;
          patient?: {
            firstName: string;
            middleName?: string;
            lastName: string;
          } | null;
        }) => {
          const appointmentDate = new Date(apt.date);
          const dateStr = format(appointmentDate, 'yyyy-MM-dd');
          const start = new Date(`${dateStr}T${apt.startTime}`);
          const end = new Date(`${dateStr}T${apt.endTime}`);

          const hasPatient = !!apt.patient;
          const safePatient = apt.patient || { firstName: 'Unknown', lastName: 'Patient' } as {
            firstName: string;
            middleName?: string;
            lastName: string;
          };

          return {
            id: apt._id,
            title: hasPatient ? `${apt.title} - ${safePatient.firstName} ${safePatient.lastName}` : apt.title,
            start,
            end,
            allDay: false,
            status: apt.status,
            patient: hasPatient ? safePatient : { firstName: 'Unknown', lastName: 'Patient' },
            date: dateStr,
            startTime: apt.startTime,
            endTime: apt.endTime
          };
        });
        setFinishedEvents(formattedFinishedEvents);
      }
    } catch (err) {
      console.error('Failed to fetch finished appointments:', err);
      toast.error('Failed to fetch finished appointments');
    }
  }, [getAppointments]);

  // Memoize the loadData function to prevent it from changing on every render
  const loadData = useCallback(async () => {
    await fetchAppointments();
    await fetchArchivedAppointments();
    await fetchFinishedAppointments();
  }, [fetchAppointments, fetchArchivedAppointments, fetchFinishedAppointments]);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      setIsBootstrapping(true);
      await loadData();
      if (isMounted) {
        setIsBootstrapping(false);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
      setEvents([]);
      setArchivedEvents([]);
    };
  }, [loadData]); // Now we only depend on the memoized loadData function

  // Get admin data from cookies
  useEffect(() => {
    const adminDataStr = Cookies.get('adminData');
    if (adminDataStr) {
      try {
        const data = JSON.parse(adminDataStr);
        setAdminData(data);
      } catch (error) {
        console.error('Error parsing admin data', error);
      }
    }
  }, []);

  // Handle initial responsive view and resize changes
  useEffect(() => {
    setMounted(true);
    
    // Set initial view based on screen size after mounting (only once)
    if (!viewManuallySet) {
      if (window.innerWidth < 1024) {
        setView('day');
      } else {
        setView('week');
      }
    }
    
    const handleResize = () => {
      // Only auto-adjust if user hasn't manually set the view
      if (!viewManuallySet) {
        if (window.innerWidth < 1024 && view !== 'day') {
          setView('day');
        } else if (window.innerWidth >= 1024 && view === 'day') {
          setView('week');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view, viewManuallySet]);

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
        toast.error("You can&apos;t schedule on a past day");
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

    console.log('Starting appointment update for ID:', selectedAppointment.id);
    console.log('Selected appointment:', selectedAppointment);

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
        // Handle regular updates - check if date/time has changed
        const originalAppointment = events.find(e => e.id === selectedAppointment.id);
        
        const updateData: {
          date?: string;
          startTime?: string;
          endTime?: string;
          status?: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
          title?: string;
        } = {};

        // Check if date or time has changed
        const newDate = format(selectedAppointment.start, 'yyyy-MM-dd');
        const newStartTime = format(selectedAppointment.start, 'HH:mm');
        const newEndTime = format(selectedAppointment.end, 'HH:mm');
        
        const originalDate = originalAppointment ? format(originalAppointment.start, 'yyyy-MM-dd') : '';
        const originalStartTime = originalAppointment ? format(originalAppointment.start, 'HH:mm') : '';
        const originalEndTime = originalAppointment ? format(originalAppointment.end, 'HH:mm') : '';

        // If date/time changed, include them in update (this will trigger rescheduling logic)
        if (newDate !== originalDate || newStartTime !== originalStartTime || newEndTime !== originalEndTime) {
          updateData.date = newDate;
          updateData.startTime = newStartTime;
          updateData.endTime = newEndTime;
        }

        updateData.status = selectedAppointment.status as 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled';
        updateData.title = selectedAppointment.title;

        console.log('Updating appointment with data:', updateData);
        console.log('Date/time changed:', newDate !== originalDate || newStartTime !== originalStartTime || newEndTime !== originalEndTime);

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
    setAppointmentToCancel(appointmentId);
    setShowCancelDialog(true);
    setShowEditModal(false); // Close edit modal if open
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      await cancelAppointment(appointmentToCancel, cancelReason.trim());
      setShowCancelDialog(false);
      setAppointmentToCancel(null);
      setCancelReason('');
      fetchAppointments();
      toast.success('Appointment cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const appointment = events.find(event => event.id === appointmentId);
      if (!appointment) {
        toast.error('Appointment not found');
        return;
      }

      // Check user role
      const userRole = adminData?.role?.toLowerCase();
      
      if (userRole === 'superadmin') {
        // Superadmin completes appointment (just status update, no notes)
        await updateAppointment(appointmentId, {
          status: 'Finished'
        });
        setShowEditModal(false);
        fetchAppointments();
        toast.success('Appointment completed successfully');
      } else {
        // Admin finishes appointment (with treatment notes, reminder notes, payment status)
        setSelectedAppointment(appointment);
        setShowNotesModal(true);
        setShowEditModal(false);
      }
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      toast.error('Failed to complete appointment');
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

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      const updateData = {
        status: 'Scheduled' as const
      };
      
      await updateAppointment(appointmentId, updateData);
      fetchAppointments();
      toast.success('Appointment approved successfully and email notification sent to patient');
    } catch (err) {
      console.error('Failed to approve appointment:', err);
      toast.error('Failed to approve appointment');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    try {
      // Complete the appointment with notes - automatically set payment status to Paid
      const notesWithPaidStatus = {
        ...appointmentNotes,
        payment: {
          status: 'Paid' as const
        }
      };
      await completeAppointment(selectedAppointment.id, notesWithPaidStatus);
      
      // Mark this appointment as remarked
      setRemarkedAppointments(prev => new Set(prev).add(selectedAppointment.id));
      
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
    // Superadmin cannot create appointments
    if (adminData?.role?.toLowerCase() === 'superadmin') {
      return;
    }

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
  
  // Get today's appointments (filter out appointments outside business hours and remarked appointments)
  const todaysAppointments = useMemo(() => {
    return events.filter(event => 
      event.start instanceof Date && 
      isToday(event.start) &&
      isWithinBusinessHours(event.start) && // Only show appointments within business hours
      !remarkedAppointments.has(event.id) // Filter out appointments that have been remarked
    );
  }, [events, remarkedAppointments]);

  // Upcoming appointments for superadmin (next appointments excluding today)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return events
      .filter(event => 
        event.start instanceof Date &&
        event.start > now &&
        isWithinBusinessHours(event.start) &&
        event.status !== 'Cancelled' &&
        !(event.status === 'Finished' && remarkedAppointments.has(event.id))
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 10);
  }, [events, remarkedAppointments]);

  // Get all appointments for the current month (filter out appointments outside business hours)
  const monthAppointments = useMemo(() => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return events.filter(event => {
      return event.start.getMonth() === month && 
             event.start.getFullYear() === year &&
             isWithinBusinessHours(event.start); // Only show appointments within business hours
    });
  }, [events, date]);

  // Visible range helpers for custom calendar
  const startOfWeekMonday = useCallback((d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day + 6) % 7;
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  }, []);
  const endOfWeekMonday = useCallback((d: Date) => {
    const s = startOfWeekMonday(d);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    e.setMilliseconds(-1);
    return e;
  }, [startOfWeekMonday]);
  const startOfMonth = useCallback((d: Date) => new Date(d.getFullYear(), d.getMonth(), 1), []);
  const endOfMonth = useCallback((d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999), []);

  // State to track active tab
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'finished'>('active');

  useEffect(() => {
    if (isSuperadmin && !superadminTabInitialized) {
      setActiveTab('finished');
      setSuperadminTabInitialized(true);
    }
  }, [isSuperadmin, superadminTabInitialized]);

  const visibleEvents = useMemo(() => {
    // Only show events in active tab (exclude Finished and Cancelled)
    // Finished and Archived tabs show list views, not calendar
    if (activeTab !== 'active') {
      return [];
    }

    // Active tab: exclude Finished and Cancelled
    const statusFilteredEvents = events.filter(e => 
      e.status !== 'Cancelled' && !(e.status === 'Finished' && remarkedAppointments.has(e.id))
    );

    let filteredEvents;
    if (view === 'day') {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      filteredEvents = statusFilteredEvents.filter(e => e.start >= start && e.start <= end);
    } else if (view === 'week') {
      const start = startOfWeekMonday(date);
      const end = endOfWeekMonday(date);
      filteredEvents = statusFilteredEvents.filter(e => e.start >= start && e.start <= end);
    } else {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      filteredEvents = statusFilteredEvents.filter(e => e.start >= start && e.start <= end);
    }
    
    // Filter out appointments outside business hours
    return filteredEvents.filter(e => isWithinBusinessHours(e.start));
  }, [events, activeTab, date, view, startOfWeekMonday, endOfWeekMonday, startOfMonth, endOfMonth, remarkedAppointments]);

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
    setViewManuallySet(true);
  };

  return (
    <AuthGuard>
      <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-2 relative">
          {isBootstrapping && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
              <p className="mt-4 text-sm text-slate-500">Loading appointments...</p>
            </div>
          )}
          <div className={`flex flex-col gap-4 py-4 md:gap-6 md:py-6 transition-opacity duration-300 ${isBootstrapping ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}>
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Appointments</h1>
                  <p className="text-slate-600 text-sm sm:text-base">Manage patient appointments and schedule</p>
                </div>
                {!isSuperadmin && (
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
                )}
              </div>
            </div>
            <div className={`px-2 sm:px-4 lg:px-6 flex flex-col ${isSuperadmin ? 'lg:grid lg:grid-cols-2' : 'lg:grid lg:grid-cols-5 xl:grid-cols-4'} gap-4`}>
              {/* Today's appointments card */}
              <Card
                id="tour-today-schedule"
                className={`mb-4 shadow-sm rounded-lg lg:mb-0 ${
                  isSuperadmin ? 'border-2 border-violet-500' : 'lg:col-span-1'
                } dark:bg-[#0b1020] dark:border-slate-700`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base lg:text-lg">Today&apos;s Schedule</CardTitle>
                  <CardDescription className="text-xs lg:text-sm">Upcoming appointments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] lg:max-h-[calc(100vh-350px)] overflow-y-auto">
                    {todaysAppointments.map(event => (
                    <div key={`today-${event.id}`} className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="font-medium text-sm lg:text-base text-violet-700 mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs lg:text-sm text-slate-600">
                          {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </div>
                        {event.status === 'Pending' && (
                          <Badge className="bg-yellow-500 text-xs">Pending Approval</Badge>
                        )}
                        {event.status === 'Finished' && (
                          <Badge className="bg-green-500 text-xs">Completed</Badge>
                        )}
                        {event.status === 'Cancelled' && (
                          <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                          {event.status === 'Pending' && (
                            <>
                              <Button 
                                key={`approve-${event.id}`}
                                variant="outline" 
                                size="sm"
                                className="text-xs px-2 py-1 h-7 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                onClick={() => handleApproveAppointment(event.id)}
                              >
                                Approve
                              </Button>
                              <Button 
                                key={`reschedule-pending-${event.id}`}
                                variant="outline" 
                                size="sm"
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => handleRescheduleAppointment(event.id)}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                key={`cancel-pending-${event.id}`}
                                variant="destructive" 
                                size="sm"
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => handleCancelAppointment(event.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {(event.status === 'Scheduled' || event.status === 'Rescheduled' || event.status === 'Finished') && (
                            <>
                              {adminData?.role?.toLowerCase() === 'superadmin' ? (
                                // Superadmin: Only Complete button
                                <Button 
                                  key={`complete-${event.id}`}
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs px-2 py-1 h-7"
                                  onClick={() => handleCompleteAppointment(event.id)}
                                  disabled={event.status === 'Finished'}
                                >
                                  Complete
                                </Button>
                              ) : (
                                // Admin: Remark (Complete), Reschedule, Cancel buttons
                                // Note: Remark is disabled until status is Finished, Reschedule and Cancel are disabled if status is Finished
                                <>
                                  {event.status !== 'Finished' ? (
                                    // Remark button disabled - show tooltip
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button 
                                            key={`remark-${event.id}`}
                                            variant="outline" 
                                            size="sm"
                                            className="text-xs px-2 py-1 h-7"
                                            disabled={true}
                                          >
                                            Remark
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This appointment hasn&apos;t been completed yet</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    // Remark button enabled when status is Finished
                                    <Button 
                                      key={`remark-${event.id}`}
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs px-2 py-1 h-7"
                                      onClick={() => handleCompleteAppointment(event.id)}
                                    >
                                      Remark
                                    </Button>
                                  )}
                                  <Button 
                                    key={`reschedule-${event.id}`}
                                    variant="outline" 
                                    size="sm"
                                    className="text-xs px-2 py-1 h-7"
                                    onClick={() => handleRescheduleAppointment(event.id)}
                                    disabled={event.status === 'Finished'}
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
                                    disabled={event.status === 'Finished'}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </>
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

              {/* Upcoming appointments for superadmin */}
              {isSuperadmin && (
                <Card className="shadow-sm rounded-lg dark:bg-[#0b1020] dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base lg:text-lg">Upcoming Appointments</CardTitle>
                    <CardDescription className="text-xs lg:text-sm">Next scheduled visits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map(event => (
                        <div key={`upcoming-${event.id}`} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 transition-colors">
                          <div className="font-medium text-sm lg:text-base text-violet-700 mb-1">{event.title}</div>
                          <div className="text-xs lg:text-sm text-slate-600 mb-2">
                            {format(event.start, 'MMM d, yyyy • h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <div className="text-2xl mb-2">⏳</div>
                        <div>No upcoming appointments scheduled</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              <div className={`shadow-sm rounded-lg bg-white dark:bg-[#0b1020] ${isSuperadmin ? 'lg:col-span-2 h-[400px] sm:h-[500px]' : 'lg:col-span-4 xl:col-span-3 h-[400px] sm:h-[500px] lg:h-[calc(100vh-200px)]'}`}>
                <Tabs
                  value={activeTab}
                  className="w-full h-full flex flex-col"
                  onValueChange={(value) => setActiveTab(value as 'active' | 'archived' | 'finished')}
                >
                    <TabsList className="mb-4 flex flex-row w-full max-w-2xl mx-auto justify-center bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm p-1">
                      {!isSuperadmin && (
                        <TabsTrigger value="active" className="flex-1 px-3 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">
                          Active
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="finished" className="flex-1 px-3 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">Finished</TabsTrigger>
                      <TabsTrigger value="archived" className="flex-1 px-3 py-2 text-sm font-semibold rounded-full transition data-[state=active]:bg-violet-600 dark:data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300">Archived</TabsTrigger>
                  </TabsList>

                  {!isSuperadmin && (
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
                                  {adminData?.role?.toLowerCase() !== 'superadmin' && (
                                    <button
                                      className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm"
                                      onClick={() => {
                                        setShowAppointmentModal(true);
                                        setShowMonthMenu(false);
                                      }}
                                    >
                                      Create Appointment
                                    </button>
                                  )}
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
                              className={`px-3 py-1.5 text-xs sm:text-sm ${mounted && view === 'week' ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Week
                          </Button>
                          <Button 
                              variant="outline"
                            onClick={() => changeView('day')}
                              size="sm"
                              className={`px-3 py-1.5 text-xs sm:text-sm ${mounted && view === 'day' ? 'ring-2 ring-violet-200' : ''}`}
                          >
                            Day
                          </Button>
                        </div>
                      </div>
                        <div className="w-full text-center text-sm sm:text-lg font-semibold mb-3 text-violet-700">
                          {mounted && view === 'day' 
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
                          if (found) handleSelectEvent(found as AppointmentEvent);
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
                  )}

                  <TabsContent value="finished" className="flex-1 flex flex-col">
                      <div className="flex-1 bg-white dark:bg-[#0b1020] rounded-lg shadow-sm border dark:border-slate-700 p-3 sm:p-4 flex flex-col">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
                          <h2 className="text-lg sm:text-xl font-semibold text-violet-700">Finished Appointments</h2>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <Label htmlFor="finishedDateFilter" className="text-xs sm:text-sm text-slate-600">Filter by date:</Label>
                            <div className="flex gap-2">
                          <Input
                            id="finishedDateFilter"
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value);
                                fetchFinishedAppointments(date);
                              } else {
                                    fetchFinishedAppointments();
                              }
                            }}
                                className="w-full sm:w-auto max-w-[200px]"
                          />
                          <Button 
                            variant="outline" 
                              size="sm"
                            onClick={() => {
                              const dateInput = document.getElementById('finishedDateFilter') as HTMLInputElement;
                              if (dateInput) dateInput.value = '';
                              fetchFinishedAppointments();
                            }}
                                className="px-3 py-1.5 text-xs sm:text-sm"
                          >
                                Clear
                          </Button>
                        </div>
                      </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                        {finishedEvents.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="text-4xl mb-3">✅</div>
                              <p className="text-slate-500 text-sm">No finished appointments found</p>
                            </div>
                        ) : (
                          finishedEvents.map((event) => (
                            <div
                              key={`finished-${event.id}`}
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
                                  <Badge key={`finished-badge-${event.id}`} variant="default" className="self-start text-xs bg-green-600 hover:bg-green-700">Finished</Badge>
                              </div>
                            </div>
                          ))
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

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please provide a reason for cancelling this appointment..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCancelDialog(false);
                setAppointmentToCancel(null);
                setCancelReason('');
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim()}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
    </AuthGuard>
  );
} 