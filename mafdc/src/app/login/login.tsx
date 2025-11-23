'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from "@/components/ui/use-toast";
import { useLogin } from '@/hooks/loginController';
import { Toaster } from '@/components/ui/toaster';
import { FileText, Shield } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading, error } = useLogin();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Show error toast if login error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Check if already logged in
  useEffect(() => {
    const token = Cookies.get('accessToken');
    const adminData = Cookies.get('adminData');
    
    if (token && adminData) {
      router.push('/dashboard');
    }
  }, [router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await login(values);
    
    if (result.success) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default"
      });
      router.push('/appointments');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 p-4 sm:p-6 md:p-10 lg:p-12">
      <div className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl flex-1 flex flex-col justify-center">
        {/* Logo or Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            Project Smile
          </h1>
          <p className="mt-2 text-slate-600">Access your dental clinic portal</p>
        </div>
        
        <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
          <div className="h-2 bg-violet-600 w-full"></div> {/* Violet top border */}
          <CardHeader className="space-y-1 px-6 py-6 border-b bg-white">
            <CardTitle className="text-2xl font-bold text-slate-800">Admin Login</CardTitle>
            <CardDescription className="text-slate-500">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          className="p-3 h-12 rounded-lg border-slate-300 focus:border-violet-500 focus:ring-violet-500 transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="p-3 h-12 rounded-lg border-slate-300 focus:border-violet-500 focus:ring-violet-500 transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-violet-600 rounded border-slate-300"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                      Remember me
                    </label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-sm transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 space-y-2">
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setShowTerms(true)}
              className="flex items-center space-x-1 text-violet-600 hover:text-violet-700 transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>Terms & Conditions</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setShowPrivacy(true)}
              className="flex items-center space-x-1 text-violet-600 hover:text-violet-700 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Privacy Policy</span>
            </button>
          </div>
          <div>
            &copy; {new Date().getFullYear()} MA Florencio Dental Clinic. All rights reserved.
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-violet-600" />
              <span>Terms and Conditions</span>
            </DialogTitle>
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
                <p>By accessing and using the MA Florencio Dental Clinic management system, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">2. System Usage</h3>
                <p><strong>Authorized Access:</strong> This system is intended for authorized healthcare professionals and staff members only. Unauthorized access is strictly prohibited.</p>
                <p><strong>Patient Data:</strong> All patient information must be handled in accordance with HIPAA regulations and other applicable privacy laws.</p>
                <p><strong>Appointment Management:</strong> Users are responsible for accurate scheduling, rescheduling, and cancellation of patient appointments.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3. Data Security and Privacy</h3>
                <p><strong>Confidentiality:</strong> All patient health information (PHI) accessed through this system must remain confidential and secure.</p>
                <p><strong>Access Controls:</strong> Users must maintain the security of their login credentials and not share account access with unauthorized individuals.</p>
                <p><strong>Data Encryption:</strong> All sensitive data is encrypted both in transit and at rest to ensure maximum security.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">4. User Responsibilities</h3>
                <p><strong>Accurate Information:</strong> Users must ensure all patient information entered is accurate and up-to-date.</p>
                <p><strong>Professional Conduct:</strong> Use of this system must align with professional healthcare standards and ethical guidelines.</p>
                <p><strong>System Integrity:</strong> Users must not attempt to breach security measures or access unauthorized areas of the system.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">5. Appointment System</h3>
                <p><strong>Online Booking:</strong> Patients may request appointments online, which are subject to confirmation by clinic staff.</p>
                <p><strong>Cancellation Policy:</strong> Appointments may be cancelled with appropriate documentation and patient notification.</p>
                <p><strong>No-Show Policy:</strong> Missed appointments will be automatically marked as cancelled by the system.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">6. Communication and Notifications</h3>
                <p><strong>Email Communications:</strong> The system will send automated emails for appointment confirmations, reminders, and updates.</p>
                <p><strong>Contact Information:</strong> Users must maintain current contact information for effective communication.</p>
                <p><strong>Inquiry Management:</strong> All patient inquiries must be responded to in a timely and professional manner.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">7. System Availability</h3>
                <p><strong>Maintenance:</strong> The system may be temporarily unavailable during scheduled maintenance periods.</p>
                <p><strong>Technical Support:</strong> Technical issues should be reported promptly to system administrators.</p>
                <p><strong>Data Backup:</strong> Regular backups are performed to ensure data integrity and availability.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">8. Compliance and Legal</h3>
                <p><strong>Healthcare Regulations:</strong> All system usage must comply with applicable healthcare regulations and standards.</p>
                <p><strong>Audit Trail:</strong> The system maintains comprehensive logs of all user activities for compliance and security purposes.</p>
                <p><strong>Legal Obligations:</strong> Users must comply with all local, state, and federal laws regarding healthcare data management.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">9. Limitation of Liability</h3>
                <p>MA Florencio Dental Clinic shall not be liable for any indirect, incidental, special, or consequential damages arising from system usage.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">10. Updates to Terms</h3>
                <p>These terms may be updated periodically. Users will be notified of significant changes and continued use constitutes acceptance of updated terms.</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTerms(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-violet-600" />
              <span>Privacy Policy</span>
            </DialogTitle>
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Information We Collect</h3>
                <p><strong>Patient Information:</strong> We collect and store personal health information including but not limited to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Personal identification (name, address, phone, email)</li>
                  <li>Medical history and dental records</li>
                  <li>Appointment history and treatment notes</li>
                  <li>Payment and insurance information</li>
                  <li>Emergency contact information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">2. How We Use Your Information</h3>
                <p><strong>Treatment and Care:</strong> Patient information is used to provide dental care, track treatment progress, and maintain medical records.</p>
                <p><strong>Appointment Management:</strong> We use contact information to schedule, confirm, and manage appointments.</p>
                <p><strong>Communication:</strong> We may contact patients regarding appointments, treatment plans, and clinic updates.</p>
                <p><strong>Billing and Insurance:</strong> Information is used for billing purposes and insurance claim processing.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3. Data Security Measures</h3>
                <p><strong>Encryption:</strong> All patient data is encrypted using industry-standard encryption methods both in transit and at rest.</p>
                <p><strong>Access Controls:</strong> Access to patient information is restricted to authorized personnel only, with role-based permissions.</p>
                <p><strong>Secure Storage:</strong> All data is stored on secure servers with regular security updates and monitoring.</p>
                <p><strong>Audit Logging:</strong> All system access and data modifications are logged for security and compliance purposes.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">4. Information Sharing</h3>
                <p><strong>Healthcare Providers:</strong> Information may be shared with other healthcare providers involved in your care.</p>
                <p><strong>Insurance Companies:</strong> Information may be shared with insurance providers for claim processing and authorization.</p>
                <p><strong>Legal Requirements:</strong> Information may be disclosed when required by law or legal process.</p>
                <p><strong>Emergency Situations:</strong> Information may be shared in medical emergencies to ensure proper care.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">5. Patient Rights</h3>
                <p><strong>Access:</strong> Patients have the right to access their medical records and request copies.</p>
                <p><strong>Correction:</strong> Patients may request corrections to inaccurate information in their records.</p>
                <p><strong>Restriction:</strong> Patients may request restrictions on how their information is used or disclosed.</p>
                <p><strong>Complaint:</strong> Patients have the right to file complaints regarding privacy practices.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">6. Online Appointment System</h3>
                <p><strong>Booking Information:</strong> Information provided during online appointment booking is securely transmitted and stored.</p>
                <p><strong>Confirmation Emails:</strong> Appointment confirmations and reminders are sent via secure email systems.</p>
                <p><strong>Patient Portal:</strong> Patients can securely access their appointment history and treatment information.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">7. Data Retention</h3>
                <p><strong>Medical Records:</strong> Patient medical records are retained according to state and federal regulations.</p>
                <p><strong>Appointment Records:</strong> Appointment history is maintained for continuity of care and scheduling purposes.</p>
                <p><strong>Communication Logs:</strong> Records of patient communications are retained for quality assurance and compliance.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">8. Third-Party Services</h3>
                <p><strong>Email Services:</strong> We use secure email services for appointment notifications and communications.</p>
                <p><strong>Payment Processing:</strong> Payment information is processed through secure, PCI-compliant payment processors.</p>
                <p><strong>Cloud Storage:</strong> Data may be stored using secure cloud storage services with appropriate safeguards.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">9. HIPAA Compliance</h3>
                <p>This system is designed to comply with the Health Insurance Portability and Accountability Act (HIPAA) and other applicable privacy regulations. All staff members are trained on HIPAA requirements and privacy protection.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">10. Contact Information</h3>
                <p>For questions about this privacy policy or your protected health information, please contact:</p>
                <div className="ml-4">
                  <p><strong>MA Florencio Dental Clinic</strong></p>
                  <p>Privacy Officer</p>
                  <p>Phone: (123) 456-7890</p>
                  <p>Email: privacy@maflorenciodental.com</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 mt-1">This policy is compliant with HIPAA and applicable healthcare privacy regulations.</p>
              </div>
        </div>
      </div>
          <DialogFooter>
            <Button onClick={() => setShowPrivacy(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
