'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 sm:py-20 lg:py-32 relative overflow-hidden bg-white">
        {/* Gradient background instead of image */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-white"></div>
        <div className="container relative mx-auto px-4 md:px-6 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
                Your <span className="text-violet-600">Perfect Smile</span> Starts Here
              </h1>
              <p className="max-w-[700px] mx-auto lg:mx-0 text-gray-600 text-lg md:text-xl">
                MA Florencio Dental Clinic provides exceptional dental care with state-of-the-art technology and a gentle touch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Link href="/onlineappointment">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 h-auto text-base font-medium w-full sm:w-auto">
                  Create an appointment
                </Button>
                </Link>
                <Link href="/services" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-violet-300 hover:bg-violet-50 text-violet-700 px-8 py-6 h-auto text-base font-medium w-full">
                    Our Services
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex relative h-[500px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-violet-500 to-violet-800 justify-center items-center">
              <div className="text-white text-center px-8 z-10">
                <Image src="/Mafdc.jpg" alt="MA Florencio Dental Clinic Logo" width={800} height={800} className="rounded-lg" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              Our <span className="text-violet-600">Services</span>
            </h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl">
              Comprehensive dental care for the entire family
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">General Dentistry</CardTitle>
                <CardDescription>Routine check-ups and preventative care</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Complete exams, cleanings, fillings, and preventative treatments to maintain your oral health.
                </p>
              </CardContent>
            </Card>
            
            {/* Service 2 */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Cosmetic Dentistry</CardTitle>
                <CardDescription>Enhance your smile</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Teeth whitening, veneers, bonding, and smile makeovers to help you achieve the perfect smile.
                </p>
              </CardContent>
            </Card>
            
            {/* Service 3 */}
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Restorative Care</CardTitle>
                <CardDescription>Repair damaged teeth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Crowns, bridges, implants, and dentures to restore functionality and aesthetics to your smile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-20 bg-violet-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready for a healthier smile?
              </h2>
              <p className="max-w-[500px] text-violet-200">
                Schedule your dental appointment today and take the first step toward optimal oral health.
              </p>
            </div>
            <Link href="/contact">
              <Button className="bg-white hover:bg-gray-100 text-violet-900 px-8 py-6 h-auto text-base font-medium">
                Contact Us Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
