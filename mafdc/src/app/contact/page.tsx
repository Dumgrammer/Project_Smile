export default function Contact() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="mb-2"><span className="font-medium">Address:</span> 123 Healthcare Street, Medical District, City, Country</p>
            <p className="mb-2"><span className="font-medium">Phone:</span> +1 (555) 123-4567</p>
            <p className="mb-2"><span className="font-medium">Email:</span> info@mafclinic.com</p>
            <p className="mb-2"><span className="font-medium">Hours:</span> Monday-Friday: 8am-6pm, Saturday: 9am-2pm</p>
          </div>
          
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
            <p className="mb-2"><span className="font-medium">Hotline:</span> +1 (555) 911-0000</p>
            <p><span className="font-medium">Available:</span> 24/7</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Send us a Message</h2>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="name" 
                type="text" 
                placeholder="Your Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="email" 
                type="email" 
                placeholder="Your Email"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
                Subject
              </label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="subject" 
                type="text" 
                placeholder="Subject"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                Message
              </label>
              <textarea 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="message" 
                placeholder="Your Message"
                rows={5}
              ></textarea>
            </div>
            <div className="flex items-center justify-end">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
                type="button"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 