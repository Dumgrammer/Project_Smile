'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatients } from '@/hooks/patients/patientHooks';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Patient {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  age: number;
  gender: string;
  contactNumber: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    contactNumber?: string;
  };
  allergies?: string;
  lastVisit?: string;
  isActive: boolean;
  cases: Array<{
    title: string;
    description: string;
    treatmentPlan?: string;
    status: "Active" | "Completed" | "Cancelled";
  }>;
}

export default function PatientDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { getPatientById } = usePatients();
  const { loading: appointmentsLoading, error: appointmentsError, getPatientAppointments } = usePatientAppointments();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('date');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Unwrap the params promise
  const resolvedParams = use(params);

  useEffect(() => {
    let isMounted = true;

    const fetchPatient = async () => {
      if (!resolvedParams.id) {
        setError('Invalid patient ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getPatientById(resolvedParams.id);
        if (isMounted) {
          setPatient(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        if (isMounted) {
          setError('Failed to load patient data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPatient();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, getPatientById]);

  useEffect(() => {
    fetchPatientAppointments();
  }, [resolvedParams.id, sortBy]);

  const fetchPatientAppointments = async () => {
    try {
      const data = await getPatientAppointments(resolvedParams.id, sortBy);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch patient appointments:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
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
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    Back to Patients
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowHistoryModal(true)}
                    >
                      View History
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/appointments?patientId=${resolvedParams.id}`)}
                    >
                      Schedule Appointment
                    </Button>
                  </div>
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
                    <h2 className="text-xl font-semibold mb-4 text-violet-800">Medical Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Allergies</p>
                        <p className="font-medium">{patient.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Last Visit</p>
                        <p className="font-medium">{patient.lastVisit ? formatDate(patient.lastVisit) : 'No previous visits'}</p>
                      </div>
                    </div>
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