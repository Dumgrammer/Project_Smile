'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useInquiries } from "@/hooks/inquiry/inquiryHooks";
import { InquiryFormData } from "@/interface/Inquiry";

export default function Contact() {
  const { submitInquiry, loading } = useInquiries();
  const [formData, setFormData] = useState<InquiryFormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.fullName || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const result = await submitInquiry(formData);
      
      if (result.success) {
        const successMessage = `Thank you for your inquiry! ${result.emailSent ? 'A confirmation email has been sent to you.' : ''}`;
        toast.success(successMessage);
        
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to submit inquiry. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 sm:py-20 lg:py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-white"></div>
        <div className="container relative mx-auto px-4 md:px-6 z-10">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
              Contact <span className="text-violet-600">MA Florencio</span> Dental Clinic
            </h1>
            <p className="max-w-[700px] mx-auto text-gray-600 text-lg md:text-xl">
              Get in touch with us for appointments, inquiries, or emergencies. We&apos;re here to help you achieve your best smile.
            </p>
          </div>
        </div>
      </section>

      {/* Location, Hours & Contact Section */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Google Map */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  📍 Our Location
                </CardTitle>
                <CardDescription>Visit us at our clinic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Address:</p>
                  <p className="text-gray-600">
                    M&F Building National Road cor. Govic Highway<br />
                    Brgy. Del Pilar, Castillejos, Philippines
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Founded:</p>
                  <p className="text-gray-600">2015</p>
                </div>
                <div className="mt-4">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3868.5686775551906!2d120.2040546!3d14.9289331!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339679db396a44e7%3A0xc19ab8b6101ae33c!2sM.A.%20Florencio%20Dental%20Clinic!5e0!3m2!1sen!2sph!4v1735826000000"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            {/* Office Hours & Contact Form */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  💬 Contact Us
                </CardTitle>
                <CardDescription>Office hours and send us a message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Office Hours Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    🕒 Office Hours
                  </h4>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Monday - Friday:</span>
                      <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Saturday:</span>
                      <span className="text-gray-600">Upon Schedule</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Sunday:</span>
                      <span className="text-gray-600">Upon Schedule</span>
                    </div>
                  </div>
                </div>

                {/* Contact Form Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Send us a Message</h4>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-900">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          className="w-full"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          className="w-full"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          className="w-full"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium text-gray-900">
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="What is this regarding?"
                          className="w-full"
                          value={formData.subject}
                          onChange={handleInputChange}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-gray-900">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us how we can help you..."
                        className="min-h-[120px] w-full"
                        value={formData.message}
                        onChange={handleInputChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-violet-600 hover:bg-violet-700 text-white w-full py-3"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Quick Action Section */}
      <section className="w-full py-20 bg-violet-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to schedule your appointment?
              </h2>
              <p className="max-w-[500px] text-violet-200">
                Book your visit online for convenient scheduling. We&apos;re here to provide you with exceptional dental care.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Link href="/onlineappointment">
                <Button className="bg-white hover:bg-gray-100 text-violet-900 px-8 py-6 h-auto text-base font-medium">
                  Book Online
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 