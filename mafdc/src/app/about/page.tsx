import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 sm:py-20 lg:py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-white"></div>
        <div className="container relative mx-auto px-4 md:px-6 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
                About <span className="text-violet-600">MA Florencio</span> Dental Clinic
              </h1>
              <p className="max-w-[700px] mx-auto lg:mx-0 text-gray-600 text-lg md:text-xl">
                Your trusted partner in dental health since 2015. Located at M&F Building National Road cor. Govic Highway Brgy. Del Pilar, Castillejos, Philippines. We combine advanced technology with compassionate care to deliver exceptional dental experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <Link href="/onlineappointment">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 h-auto text-base font-medium w-full sm:w-auto">
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-violet-300 hover:bg-violet-50 text-violet-700 px-8 py-6 h-auto text-base font-medium w-full">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex relative h-[500px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-violet-500 to-violet-800 justify-center items-center">
              <div className="text-white text-center px-8 z-10">
                <Image src="/Mafdc.jpg" alt="MA Florencio Dental Clinic" width={800} height={800} className="rounded-lg" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              Our <span className="text-violet-600">Mission</span> & Vision
            </h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl">
              Dedicated to providing exceptional dental care with compassion and excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Our Mission</CardTitle>
                <CardDescription>What drives us every day</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To provide comprehensive, high-quality dental care in a comfortable and welcoming environment. 
                  We are committed to helping our patients achieve optimal oral health and beautiful smiles 
                  through personalized treatment plans and advanced dental technology.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Our Vision</CardTitle>
                <CardDescription>Where we're headed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To be the leading dental clinic in our community, recognized for excellence in patient care, 
                  innovative treatments, and commitment to dental health education. We strive to create lasting 
                  relationships with our patients and contribute to their overall well-being.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              Our <span className="text-violet-600">Values</span>
            </h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white overflow-hidden text-center">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Excellence</CardTitle>
                <CardDescription>Quality in everything we do</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We maintain the highest standards of dental care, using advanced technology and continuing education to provide exceptional results.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white overflow-hidden text-center">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Compassion</CardTitle>
                <CardDescription>Care with understanding</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We treat every patient with kindness, respect, and understanding, creating a comfortable environment for all dental procedures.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white overflow-hidden text-center">
              <div className="h-1 bg-violet-600 w-full"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">Integrity</CardTitle>
                <CardDescription>Honest and ethical care</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We build trust through honest communication, transparent pricing, and ethical treatment recommendations that prioritize patient health.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
                Our <span className="text-violet-600">Story</span>
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2015, MA Florencio Dental Clinic began with a simple mission: to provide exceptional dental care in a warm, welcoming environment. What started as a small practice has grown into a trusted dental care provider serving our community.
                </p>
                <p>
                  Over the years, we've invested in the latest dental technology and continued education to ensure our patients receive the best possible care. Our team of experienced professionals is dedicated to staying current with the latest advancements in dental medicine.
                </p>
                <p>
                  Today, we're proud to serve thousands of patients and families, helping them achieve healthy, beautiful smiles through comprehensive dental care and personalized treatment plans.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-violet-800 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Experienced dental professionals</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>State-of-the-art technology</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Comfortable, modern facility</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Personalized treatment plans</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Comprehensive dental services</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-20 bg-violet-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to experience exceptional dental care?
              </h2>
              <p className="max-w-[500px] text-violet-200">
                Join our family of satisfied patients and take the first step toward a healthier, more beautiful smile.
              </p>
            </div>
            <Link href="/onlineappointment">
              <Button className="bg-white hover:bg-gray-100 text-violet-900 px-8 py-6 h-auto text-base font-medium">
                Book Your Appointment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 