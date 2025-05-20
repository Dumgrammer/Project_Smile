import * as React from "react";
import { usePatients } from "@/hooks/patients/patientHooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber: string;
}

interface PatientSearchProps {
  onSelect: (patientId: string) => void;
  selectedPatientId?: string;
}

export function PatientSearch({ onSelect, selectedPatientId }: PatientSearchProps) {
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const { getPatients, loading } = usePatients();

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await getPatients(1, 50);
        setPatients(response.patients);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
    fetchPatients();
  }, [getPatients]);

  return (
    <Select
      value={selectedPatientId}
      onValueChange={(value) => {
        console.log('Selected patient:', value);
        onSelect(value);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a patient" />
      </SelectTrigger>
      <SelectContent>
        {patients.map((patient) => (
          <SelectItem key={patient._id} value={patient._id}>
            {`${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 