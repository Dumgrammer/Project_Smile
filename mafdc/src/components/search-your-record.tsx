'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Mail, Shield, AlertCircle, Phone, MessageSquare } from "lucide-react";
import { usePatients } from "@/hooks/patients/patientHooks";
import type { Patient } from "@/hooks/patients/patientHooks";

interface SearchYourRecordProps {
  onRecordFound: (patientData: Patient) => void;
}

export function SearchYourRecord({ onRecordFound }: SearchYourRecordProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showNoRecordModal, setShowNoRecordModal] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  
  const { getPatients } = usePatients();

  const handleEmailSearch = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Search for patients by email
      const response = await getPatients(1, 100, email);
      const patient = response.patients.find(p => 
        p.email && p.email.toLowerCase() === email.toLowerCase()
      );
      
      if (patient) {
        setFoundPatient(patient);
        setStep('verification');
        
        // Check if verification code was sent
        if (response.verificationCodeSent) {
          toast.success('Verification code sent! Please check your email and enter the 6-digit code.');
        } else {
          toast.error('Patient found but verification code could not be sent. Please try again.');
          setStep('email');
        }
      } else {
        setShowNoRecordModal(true);
      }
    } catch (error) {
      console.error('Error searching for patient:', error);
      toast.error('Failed to search for patient record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    if (!foundPatient) {
      toast.error('Patient data not found. Please try searching again.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify the code with the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/patients/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: foundPatient._id,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        toast.success('Verification successful! Redirecting to appointment booking...');
        onRecordFound(foundPatient);
      } else {
        toast.error(data.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
    setFoundPatient(null);
  };

  const handleTryDifferentEmail = () => {
    setShowNoRecordModal(false);
    setEmail('');
    setFoundPatient(null);
  };

  const handleContactClinic = () => {
    setShowNoRecordModal(false);
    // You can redirect to contact page or open contact modal
    window.open('/contact', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-violet-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {step === 'email' ? 'Search Your Record' : 'Verify Your Identity'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {step === 'email' 
              ? 'Enter your email address to find your patient record'
              : 'Enter the 6-digit verification code sent to your email'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'email' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                onClick={handleEmailSearch}
                disabled={isLoading || !email}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isLoading ? 'Searching...' : 'Search Records'}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have a record?{' '}
                  <a href="/contact" className="text-violet-600 hover:underline">
                    Contact us
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Verification Code
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerification}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Didn't receive the code?{' '}
                  <button 
                    onClick={handleEmailSearch}
                    disabled={isLoading}
                    className="text-violet-600 hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Record Found Modal */}
      <Dialog open={showNoRecordModal} onOpenChange={setShowNoRecordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">No Record Found</DialogTitle>
                <p className="text-sm text-gray-500">We couldn't find your patient record</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                We couldn't find a patient record associated with <strong>{email}</strong>. 
                This could be because:
              </p>
              <ul className="mt-2 text-sm text-orange-700 space-y-1">
                <li>• You haven't visited our clinic before</li>
                <li>• The email address is different from what we have on file</li>
                <li>• There might be a typo in the email address</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">What would you like to do?</h4>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleTryDifferentEmail}
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <Mail className="w-4 h-4" />
                  Try a different email address
                </Button>
                
                <Button 
                  onClick={handleContactClinic}
                  className="w-full justify-start gap-3 bg-violet-600 hover:bg-violet-700"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact the clinic for assistance
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNoRecordModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
