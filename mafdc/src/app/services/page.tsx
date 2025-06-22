import Image from "next/image";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const services = [
  {
    title: "Orthodontic Braces",
    description: "Professional orthodontic treatment to align teeth and improve your smile. We offer both traditional and modern options.",
    image: "/Braces.png"
  },
  {
    title: "Cleaning/Oral Prophylaxis",
    description: "Professional teeth cleaning to remove plaque, tartar, and stains for a healthier, brighter smile.",
    image: "/Cleaning.png"
  },
  {
    title: "Extraction",
    description: "Safe and comfortable tooth extraction procedures performed by experienced dental professionals.",
    image: "/Extraction.png"
  },
  {
    title: "Teeth Whitening",
    description: "Professional teeth whitening treatments to brighten your smile and boost your confidence.",
    image: "/Whitening.png"
  },
  {
    title: "Restoration/Pasta",
    description: "High-quality dental fillings and restorations to repair cavities and damaged teeth.",
    image: "/Restoration.png"
  },
  {
    title: "Dental Crown",
    description: "Custom-made dental crowns to restore damaged teeth and improve their appearance and function.",
    image: "/Crown.png"
  },
  {
    title: "Fixed Bridge",
    description: "Permanent solution to replace missing teeth and restore your natural smile.",
    image: "/Bridge.png"
  },
  {
    title: "Veneers",
    description: "Thin, custom-made shells to improve the appearance of your teeth and create a perfect smile.",
    image: "/Veneers.png"
  },
  {
    title: "Denture",
    description: "Custom-fitted removable replacements for missing teeth and surrounding tissues.",
    image: "/Dentures.png"
  }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full py-20 relative overflow-hidden bg-gradient-to-br from-violet-50 to-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="container relative mx-auto px-4 md:px-6 z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900">
              Our <span className="text-violet-600">Dental Services</span>
            </h1>
            <p className="max-w-[700px] mx-auto text-gray-600 text-lg">
              Comprehensive dental care services to help you achieve and maintain a healthy, beautiful smile.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-1 bg-violet-600 w-full"></div>
                <div className="relative h-48 w-full">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-gray-900">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-20 bg-violet-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Transform Your Smile?
            </h2>
            <p className="max-w-[600px] text-violet-200">
              Schedule your appointment today and take the first step towards a healthier, more beautiful smile.
            </p>
            <button className="bg-white hover:bg-gray-100 text-violet-900 px-8 py-4 rounded-md text-base font-medium transition-colors duration-300">
              Book an Appointment
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
