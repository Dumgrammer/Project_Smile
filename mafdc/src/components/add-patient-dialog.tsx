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
import { IconPlus } from "@tabler/icons-react"

type CaseStatus = "Active" | "Completed" | "Cancelled";

type FormValues = {
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
    status: CaseStatus;
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

interface AddPatientDialogProps {
  onPatientAdded?: () => void;
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
      await createPatient(values)
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
            Fill in the patient's information below. Click save when you're done.
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