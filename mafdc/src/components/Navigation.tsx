"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
              <Image 
                src="/Mafdc.jpg" 
                alt="MA Florencio Dental Clinic" 
                width={40} 
                height={40} 
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">MA Florencio Dental Clinic</span>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  href="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/' 
                      ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400' 
                      : 'text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/services" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/services' 
                      ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400' 
                      : 'text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400'
                  }`}
                >
                  Services
                </Link>
                <Link 
                  href="/about" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/about' 
                      ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400' 
                      : 'text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400'
                  }`}
                >
                  About
                </Link>
                <Link 
                  href="/contact" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/contact' 
                      ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400' 
                      : 'text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400'
                  }`}
                >
                  Contact
                </Link>
                <Link 
                  href="/onlineappointment" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/onlineappointment' 
                      ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400' 
                      : 'text-gray-700 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400'
                  }`}
                >
                  Create Appointment
                </Link>
              </div>
            </div>
            <div className="md:hidden flex items-center">
              <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" className="dark:text-white dark:hover:bg-gray-700">
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)} 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/' 
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-gray-50 dark:bg-gray-800' 
                  : 'text-gray-700 hover:text-violet-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-violet-400 dark:hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/services" 
              onClick={() => setIsOpen(false)} 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/services' 
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-gray-50 dark:bg-gray-800' 
                  : 'text-gray-700 hover:text-violet-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-violet-400 dark:hover:bg-gray-800'
              }`}
            >
              Services
            </Link>
            <Link 
              href="/about" 
              onClick={() => setIsOpen(false)} 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/about' 
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-gray-50 dark:bg-gray-800' 
                  : 'text-gray-700 hover:text-violet-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-violet-400 dark:hover:bg-gray-800'
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setIsOpen(false)} 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/contact' 
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-gray-50 dark:bg-gray-800' 
                  : 'text-gray-700 hover:text-violet-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-violet-400 dark:hover:bg-gray-800'
              }`}
            >
              Contact
            </Link>
            <Link 
              href="/onlineappointment" 
              onClick={() => setIsOpen(false)} 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/onlineappointment' 
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-gray-50 dark:bg-gray-800' 
                  : 'text-gray-700 hover:text-violet-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-violet-400 dark:hover:bg-gray-800'
              }`}
            >
              Create Appointment
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 