"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { usePatients } from "@/hooks/patients/patientHooks"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconX } from "@tabler/icons-react"

type CaseStatus = "Active" | "Completed" | "Cancelled";

interface CaseImage {
  _id?: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
  description?: string;
  url?: string;
}

interface CaseWithImages {
  _id?: string;
  title: string;
  description: string;
  treatmentPlan?: string;
  status: CaseStatus;
  images?: CaseImage[];
}

type FormValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  gender: string;
  contactNumber: string;
  email?: string;
  cases: Array<CaseWithImages>;
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
}

// Form values for update dialog with optional birthDate
type UpdateFormValues = Omit<FormValues, 'birthDate'> & {
  birthDate?: string;
}

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  cases: z.array(z.object({
    title: z.string().min(1, "Case title is required"),
    description: z.string().min(1, "Description is required"),
    treatmentPlan: z.string().optional(),
    status: z.enum(["Active", "Completed", "Cancelled"] as const)
  })).min(1, "At least one case is required"),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    contactNumber: z.string().optional(),
  }).optional(),
  allergies: z.string().optional(),
})

// Separate schema for update dialog with optional birthDate
const updateFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  cases: z.array(z.object({
    title: z.string().min(1, "Case title is required"),
    description: z.string().min(1, "Description is required"),
    treatmentPlan: z.string().optional(),
    status: z.enum(["Active", "Completed", "Cancelled"] as const)
  })).min(1, "At least one case is required"),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    contactNumber: z.string().optional(),
  }).optional(),
  allergies: z.string().optional(),
})

interface Patient {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  gender: string;
  contactNumber: string;
  email?: string;
  cases?: Array<{
    _id?: string;
    title: string;
    description: string;
    treatmentPlan?: string;
    status: CaseStatus;
    images?: Array<{
      _id?: string;
      filename: string;
      originalName: string;
      path: string;
      mimeType: string;
      size: number;
      uploadedAt?: string;
      description?: string;
      url?: string;
    }>;
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
}

interface AddPatientDialogProps {
  onPatientAdded?: () => void;
}

interface UpdatePatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated?: () => void;
}

