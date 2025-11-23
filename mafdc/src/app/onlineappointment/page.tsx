'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SearchYourRecord } from "@/components/search-your-record";
import { Calendar, Clock, User, Phone, Mail, MapPin, CheckCircle2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppointments } from "@/hooks/appointments/appointmentHooks";

// Import Patient interface from patientHooks to ensure consistency
import type { Patient } from "@/interface/patient";
import type { Appointment } from "@/interface/appointment";

interface AppointmentSlot {
  id: string;
  date: Date;
  time: string;
  available: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
}

export default function OnlineAppointmentPage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    reason: '',
    notes: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [hasServerData, setHasServerData] = useState(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { createPublicAppointment, getPatientAppointments, getPublicAppointments, loading: appointmentLoading } = useAppointments();

  // Services data matching the services page
  const services: Service[] = [
    {
      id: '1',
      name: 'Orthodontic Braces',
      duration: 30,
      description: 'Professional orthodontic treatment to align teeth and improve your smile. We offer both traditional and modern options.'
    },
    {
      id: '2',
      name: 'Cleaning/Oral Prophylaxis',
      duration: 30,
      description: 'Professional teeth cleaning to remove plaque, tartar, and stains for a healthier, brighter smile.'
    },
    {
      id: '3',
      name: 'Extraction',
      duration: 30,
      description: 'Safe and comfortable tooth extraction procedures performed by experienced dental professionals.'
    },
    {
      id: '4',
      name: 'Teeth Whitening',
      duration: 30,
      description: 'Professional teeth whitening treatments to brighten your smile and boost your confidence.'
    },
    {
      id: '5',
      name: 'Restoration/Pasta',
      duration: 30,
      description: 'High-quality dental fillings and restorations to repair cavities and damaged teeth.'
    },
    {
      id: '6',
      name: 'Dental Crown',
      duration: 30,
      description: 'Custom-made dental crowns to restore damaged teeth and improve their appearance and function.'
    },
    {
      id: '7',
      name: 'Fixed Bridge',
      duration: 30,
      description: 'Permanent solution to replace missing teeth and restore your natural smile.'
    },
    {
      id: '8',
      name: 'Veneers',
      duration: 30,
      description: 'Thin, custom-made shells to improve the appearance of your teeth and create a perfect smile.'
    },
    {
      id: '9',
      name: 'Denture',
      duration: 30,
      description: 'Custom-fitted removable replacements for missing teeth and surrounding tissues.'
    }
  ];

  // Fetch all appointments for the selected date to check availability
  const fetchAllAppointmentsForDate = useCallback(async (date: Date) => {
    try {
      setSlotsLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Fetching all appointments for date:', dateStr);
      
      // Fetch all appointments for the selected date (using public endpoint)
      const appointments = await getPublicAppointments({ date: dateStr });
      console.log('Received appointments from server:', appointments);
      
      if (Array.isArray(appointments)) {
        setAllAppointments(appointments);
        setHasServerData(true);
        console.log('Found', appointments.length, 'appointments for', dateStr);
        
        // Log each appointment for debugging
        appointments.forEach(apt => {
          console.log(`Appointment: ${apt.startTime}-${apt.endTime} - ${apt.title} (${apt.status})`);
        });
        
        console.log('Appointments data updated, time slots will be recalculated');
      } else {
        setAllAppointments([]);
        setHasServerData(false);
        console.log('No appointments found or invalid response');
      }
    } catch (error) {
      console.error('Error fetching appointments for date:', error);
      setAllAppointments([]);
      setHasServerData(false);
      // Don't show error toast in production to avoid user confusion
      if (process.env.NODE_ENV === 'development') {
        toast.error('Failed to check appointment availability. Please try again.');
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [getPublicAppointments]);

  // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = useCallback((date: Date): AppointmentSlot[] => {
    const slots: AppointmentSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    const currentDate = new Date();
    const currentTime = currentDate.toTimeString().slice(0, 5); // Current time in HH:mm format
    const isSelectedDateToday = isToday(date);
    
    // Debug logging
    console.log('generateTimeSlots called for date:', format(date, 'yyyy-MM-dd'));
    console.log('generateTimeSlots debug:', {
      selectedDate: date,
      currentDate,
      currentTime,
      isSelectedDateToday,
      hasServerData,
      appointmentsCount: allAppointments.length
    });
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time slot is available
        let available = true;
        
        // Check if time has passed today (more robust time comparison)
        if (isSelectedDateToday) {
          const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
          const [slotHours, slotMinutes] = time.split(':').map(Number);
          
          const currentTotalMinutes = currentHours * 60 + currentMinutes;
          const slotTotalMinutes = slotHours * 60 + slotMinutes;
          
          // Debug for 9:00 AM slot
          if (time === '09:00') {
            console.log('9:00 AM slot debug:', {
              time,
              currentTime,
              currentTotalMinutes,
              slotTotalMinutes,
              isPast: slotTotalMinutes <= currentTotalMinutes
            });
          }
          
          // Add 30 minutes buffer - if current time is past the slot time, disable it
          if (slotTotalMinutes <= currentTotalMinutes) {
            available = false;
          }
        }
        
        // Check if this time slot conflicts with any existing appointments
        if (hasServerData && allAppointments.length > 0) {
          const hasConflict = allAppointments.some(apt => {
            // Only check non-cancelled appointments
            if (apt.status === 'Cancelled') return false;
            
            // Calculate slot end time
            const [slotHours, slotMinutes] = time.split(':').map(Number);
            const slotEndMinutes = slotMinutes + 30;
            const slotEndTime = slotEndMinutes >= 60 
              ? `${(slotHours + 1).toString().padStart(2, '0')}:00`
              : `${slotHours.toString().padStart(2, '0')}:${slotEndMinutes.toString().padStart(2, '0')}`;
            
            // Check if appointment overlaps with this time slot
            const conflict = apt.startTime < slotEndTime && apt.endTime > time;
            
            if (conflict) {
              console.log(`CONFLICT: Slot ${time}-${slotEndTime} conflicts with appointment ${apt.startTime}-${apt.endTime} (${apt.title})`);
            }
            
            return conflict;
          });
          
          if (hasConflict) {
            available = false;
            console.log(`Slot ${time} marked as OCCUPIED by existing appointment`);
          }
        }
        
        // Debug final availability for important slots
        if (time === '09:00' || time === '10:00' || time === '14:00') {
          console.log(`Final availability for ${time}:`, {
            time,
            finalAvailable: available,
            hasServerData,
            appointmentsCount: allAppointments.length,
            isPastTime: isSelectedDateToday && (parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])) <= (parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]))
          });
        }
        
        slots.push({
          id: `${date.toISOString()}-${time}`,
          date: new Date(date),
          time,
          available
        });
      }
    }
    
    return slots;
  }, [allAppointments, hasServerData]);

  // Generate calendar days for the current week
  const calendarDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Get time slots for selected date
  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedDate);
  }, [generateTimeSlots, selectedDate]);

  // Fetch patient's appointments (upcoming or all including history)
  const fetchPatientAppointments = useCallback(async (patientId: string, includeHistory: boolean = false) => {
    try {
      setAppointmentsLoading(true);
      console.log('Fetching appointments for patient:', patientId, 'includeHistory:', includeHistory);
      
      const appointments = await getPatientAppointments(patientId, includeHistory);
      console.log('Received patient appointments:', appointments);
      
      if (includeHistory) {
        // Show all appointments when history is enabled
        setPatientAppointments(Array.isArray(appointments) ? appointments : []);
      } else {
        // Filter to show only upcoming appointments (not past or cancelled)
        const now = new Date();
        const upcomingAppointments = Array.isArray(appointments) 
          ? appointments.filter((apt: Appointment) => {
              const appointmentDate = new Date(apt.date);
              return appointmentDate >= now && apt.status !== 'Cancelled';
            })
          : [];
        
        setPatientAppointments(upcomingAppointments);
      }
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      setPatientAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [getPatientAppointments]);

  // Fetch all appointments when selected date changes
  useEffect(() => {
    fetchAllAppointmentsForDate(selectedDate);
  }, [fetchAllAppointmentsForDate, selectedDate]);

  // Fetch patient appointments when patient data is available
  useEffect(() => {
    if (patientData?._id) {
      fetchPatientAppointments(patientData._id, showHistory);
    }
  }, [fetchPatientAppointments, patientData, showHistory]);

  // Refetch appointments when history toggle changes
  useEffect(() => {
    if (patientData?._id) {
      fetchPatientAppointments(patientData._id, showHistory);
    }
  }, [fetchPatientAppointments, patientData?._id, showHistory]);

  const handleRecordFound = (data: Patient) => {
    setPatientData(data);
  };

  const handleDateSelect = (date: Date) => {
    if (isPast(date) && !isToday(date)) {
      toast.error('Cannot select past dates');
      return;
    }
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleBookAppointment = () => {
    if (!selectedService || !selectedTime) {
      toast.error('Please select a service and time slot');
      return;
    }
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!patientData || !selectedService || !selectedTime) {
      toast.error('Missing required information');
      return;
    }

    try {
      const selectedServiceData = services.find(s => s.id === selectedService);
      if (!selectedServiceData) {
        toast.error('Service not found');
        return;
      }

      // Calculate end time based on service duration
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedServiceData.duration);
      
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Create appointment data
      const appointmentData = {
        patientId: patientData._id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        endTime: endTime,
        title: `${selectedServiceData.name} - ${bookingDetails.reason || 'Appointment'}`
      };

      // Create the appointment using the API
      const result = await createPublicAppointment(appointmentData);
      
      if (result) {
        setShowBookingModal(false);
        setShowSuccessModal(true);
        
        // Reset form
        setSelectedService('');
        setSelectedTime('');
        setBookingDetails({ reason: '', notes: '' });
        
        // Refresh patient appointments to show the new one
        if (patientData?._id) {
          fetchPatientAppointments(patientData._id, showHistory);
        }
        
        toast.success('Appointment request submitted successfully! Status: Pending - You will receive confirmation within 24 hours.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

  // Helper function to format address
  const formatAddress = (address?: Patient['address']) => {
    if (!address) return 'No address on file';
    const parts = [address.street, address.city, address.province, address.postalCode].filter(Boolean);
    return parts.join(', ') || 'No address on file';
  };

  // Helper function to clean up appointment title (remove duplicate patient names)
  const cleanAppointmentTitle = (title: string) => {
    // Split by common separators and remove duplicates
    const parts = title.split(/ - | – | — /);
    const uniqueParts = parts.filter((part, index, array) => array.indexOf(part) === index);
    return uniqueParts.join(' - ');
  };

  if (!patientData) {
    return <SearchYourRecord onRecordFound={handleRecordFound} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Request Your Appointment</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {patientData.firstName}!</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPatientData(null);
                  setShowHistory(false); // Reset history toggle when going back
                }}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back to Search</span>
                <span className="sm:hidden">Back</span>
              </Button>
              
              <Button
                variant={showHistory ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{showHistory ? 'Hide History' : 'Show History'}</span>
                <span className="sm:hidden">{showHistory ? 'Hide' : 'History'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Patient Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {patientData.firstName} {patientData.middleName} {patientData.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Patient ID: {patientData._id}</p>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{patientData.email || 'No email on file'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{patientData.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{formatAddress(patientData.address)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-gray-400 flex-shrink-0">Age:</span>
                    <span>{patientData.age} years old</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-gray-400 flex-shrink-0">Gender:</span>
                    <span>{patientData.gender}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient's Appointments */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {showHistory ? 'Your Appointment History' : 'Your Upcoming Appointments'}
                </CardTitle>
                <CardDescription>
                  {showHistory ? 'All your past and upcoming appointments' : 'Your scheduled appointments'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-600"></div>
                  </div>
                ) : patientAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientAppointments.map((appointment, index) => {
                      const appointmentDate = new Date(appointment.date);
                      const isPast = appointmentDate < new Date();
                      
                      return (
                        <div key={index} className={`p-2 sm:p-3 border rounded-lg transition-colors ${
                          isPast ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50 border-violet-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className={`font-medium text-xs sm:text-sm mb-1 ${
                                isPast ? 'text-gray-600' : 'text-violet-700'
                              }`}>
                                <div className="flex items-start gap-1">
                                  <span className="truncate flex-1 min-w-0 max-w-[200px] sm:max-w-none" title={appointment.title}>
                                    {cleanAppointmentTitle(appointment.title)}
                                  </span>
                                  {isPast && <span className="text-xs text-gray-400 flex-shrink-0">(Past)</span>}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {format(appointmentDate, 'EEEE, MMMM d, yyyy')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span>
                                    {appointment.startTime} - {appointment.endTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-3 flex-shrink-0">
                              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                                appointment.status === 'Scheduled' 
                                  ? 'bg-green-100 text-green-700'
                                  : appointment.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : appointment.status === 'Rescheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : appointment.status === 'Finished'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : appointment.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <div className="text-sm">
                      {showHistory ? 'No appointment history found' : 'No upcoming appointments'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {showHistory ? 'Book your first appointment to see it here' : 'Book your first appointment below'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Service
                </CardTitle>
                <CardDescription>Choose the dental service you need</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService === service.id
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">{service.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{service.duration} minutes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose your preferred appointment date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('prev')}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium text-sm sm:text-base text-center px-2">
                    {format(calendarDays[0], 'MMM d')} - {format(calendarDays[6], 'MMM d, yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('next')}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast(day) && !isToday(day)}
                      className={`p-2 sm:p-3 text-center rounded-lg transition-all ${
                        isSameDay(day, selectedDate)
                          ? 'bg-violet-500 text-white'
                          : isToday(day)
                          ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                          : isPast(day)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-medium">{format(day, 'd')}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Time</CardTitle>
                <CardDescription>
                  Available time slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  {slotsLoading && <span className="ml-2 text-violet-600">Checking availability...</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => {
                      const isOccupied = hasServerData && !slot.available;
                      const isPastTime = isToday(selectedDate) && isPast(new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${slot.time}:00`));
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          title={
                            !slot.available 
                              ? isOccupied 
                                ? 'This time slot is already booked' 
                                : isPastTime 
                                ? 'This time has already passed' 
                                : 'This time slot is not available'
                              : 'Click to select this time slot'
                          }
                          className={`p-2 sm:p-3 text-center rounded-lg transition-all relative ${
                            selectedTime === slot.time
                              ? 'bg-violet-500 text-white'
                              : slot.available
                              ? 'bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                              : isOccupied
                              ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-medium">{slot.time}</div>
                          {!slot.available && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`text-xs ${isOccupied ? 'text-red-500' : 'text-gray-500'}`}>
                                {isOccupied ? '' : '✕'}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-violet-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                      <span className="text-[8px]">🚫</span>
                    </div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                      <span className="text-[8px]">✕</span>
                    </div>
                    <span>Past Time</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Button */}
            <Button
              onClick={handleBookAppointment}
              disabled={!selectedService || !selectedTime || appointmentLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 py-3 text-lg"
            >
              {appointmentLoading ? 'Submitting...' : 'Submit Appointment Request'}
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Appointment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Appointment Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Service:</strong> {selectedServiceData?.name}</p>
                <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3 h-3" />
                  <span><strong>Duration:</strong> {selectedServiceData?.duration} minutes</span>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  <strong>Note:</strong> This will be submitted as a request with &quot;Pending&quot; status. 
                  You will receive confirmation within 24 hours.
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <p className="text-sm text-gray-600 mb-2">{selectedServiceData?.description}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information or special requests..."
                value={bookingDetails.notes}
                onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              disabled={appointmentLoading}
            >
              {appointmentLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl text-center">Appointment Request Submitted!</DialogTitle>
            <p className="text-sm text-gray-500 text-center mt-2">
              Your appointment request has been submitted with <strong>Pending</strong> status. 
              You will receive a confirmation email within 24 hours.
            </p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/'); // Redirect to home page
                router.refresh(); // Reload the page to show updated data
              }}
            >
              Go to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
