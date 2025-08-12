'use client';

import { useState, useMemo } from 'react';
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
import type { Patient } from "@/hooks/patients/patientHooks";

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

  const { createPublicAppointment, loading: appointmentLoading } = useAppointments();

  // Dummy services data - in a real app, this would come from an API
  const services: Service[] = [
    {
      id: '1',
      name: 'Dental Check-up',
      duration: 30,
      description: 'Comprehensive dental examination and cleaning'
    },
    {
      id: '2',
      name: 'Teeth Whitening',
      duration: 60,
      description: 'Professional teeth whitening treatment'
    },
    {
      id: '3',
      name: 'Cavity Filling',
      duration: 45,
      description: 'Dental cavity filling and restoration'
    },
    {
      id: '4',
      name: 'Root Canal',
      duration: 90,
      description: 'Root canal treatment'
    },
    {
      id: '5',
      name: 'Braces Consultation',
      duration: 45,
      description: 'Orthodontic consultation and treatment planning'
    },
    {
      id: '6',
      name: 'Emergency Treatment',
      duration: 60,
      description: 'Emergency dental treatment for urgent cases'
    }
  ];

  // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = (date: Date): AppointmentSlot[] => {
    const slots: AppointmentSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        slots.push({
          id: `${date.toISOString()}-${time}`,
          date: new Date(date),
          time,
          available: true // All slots are available by default
        });
      }
    }
    
    return slots;
  };

  // Generate calendar days for the current week
  const calendarDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Get time slots for selected date
  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

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

    if (!bookingDetails.reason.trim()) {
      toast.error('Please provide a reason for your visit');
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

  if (!patientData) {
    return <SearchYourRecord onRecordFound={handleRecordFound} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Your Appointment</h1>
              <p className="text-gray-600 mt-1">Welcome back, {patientData.firstName}!</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setPatientData(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {patientData.firstName} {patientData.middleName} {patientData.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Patient ID: {patientData._id}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{patientData.email || 'No email on file'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{patientData.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{formatAddress(patientData.address)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Age:</span>
                    <span>{patientData.age} years old</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Gender:</span>
                    <span>{patientData.gender}</span>
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService === service.id
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{service.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
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
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">
                    {format(calendarDays[0], 'MMM d')} - {format(calendarDays[6], 'MMM d, yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast(day) && !isToday(day)}
                      className={`p-3 text-center rounded-lg transition-all ${
                        isSameDay(day, selectedDate)
                          ? 'bg-violet-500 text-white'
                          : isToday(day)
                          ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                          : isPast(day)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 text-center rounded-lg transition-all ${
                        selectedTime === slot.time
                          ? 'bg-violet-500 text-white'
                          : slot.available
                          ? 'bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-sm font-medium">{slot.time}</div>
                    </button>
                  ))}
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
                  <strong>Note:</strong> This will be submitted as a request with "Pending" status. 
                  You will receive confirmation within 24 hours.
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                placeholder="Please describe the reason for your visit..."
                value={bookingDetails.reason}
                onChange={(e) => setBookingDetails({ ...bookingDetails, reason: e.target.value })}
              />
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