export function AddPatientDialog({ onPatientAdded }: AddPatientDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { createPatient } = usePatients()
  const [cases, setCases] = React.useState<FormValues["cases"]>([{ 
    title: "", 
    description: "", 
    treatmentPlan: "", 
    status: "Active" 
  }])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: "",
      gender: "",
      contactNumber: "",
      email: "",
      cases: [{ 
        title: "", 
        description: "", 
        treatmentPlan: "", 
        status: "Active" 
      }],
      address: {
        street: "",
        city: "",
        province: "",
        postalCode: "",
      },
      emergencyContact: {
        name: "",
        relationship: "",
        contactNumber: "",
      },
      allergies: "",
    },
  })

  const addCase = () => {
    const newCase = { 
      title: "", 
      description: "", 
      treatmentPlan: "", 
      status: "Active" as const
    }
    setCases([...cases, newCase])
    const currentCases = form.getValues("cases")
    form.setValue("cases", [...currentCases, newCase])
  }

  const removeCase = (index: number) => {
    const newCases = cases.filter((_, i) => i !== index)
    setCases(newCases)
    form.setValue("cases", newCases)
  }

  async function onSubmit(values: FormValues) {
    try {
      // Transform FormValues to CreatePatientInput (exclude images from cases)
      const createInput = {
        ...values,
        cases: values.cases.map(caseItem => ({
          title: caseItem.title,
          description: caseItem.description,
          treatmentPlan: caseItem.treatmentPlan,
          status: caseItem.status,
          // Don't include images in create - images are uploaded separately
        }))
      }
      await createPatient(createInput)
      form.reset()
      setOpen(false)
      if (onPatientAdded) {
        onPatientAdded()
      }
    } catch (error) {
      console.error("Failed to create patient:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
          <IconPlus className="text-violet-600 mr-1" />
          <span className="hidden lg:inline">Add Patient</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-xs sm:max-w-lg md:max-w-2xl p-2 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Fill in the patient&apos;s information below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 sm:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-medium">Cases/Treatments</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCase} className="w-full sm:w-auto">
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Case
                </Button>
              </div>
              {cases.map((_, index) => (
                <div key={index} className="space-y-2 sm:space-y-4 p-2 sm:p-4 border rounded-lg bg-slate-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-sm font-medium">Case {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCase(index)}
                        className="text-red-500 hover:text-red-700 w-full sm:w-auto"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <FormField
                      control={form.control}
                      name={`cases.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Title</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select case type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Orthodontic Braces">Orthodontic Braces</SelectItem>
                              <SelectItem value="Cleaning/Oral Prophylaxis">Cleaning/Oral Prophylaxis</SelectItem>
                              <SelectItem value="Extraction">Extraction</SelectItem>
                              <SelectItem value="Teeth Whitening">Teeth Whitening</SelectItem>
                              <SelectItem value="Restoration/Pasta">Restoration/Pasta</SelectItem>
                              <SelectItem value="Dental Crown">Dental Crown</SelectItem>
                              <SelectItem value="Fixed Bridge">Fixed Bridge</SelectItem>
                              <SelectItem value="Veneers">Veneers</SelectItem>
                              <SelectItem value="Denture">Denture</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cases.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`cases.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the case details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cases.${index}.treatmentPlan`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment Plan (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the treatment plan..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm font-medium">Address (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="address.province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm font-medium">Emergency Contact (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Contact Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Relationship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="emergencyContact.contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Penicillin, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button type="submit" className="w-full sm:w-auto">Save Patient</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function UpdatePatientDialog({ patient, open, onOpenChange, onPatientUpdated }: UpdatePatientDialogProps) {
  const { updatePatient, uploadCaseImages, deleteCaseImage } = usePatients()
  const [cases, setCases] = React.useState<FormValues["cases"]>(
    (patient.cases || [{ title: "", description: "", treatmentPlan: "", status: "Active" }]).map(caseItem => ({
      ...caseItem,
      ...(('images' in caseItem && caseItem.images) ? { images: caseItem.images } : {})
    }))
  )
  const [caseImages, setCaseImages] = React.useState<Record<number, File[]>>({})
  const [deletingImages, setDeletingImages] = React.useState<Set<string>>(new Set())

  const handleImageChange = (
    caseIndex: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setCaseImages(prev => ({
        ...prev,
        [caseIndex]: [...(prev[caseIndex] || []), ...fileArray]
      }));
    }
  };

  const removeImage = (caseIndex: number, imageIndex: number) => {
    setCaseImages(prev => {
      const newImages = { ...prev };
      if (newImages[caseIndex]) {
        newImages[caseIndex] = newImages[caseIndex].filter((_, i) => i !== imageIndex);
        if (newImages[caseIndex].length === 0) {
          delete newImages[caseIndex];
        }
      }
      return newImages;
    });
  };

  const handleDeleteExistingImage = async (caseIndex: number, imageId: string, caseId?: string) => {
    if (!caseId || !imageId) return;
    
    try {
      setDeletingImages(prev => new Set(prev).add(imageId));
      await deleteCaseImage(patient._id, caseId, imageId);
      
      // Remove image from local state
      setCases(prev => {
        const updated = [...prev];
        if (updated[caseIndex] && updated[caseIndex].images) {
          updated[caseIndex] = {
            ...updated[caseIndex],
            images: updated[caseIndex].images!.filter(
              (img: CaseImage) => img._id !== imageId
            )
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = React.useCallback((dateString: string | undefined): string => {
    if (!dateString) return "";
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return "";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return "";
    }
  }, []);

  // Format birth date once
  const formattedBirthDate = React.useMemo(() => formatDateForInput(patient.birthDate), [patient.birthDate, formatDateForInput]);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: patient.firstName || "",
      middleName: patient.middleName || "",
      lastName: patient.lastName || "",
      birthDate: formattedBirthDate,
      gender: patient.gender || "",
      contactNumber: patient.contactNumber || "",
      email: patient.email || "",
      cases: patient.cases || [{ title: "", description: "", treatmentPlan: "", status: "Active" }],
      address: {
        street: patient.address?.street || "",
        city: patient.address?.city || "",
        province: patient.address?.province || "",
        postalCode: patient.address?.postalCode || "",
      },
      emergencyContact: {
        name: patient.emergencyContact?.name || "",
        relationship: patient.emergencyContact?.relationship || "",
        contactNumber: patient.emergencyContact?.contactNumber || "",
      },
      allergies: patient.allergies || "",
    },
  })

  // Clear validation errors when dialog opens and form is reset
  React.useEffect(() => {
    if (open && formattedBirthDate) {
      form.clearErrors('birthDate');
      form.setValue('birthDate', formattedBirthDate, { shouldValidate: false });
    }
  }, [open, formattedBirthDate, form]);

  // Update form values when patient changes
  React.useEffect(() => {
    if (patient) {
      const patientCases = patient.cases || [{ title: "", description: "", treatmentPlan: "", status: "Active" as const }];
      setCases(patientCases);
      const formattedDate = formatDateForInput(patient.birthDate);
      form.reset({
        firstName: patient.firstName || "",
        middleName: patient.middleName || "",
        lastName: patient.lastName || "",
        birthDate: formattedDate,
        gender: patient.gender || "",
        contactNumber: patient.contactNumber || "",
        email: patient.email || "",
        cases: patientCases,
        address: {
          street: patient.address?.street || "",
          city: patient.address?.city || "",
          province: patient.address?.province || "",
          postalCode: patient.address?.postalCode || "",
        },
        emergencyContact: {
          name: patient.emergencyContact?.name || "",
          relationship: patient.emergencyContact?.relationship || "",
          contactNumber: patient.emergencyContact?.contactNumber || "",
        },
        allergies: patient.allergies || "",
      });
      // Reset image state when patient changes
      setCaseImages({});
      setDeletingImages(new Set());
    }
  }, [patient, form, formatDateForInput]);

  const addCase = () => {
    const newCase = { 
      title: "", 
      description: "", 
      treatmentPlan: "", 
      status: "Active" as const
    }
    setCases([...cases, newCase])
    const currentCases = form.getValues("cases")
    form.setValue("cases", [...currentCases, newCase])
  }

  const removeCase = (index: number) => {
    const newCases = cases.filter((_, i) => i !== index)
    setCases(newCases)
    form.setValue("cases", newCases)
  }

  async function onSubmit(values: UpdateFormValues) {
    try {
      // Update patient first (without images)
      // Convert UpdateFormValues to FormValues for API
      // Always include the original patient's birthDate if not being changed
      // Include case IDs so backend can preserve images
      const formValues: FormValues = {
        ...values,
        // Use the form value if provided, otherwise use the original patient's birthDate
        birthDate: values.birthDate && values.birthDate.trim() !== "" 
          ? values.birthDate 
          : (formattedBirthDate || patient.birthDate || ""),
        // Include case IDs from original patient data to preserve images
        cases: values.cases.map((caseItem, index) => {
          const originalCase = patient.cases?.[index];
          return {
            ...caseItem,
            // Include _id if it exists in the original case
            ...(originalCase?._id ? { _id: originalCase._id } : {})
          };
        })
      };
      const result = await updatePatient(patient._id, formValues)
      
      // Upload images for each case if patient was updated successfully
      if (result && result.patient && result.patient._id) {
        const patientId = result.patient._id;
        
        // Upload images for each case
        for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
          const images = caseImages[caseIndex];
          if (images && images.length > 0 && result.patient.cases && result.patient.cases[caseIndex]) {
            const caseId = result.patient.cases[caseIndex]._id;
            if (caseId) {
              try {
                await uploadCaseImages(patientId, caseId, images);
              } catch (imageError) {
                console.error(`Failed to upload images for case ${caseIndex}:`, imageError);
                // Continue with other cases even if one fails
              }
            }
          }
        }
      }
      
      setCaseImages({})
      onOpenChange(false)
      if (onPatientUpdated) {
        onPatientUpdated()
      }
    } catch (error) {
      console.error("Failed to update patient:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-lg md:max-w-2xl p-2 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Update Patient</DialogTitle>
          <DialogDescription>
            Update the patient&apos;s information below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 sm:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-medium">Cases/Treatments</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCase} className="w-full sm:w-auto">
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Case
                </Button>
              </div>
              {cases.map((_, index) => (
                <div key={index} className="space-y-2 sm:space-y-4 p-2 sm:p-4 border rounded-lg bg-slate-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-sm font-medium">Case {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCase(index)}
                        className="text-red-500 hover:text-red-700 w-full sm:w-auto"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <FormField
                      control={form.control}
                      name={`cases.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Title</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select case type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Orthodontic Braces">Orthodontic Braces</SelectItem>
                              <SelectItem value="Cleaning/Oral Prophylaxis">Cleaning/Oral Prophylaxis</SelectItem>
                              <SelectItem value="Extraction">Extraction</SelectItem>
                              <SelectItem value="Teeth Whitening">Teeth Whitening</SelectItem>
                              <SelectItem value="Restoration/Pasta">Restoration/Pasta</SelectItem>
                              <SelectItem value="Dental Crown">Dental Crown</SelectItem>
                              <SelectItem value="Fixed Bridge">Fixed Bridge</SelectItem>
                              <SelectItem value="Veneers">Veneers</SelectItem>
                              <SelectItem value="Denture">Denture</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cases.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`cases.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the case details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cases.${index}.treatmentPlan`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment Plan (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the treatment plan..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>X-Ray/Images (Optional)</FormLabel>
                    
                    {/* Display existing images */}
                    {(cases[index]?.images && cases[index].images.length > 0) || 
                     (patient.cases && patient.cases[index] && patient.cases[index].images && patient.cases[index].images!.length > 0) ? (
                      <div className="space-y-2 mb-2">
                        <p className="text-xs text-muted-foreground">Existing Images:</p>
                        {(cases[index]?.images || patient.cases?.[index]?.images || []).map((image: CaseImage, imgIndex: number) => (
                          <div key={image._id || imgIndex} className="flex items-center justify-between p-2 bg-slate-100 rounded text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {image.url ? (
                                <a 
                                  href={image.url.startsWith('http') ? image.url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${image.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate"
                                >
                                  {image.originalName || image.filename}
                                </a>
                              ) : (
                                <span className="truncate">{image.originalName || image.filename}</span>
                              )}
                            </div>
                            {image._id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const caseId = cases[index]?._id || patient.cases?.[index]?._id;
                                  if (image._id && caseId) {
                                    handleDeleteExistingImage(index, image._id, caseId);
                                  }
                                }}
                                disabled={image._id ? deletingImages.has(image._id) : false}
                                className="text-red-500 hover:text-red-700 ml-2 h-6 w-6 p-0"
                              >
                                <IconX className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    
                    {/* Upload new images */}
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageChange(index, e)}
                      className="cursor-pointer"
                    />
                    {caseImages[index] && caseImages[index].length > 0 && (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs text-muted-foreground">New Images to Upload:</p>
                        {caseImages[index].map((file, imgIndex) => (
                          <div key={imgIndex} className="flex items-center justify-between p-2 bg-slate-100 rounded text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(index, imgIndex)}
                              className="text-red-500 hover:text-red-700 ml-2 h-6 w-6 p-0"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || formattedBirthDate || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm font-medium">Address (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="address.province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl>
                        <Input placeholder="Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm font-medium">Emergency Contact (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Contact Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Relationship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="emergencyContact.contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Penicillin, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Update Patient</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 