'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading, error } = useLogin();
  
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
        <div className="mt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Project Smile. All rights reserved.
        </div>
      </div>
      <Toaster />
    </div>
  );
}
