'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { format } from 'date-fns';
import { PatientSearch } from "@/components/patient-search";
import { AppointmentDialogsProps } from '@/interface/appointment';


export function AppointmentDialogs({
  // Appointment Creation Dialog
  showAppointmentModal,
  setShowAppointmentModal,
  newAppointment,
  setNewAppointment,
  handleCreateAppointment,

  // Edit Appointment Modal
  showEditModal,
  setShowEditModal,
  selectedAppointment,
  setSelectedAppointment,
  isRescheduling,
  setIsRescheduling,
  handleUpdateAppointment,

  // Notes Modal
  showNotesModal,
  setShowNotesModal,
  appointmentNotes,
  setAppointmentNotes,
  handleSaveNotes,

  // Success Modal
  showSuccessModal,
  setShowSuccessModal,
  successMessage,

  // Month Appointments Modal
  showMonthAppointmentsModal,
  setShowMonthAppointmentsModal,
  monthAppointments,
  date,
}: AppointmentDialogsProps) {
  const isPastDay = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(targetDate);
    day.setHours(0, 0, 0, 0);
    return day < today;
  };

  const isPastSelectedDay = isPastDay(newAppointment.date);

  return (
    <>
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
                    setNewAppointment((prev) => ({...prev, patientId}));
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
              <Label htmlFor="appointmentDate">Date</Label>
              <Input 
                id="appointmentDate"
                type="date"
                value={format(newAppointment.date, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setNewAppointment({...newAppointment, date: newDate});
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  min="09:00" 
                  max="16:45" 
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
                  max="17:00" 
                  step={900}
                  value={newAppointment.endTime}
                  onChange={(e) => setNewAppointment({...newAppointment, endTime: e.target.value})}
                />
              </div>
            </div>
            {isPastSelectedDay && (
              <div className="text-red-600 text-sm">You can&apos;t schedule on a past day.</div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowAppointmentModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleCreateAppointment} 
              disabled={isPastSelectedDay}
            >
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isRescheduling ? 'Reschedule Appointment' : 'Appointment Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Patient</Label>
                <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                  {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.middleName || ''} {selectedAppointment?.patient.lastName}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Appointment Title</Label>
                <Input 
                  id="editTitle" 
                  value={selectedAppointment?.title || ''}
                  onChange={(e) => {
                    if (selectedAppointment) {
                      setSelectedAppointment({
                        ...selectedAppointment,
                        title: e.target.value
                      });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={selectedAppointment ? format(selectedAppointment.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    if (selectedAppointment) {
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
                    }
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
                    max="16:45" 
                    step={900}
                    value={selectedAppointment ? format(selectedAppointment.start, 'HH:mm') : ''}
                    onChange={(e) => {
                      if (selectedAppointment) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newStart = new Date(selectedAppointment.start);
                        newStart.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedAppointment({
                          ...selectedAppointment,
                          start: newStart
                        });
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndTime">End Time</Label>
                  <Input 
                    id="editEndTime" 
                    type="time" 
                    min="09:15" 
                    max="17:00" 
                    step={900}
                    value={selectedAppointment ? format(selectedAppointment.end, 'HH:mm') : ''}
                    onChange={(e) => {
                      if (selectedAppointment) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newEnd = new Date(selectedAppointment.end);
                        newEnd.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedAppointment({
                          ...selectedAppointment,
                          end: newEnd
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={selectedAppointment?.status || ''}
                  onValueChange={(value: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled') => {
                    if (selectedAppointment) {
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: value
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
                     <DialogFooter className="flex flex-col sm:flex-row gap-2">
             <Button 
               variant="destructive" 
               className="flex-1"
               onClick={() => {
                 setSelectedAppointment(null);
                 setIsRescheduling(false);
                 setShowEditModal(false);
               }}
             >
               Cancel
             </Button>
            <Button 
              className="flex-1"
              onClick={handleUpdateAppointment}
            >
              {isRescheduling ? 'Reschedule' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete Appointment & Add Notes</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Patient</Label>
                <div className="text-sm font-medium py-2 px-3 border rounded-md bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                  {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.lastName}
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
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowNotesModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSaveNotes}
            >
              Complete Appointment
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
          <div className="max-h-[60vh] overflow-y-auto divide-y dark:divide-slate-700">
            {monthAppointments.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-slate-300 py-8">No appointments this month.</div>
            ) : (
              monthAppointments.map(event => (
                <div key={event.id} className="py-3">
                  <div className="font-medium text-sm dark:text-white">{event.title}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-300">{format(event.start, 'EEEE, MMMM d, yyyy h:mm a')}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-300">Patient: {event.patient?.firstName} {event.patient?.lastName}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-300">Status: {event.status}</div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowMonthAppointmentsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
