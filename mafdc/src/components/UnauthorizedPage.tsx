'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <div className="h-2 bg-red-500 w-full"></div>
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
              <ShieldX className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Access Denied
            </CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this page
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              Please log in with valid credentials to access this page
            </p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

