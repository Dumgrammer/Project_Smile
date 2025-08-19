'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePatients } from '@/hooks/patients/patientHooks';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconCircleCheckFilled, IconLoader } from '@tabler/icons-react';
import { use } from 'react';
import { usePatientAppointments } from '@/hooks/appointments/usePatientAppointments';
import { format } from 'date-fns';
import type { Patient } from '@/interface/patient';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNotes } from '@/hooks/notes/notesHooks';

interface Appointment {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Finished' | 'Cancelled';
}

interface Note {
  _id: string;
  appointment: {
    date: string;
    title: string;
    startTime: string;
    endTime: string;
  };
  treatmentNotes: string;
  reminderNotes?: string;
  payment: {
    status: string;
    amount: number;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface ApiError {
  message: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Error formatting date:', apiError);
    return 'Invalid Date';
  }
};

const formatMonthYear = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Error formatting month/year:', apiError);
    return 'Invalid Date';
  }
};

export default function PatientDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth(true);
  const { getPatientById } = usePatients();
  const { loading: appointmentsLoading, error: appointmentsError, getPatientAppointments } = usePatientAppointments();
  const { loading: notesLoading, getPatientNotes } = useNotes();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortBy, setSortBy] = useState('date');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState('All');

  // Unwrap the params promise
  const resolvedParams = use(params);

  // Group notes by month and year
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: { [key: string]: Note[] } } = {};
    notes.forEach(note => {
      const monthYear = formatMonthYear(note.appointment.date);
      const date = formatDate(note.appointment.date);
      
      if (!groups[monthYear]) {
        groups[monthYear] = {};
      }
      if (!groups[monthYear][date]) {
        groups[monthYear][date] = [];
      }
      groups[monthYear][date].push(note);
    });
    return groups;
  }, [notes]);

  // Get all unique month/year options for the dropdown
  const monthYearOptions = useMemo(() => {
    const options = new Set<string>();
    notes.forEach(note => {
      const monthYear = formatMonthYear(note.appointment.date);
      options.add(monthYear);
    });
    return ['All', ...Array.from(options)];
  }, [notes]);

  // Filter notes by selected month/year
  const filteredGroupedNotes = useMemo(() => {
    if (selectedMonthYear === 'All') return groupedNotes;
    return {
      [selectedMonthYear]: groupedNotes[selectedMonthYear] || {}
    };
  }, [groupedNotes, selectedMonthYear]);

  // Combined useEffect for fetching all data
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!resolvedParams.id) {
        setError('Invalid patient ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch patient data
        const patientData = await getPatientById(resolvedParams.id);
        if (!isMounted) return;
        
        // Ensure cases is properly initialized if undefined
        const patientWithCases: Patient = {
          ...patientData,
          cases: patientData.cases || []
        };
        setPatient(patientWithCases);
        setError(null);

        // Fetch appointments and notes in parallel
        const [appointmentsData, notesData] = await Promise.all([
          getPatientAppointments(resolvedParams.id, sortBy).catch(() => []),
          getPatientNotes(resolvedParams.id).catch(() => [])
        ]);

        if (!isMounted) return;
        
        setAppointments(appointmentsData);
        setNotes(notesData);
        
      } catch (err) {
        console.error('Error fetching patient data:', err);
        if (isMounted) {
          setError('Failed to load patient data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, sortBy]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error || 'Patient not found'}</div>
        <Button onClick={() => router.back()} variant="outline">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const fullName = patient.middleName 
    ? `${patient.firstName} ${patient.middleName} ${patient.lastName}`
    : `${patient.firstName} ${patient.lastName}`;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-2 mb-4 md:flex-row md:gap-2 md:items-center md:justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.back()}
                    className="w-full md:w-auto"
                  >
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    Back to Patients
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowHistoryModal(true)}
                    className="w-full md:w-auto"
                  >
                    View History
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/appointments?patientId=${resolvedParams.id}`)}
                    className="w-full md:w-auto"
                  >
                    Schedule Appointment
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Patient Profile</h1>
                    <p className="text-slate-600">View and manage patient information</p>
                  </div>
                  <Badge variant="outline" className="text-violet-600 border-violet-200 px-2 py-1">
                    {patient.isActive ? (
                      <IconCircleCheckFilled className="fill-violet-500 dark:fill-violet-400 mr-1" />
                    ) : (
                      <IconLoader className="text-violet-500 mr-1" />
                    )}
                    {patient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-violet-800">Personal Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Full Name</p>
                        <p className="font-medium">{fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Birth Date</p>
                        <p className="font-medium">{formatDate(patient.birthDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Age</p>
                        <p className="font-medium">{patient.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Gender</p>
                        <p className="font-medium">{patient.gender}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-violet-800">Contact Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Phone Number</p>
                        <p className="font-medium">{patient.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{patient.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Address</p>
                        <p className="font-medium">
                          {patient.address ? (
                            <>
                              {patient.address.street && `${patient.address.street}, `}
                              {patient.address.city && `${patient.address.city}, `}
                              {patient.address.province && `${patient.address.province}, `}
                              {patient.address.postalCode && `${patient.address.postalCode}`}
                            </>
                          ) : 'No address provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-violet-800">Emergency Contact</h2>
                    {patient.emergencyContact?.name ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Name</p>
                          <p className="font-medium">{patient.emergencyContact.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Relationship</p>
                          <p className="font-medium">{patient.emergencyContact.relationship || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Contact Number</p>
                          <p className="font-medium">{patient.emergencyContact.contactNumber || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No emergency contact provided</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-violet-800">Medical History</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Allergies</p>
                        <p className="font-medium">{patient.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Last Visit</p>
                        <p className="font-medium">{formatDate(patient.lastVisit)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-slate-200 md:col-span-2">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                      <h2 className="text-lg md:text-xl font-semibold text-violet-800">Treatment Notes</h2>
                      <Select
                        value={selectedMonthYear}
                        onValueChange={setSelectedMonthYear}
                      >
                        <SelectTrigger className="w-full md:w-[220px]">
                          <SelectValue placeholder="Sort by Month/Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthYearOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {notesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
                      </div>
                    ) : notes.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No treatment notes available</p>
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(filteredGroupedNotes).map(([monthYear, dates]) => (
                          <div key={monthYear} className="space-y-4">
                            <div className="flex items-center">
                              <div className="h-px bg-slate-200 flex-1"></div>
                              <span className="px-4 text-lg font-semibold text-violet-700">{monthYear}</span>
                              <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div className="space-y-6">
                              {Object.entries(dates).map(([date, dateNotes]) => (
                                <div key={date} className="space-y-4">
                                  <div className="flex items-center">
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                    <span className="px-4 text-sm font-medium text-slate-500">{date}</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                  </div>
                                  <div className="space-y-4 pl-4 border-l-2 border-violet-200">
                                    {dateNotes.map((note) => (
                                      <div key={note._id} className="border rounded-lg p-4 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <h3 className="font-medium">{note.appointment.title}</h3>
                                            <p className="text-sm text-slate-500">
                                              {note.appointment.startTime} - {note.appointment.endTime}
                                            </p>
                                          </div>
                                          <Badge variant={note.payment.status === 'Paid' ? 'default' : 'secondary'}>
                                            {note.payment.status}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-sm font-medium text-slate-700">Treatment Notes</p>
                                            <p className="text-sm text-slate-600">{note.treatmentNotes}</p>
                                          </div>
                                          {note.reminderNotes && (
                                            <div>
                                              <p className="text-sm font-medium text-slate-700">Reminder Notes</p>
                                              <p className="text-sm text-slate-600">{note.reminderNotes}</p>
                                            </div>
                                          )}
                                          <div className="flex justify-between items-center text-sm text-slate-500">
                                            <span>Amount: ₱{note.payment.amount.toFixed(2)}</span>
                                            <span>Added by: {note.createdBy.firstName} {note.createdBy.lastName}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                  <h2 className="text-xl font-semibold mb-4 text-violet-800">Cases & Treatments</h2>
                  {patient.cases && patient.cases.length > 0 ? (
                    <div className="space-y-4">
                      {patient.cases.map((caseItem, index) => (
                        <div key={index} className="p-4 border border-violet-100 rounded-lg bg-violet-50">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-violet-700">{caseItem.title}</h3>
                            <Badge variant={
                              caseItem.status === 'Active' ? 'secondary' :
                              caseItem.status === 'Completed' ? 'secondary' : 'destructive'
                            }>
                              {caseItem.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Description:</span> {caseItem.description}
                            </p>
                            {caseItem.treatmentPlan && (
                              <p className="text-sm">
                                <span className="font-medium">Treatment Plan:</span> {caseItem.treatmentPlan}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No cases or treatments found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Appointment History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Appointment History</DialogTitle>
            <DialogDescription>
              View all appointments for {patient?.firstName} {patient?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest First</SelectItem>
                <SelectItem value="dateAsc">Oldest First</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {appointmentsLoading ? (
              <div className="text-center py-4">Loading appointments...</div>
            ) : appointmentsError ? (
              <div className="text-center py-4 text-red-500">{appointmentsError}</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-4 text-slate-500">No appointments found</div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{appointment.title}</div>
                        <div className="text-sm text-gray-500">
                          Date: {format(new Date(appointment.date), 'MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Time: {appointment.startTime} - {appointment.endTime}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          appointment.status === 'Scheduled' ? 'default' :
                          appointment.status === 'Finished' ? 'secondary' :
                          appointment.status === 'Cancelled' ? 'destructive' :
                          'outline'
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
} 