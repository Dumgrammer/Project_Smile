import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">MA Florencio Dental Clinic</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
                  Home
                </Link>
                <Link href="/services" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
                  Services
                </Link>
                <Link href="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
                  About
                </Link>
                <Link href="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 