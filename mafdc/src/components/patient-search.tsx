import * as React from "react";
import { usePatients } from "@/hooks/patients/patientHooks";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const { getPatients } = usePatients();

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await getPatients(1, 100); // Increased limit for better search
        setPatients(response.patients);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
    fetchPatients();
  }, [getPatients]);

  // Filter patients based on search value
  const filteredPatients = React.useMemo(() => {
    if (!searchValue) return patients;
    
    const searchLower = searchValue.toLowerCase();
    return patients.filter(patient => {
      const fullName = `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.toLowerCase();
      const contactNumber = patient.contactNumber.toLowerCase();
      
      return fullName.includes(searchLower) || contactNumber.includes(searchLower);
    });
  }, [patients, searchValue]);

  // Get selected patient for display
  const selectedPatient = React.useMemo(() => {
    return patients.find(patient => patient._id === selectedPatientId);
  }, [patients, selectedPatientId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPatient ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                {`${selectedPatient.firstName} ${selectedPatient.middleName || ''} ${selectedPatient.lastName}`}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a patient...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search patients by name or contact number..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {filteredPatients.map((patient) => (
                <CommandItem
                  key={patient._id}
                  value={patient._id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  keywords={[
                    patient.firstName,
                    patient.middleName || '',
                    patient.lastName,
                    patient.contactNumber,
                  ]}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPatientId === patient._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {`${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {patient.contactNumber}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 