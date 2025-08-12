export interface Patient {
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
    cases?: Array<{
      title: string;
      description: string;
      treatmentPlan?: string;
      status: "Active" | "Completed" | "Cancelled";
    }>;
  }
  
  export interface PatientResponse {
    message: string;
    totalPatients: number;
    totalPages: number;
    currentPage: number;
    patients: Patient[];
    verificationCodeSent?: boolean;
  }
  
  export type CreatePatientInput = {
    firstName: string;
    middleName?: string;
    lastName: string;
    birthDate: string;
    gender: string;
    contactNumber: string;
    email?: string;
    cases: Array<{
      title: string;
      description: string;
      treatmentPlan?: string;
      status: "Active" | "Completed" | "Cancelled";
    }>;
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
  };