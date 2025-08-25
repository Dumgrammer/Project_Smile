'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type FontSizeKey = 'sm' | 'md' | 'lg' | 'xl';

const FONT_SIZE_TO_PX: Record<FontSizeKey, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeKey>('md');

  // Load saved preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      const savedFont = (localStorage.getItem('fontSize') as FontSizeKey) || 'md';
      if (savedFont && FONT_SIZE_TO_PX[savedFont]) {
        setFontSize(savedFont);
        document.documentElement.style.fontSize = FONT_SIZE_TO_PX[savedFont];
      }
    } catch {}
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const changeFontSize = (size: FontSizeKey) => {
    setFontSize(size);
    document.documentElement.style.fontSize = FONT_SIZE_TO_PX[size];
    localStorage.setItem('fontSize', size);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
              <p className="text-slate-600 text-sm sm:text-base">Manage your app preferences</p>
            </div>

            <div className="px-2 sm:px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility</CardTitle>
                  <CardDescription>Control contrast and text size</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div id="tour-dark-mode" className="flex items-center gap-3">
                    <Checkbox id="darkMode" checked={darkMode} onCheckedChange={(v) => toggleDarkMode(Boolean(v))} />
                    <Label htmlFor="darkMode">Dark mode</Label>
                  </div>

                  <div id="tour-font-size" className="grid gap-2 max-w-xs">
                    <Label htmlFor="fontSize">Font size</Label>
                    <Select value={fontSize} onValueChange={(v) => changeFontSize(v as FontSizeKey)}>
                      <SelectTrigger id="fontSize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium (default)</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-slate-500">Applies to overall app text sizing.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


