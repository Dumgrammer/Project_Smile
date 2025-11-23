
export interface AppointmentEvent {
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
}

export interface AppointmentDialogsProps {
  // Appointment Creation Dialog
  showAppointmentModal: boolean;
  setShowAppointmentModal: (show: boolean) => void;
  newAppointment: {
    patientId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
  };
  setNewAppointment: (appointment: {
    patientId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
  } | ((prev: {
    patientId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
  }) => {
    patientId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
  })) => void;
  handleCreateAppointment: () => void;

  // Edit Appointment Modal
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  selectedAppointment: AppointmentEvent | null;
  setSelectedAppointment: (appointment: AppointmentEvent | null) => void;
  isRescheduling: boolean;
  setIsRescheduling: (rescheduling: boolean) => void;
  handleUpdateAppointment: () => void;

  // Notes Modal
  showNotesModal: boolean;
  setShowNotesModal: (show: boolean) => void;
  appointmentNotes: AppointmentNotes;
  setAppointmentNotes: (notes: AppointmentNotes) => void;
  handleSaveNotes: () => void;

  // Success Modal
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  successMessage: string;

  // Month Appointments Modal
  showMonthAppointmentsModal: boolean;
  setShowMonthAppointmentsModal: (show: boolean) => void;
  monthAppointments: AppointmentEvent[];
  date: Date;
}

export interface Appointment {
    _id: string;
    patient: {
      _id: string;
      firstName: string;
      lastName: string;
      middleName?: string;
    };
    date: string;
    startTime: string;
    endTime: string;
    status: 'Scheduled' | 'Finished' | 'Rescheduled' | 'Cancelled' | 'Pending';
    title: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
  }
  
  export interface AppointmentNotes {
    treatmentNotes: string;
    reminderNotes: string;
    payment: {
      status: 'Paid' | 'Pending' | 'Partial';
    };
  }

  export interface ApiError {
    message: string;
    status?: number;
    data?: unknown;
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
      };
    };
  }
  
  export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }