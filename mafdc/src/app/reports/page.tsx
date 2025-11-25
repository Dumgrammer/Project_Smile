'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatients } from '@/hooks/patients/patientHooks';
import { useAppointments } from '@/hooks/appointments/appointmentHooks';
import AuthGuard from '@/components/AuthGuard';
import { useLogs } from '@/hooks/logs/logsHooks';
import { useInquiries } from '@/hooks/inquiry/inquiryHooks';
import type { Patient } from '@/interface/patient';
import type { Appointment } from '@/interface/appointment';
import type { Inquiry } from '@/interface/Inquiry';
import type { Log } from '@/interface/logs';
import { IconFileTypeCsv, IconFileTypePdf, IconFileSpreadsheet, IconEye } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportType = 'patients' | 'appointments' | 'logs' | 'inquiries' | 'archived-patients' | 'finished-appointments';
type DateRangeType = 'day' | 'month' | 'year' | 'custom';

interface Address {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface EmergencyContact {
  name?: string;
  relationship?: string;
  contactNumber?: string;
}

interface Case {
  title?: string;
  [key: string]: unknown;
}

interface PatientInfo {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  [key: string]: unknown;
}

interface AdminInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: unknown;
}

interface EntityInfo {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

// Extended Patient type for reports (may include createdAt from API)
interface PatientWithDates extends Patient {
  createdAt?: string;
  updatedAt?: string;
}

// ReportData can be any of these types or a generic record
type ReportData = PatientWithDates | Appointment | Inquiry | Log | Record<string, unknown>;

const normalizeLogo = (dataUrl: string, size = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to create canvas context'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      const scale = Math.min(size / img.width, size / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (size - drawWidth) / 2;
      const offsetY = (size - drawHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

const loadLogo = async (path: string): Promise<string> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load logo: ${path}`);
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const normalized = await normalizeLogo(reader.result as string);
        resolve(normalized);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('patients');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<ReportData[]>([]);
  const [leftLogo, setLeftLogo] = useState<string | null>(null);
  const [rightLogo, setRightLogo] = useState<string | null>(null);

  const { getPatients } = usePatients();
  const { getAppointments } = useAppointments();
  const { getLogs } = useLogs();
  const { getInquiries } = useInquiries();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    const adminDataCookie = Cookies.get('adminData');
    
    if (!token || !adminDataCookie) {
      router.push('/login');
      return;
    }

    try {
      JSON.parse(adminDataCookie);
    } catch {
      console.error('Error parsing admin data');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Preload clinic logos for PDF export header
  useEffect(() => {
    let isMounted = true;

    const fetchLogos = async () => {
      try {
        const [left, right] = await Promise.all([
          loadLogo('/Nogo.png'),
          loadLogo('/wogo.png'),
        ]);

        if (isMounted) {
          setLeftLogo(left);
          setRightLogo(right);
        }
      } catch (error) {
        console.warn('Unable to load report logos', error);
      }
    };

    fetchLogos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Set default dates based on date range type
  useEffect(() => {
    const today = new Date();
    let start: Date, end: Date;

    switch (dateRangeType) {
      case 'day':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'year':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      default:
        return; // Custom dates, don't auto-set
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  }, [dateRangeType]);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    try {
      setExporting(true);
      let fetchedData: ReportData[] = [];

      switch (reportType) {
        case 'patients':
          try {
            const patientsResponse = await getPatients(1, 10000, '', false);
            console.log('Patients response:', patientsResponse);
            if (patientsResponse && patientsResponse.patients && Array.isArray(patientsResponse.patients)) {
              const start = startOfDay(parseISO(startDate));
              const end = endOfDay(parseISO(endDate));
              fetchedData = patientsResponse.patients.filter((p: PatientWithDates) => {
                // Try createdAt first, then fallback to _id timestamp or include all if no date field
                let dateToCheck: Date | null = null;
                
                if (p.createdAt) {
                  try {
                    dateToCheck = parseISO(p.createdAt);
                  } catch {
                    console.error('Error parsing createdAt for patient:', p._id);
                  }
                } else if (p._id) {
                  // Try to extract timestamp from MongoDB ObjectId (first 8 characters are timestamp)
                  try {
                    const timestamp = parseInt(p._id.substring(0, 8), 16) * 1000;
                    dateToCheck = new Date(timestamp);
                  } catch {
                    // If we can't parse, include the patient anyway
                    console.warn('Could not extract date from _id for patient:', p._id);
                    return true; // Include patient if we can't determine date
                  }
                } else {
                  // If no date field at all, include the patient
                  return true;
                }
                
                if (dateToCheck) {
                  return dateToCheck >= start && dateToCheck <= end;
                }
                
                // Default to including if we can't determine date
                return true;
              });
            } else {
              console.warn('Invalid patients response structure:', patientsResponse);
            }
          } catch (error) {
            console.error('Error fetching patients:', error);
            toast.error('Failed to fetch active patients');
          }
          break;

        case 'archived-patients':
          try {
            const archivedResponse = await getPatients(1, 10000, '', true);
            console.log('Archived patients response:', archivedResponse);
            if (archivedResponse && archivedResponse.patients && Array.isArray(archivedResponse.patients)) {
              const start = startOfDay(parseISO(startDate));
              const end = endOfDay(parseISO(endDate));
              fetchedData = archivedResponse.patients.filter((p: PatientWithDates) => {
                // Try updatedAt first, then fallback to _id timestamp or include all if no date field
                let dateToCheck: Date | null = null;
                
                if (p.updatedAt) {
                  try {
                    dateToCheck = parseISO(p.updatedAt);
                  } catch {
                    console.error('Error parsing updatedAt for archived patient:', p._id);
                  }
                } else if (p._id) {
                  // Try to extract timestamp from MongoDB ObjectId (first 8 characters are timestamp)
                  try {
                    const timestamp = parseInt(p._id.substring(0, 8), 16) * 1000;
                    dateToCheck = new Date(timestamp);
                  } catch {
                    // If we can't parse, include the patient anyway
                    console.warn('Could not extract date from _id for archived patient:', p._id);
                    return true; // Include patient if we can't determine date
                  }
                } else {
                  // If no date field at all, include the patient
                  return true;
                }
                
                if (dateToCheck) {
                  return dateToCheck >= start && dateToCheck <= end;
                }
                
                // Default to including if we can't determine date
                return true;
              });
            } else {
              console.warn('Invalid archived patients response structure:', archivedResponse);
            }
          } catch (error) {
            console.error('Error fetching archived patients:', error);
            toast.error('Failed to fetch archived patients');
          }
          break;

        case 'appointments':
          const appointmentsResponse = await getAppointments();
          if (Array.isArray(appointmentsResponse)) {
            fetchedData = appointmentsResponse.filter((apt: Appointment) => {
              const aptDate = apt.date ? parseISO(apt.date) : null;
              return aptDate && aptDate >= parseISO(startDate) && aptDate <= parseISO(endDate);
            });
          }
          break;

        case 'finished-appointments':
          const finishedResponse = await getAppointments({ status: 'Finished' });
          if (Array.isArray(finishedResponse)) {
            fetchedData = finishedResponse.filter((apt: Appointment) => {
              const aptDate = apt.date ? parseISO(apt.date) : null;
              return aptDate && aptDate >= parseISO(startDate) && aptDate <= parseISO(endDate);
            });
          }
          break;

        case 'logs':
          const logsResponse = await getLogs({
            startDate: format(parseISO(startDate), 'yyyy-MM-dd'),
            endDate: format(parseISO(endDate), 'yyyy-MM-dd'),
            limit: 10000
          });
          if (logsResponse?.success && logsResponse.data?.logs) {
            fetchedData = logsResponse.data.logs;
          }
          break;

        case 'inquiries':
          const inquiriesResponse = await getInquiries(1, 10000);
          if (inquiriesResponse?.success && inquiriesResponse.data?.inquiries) {
            fetchedData = inquiriesResponse.data.inquiries.filter((inq: Inquiry) => {
              const createdDate = inq.createdAt ? parseISO(inq.createdAt) : null;
              return createdDate && createdDate >= parseISO(startDate) && createdDate <= parseISO(endDate);
            });
          }
          break;
      }

      if (fetchedData.length === 0) {
        toast.warning(`No records found for the selected date range. Try adjusting your date range.`);
      } else {
        toast.success(`Fetched ${fetchedData.length} records`);
      }
      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      toast.error(`Failed to fetch data: ${errorMessage}`);
      setData([]);
    } finally {
      setExporting(false);
    }
  }, [reportType, startDate, endDate, getPatients, getAppointments, getLogs, getInquiries]);

  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/,/g, ';');
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  // Helper function to format column headers
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Helper function to format cell values for PDF
  const formatCellValue = (value: unknown, key: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Format patient-specific nested objects
    if (reportType === 'patients' || reportType === 'archived-patients') {
      if (key === 'address' && typeof value === 'object' && value !== null) {
        const addr = value as Address;
        const parts = [];
        if (addr.street) parts.push(addr.street);
        if (addr.city) parts.push(addr.city);
        if (addr.province) parts.push(addr.province);
        if (addr.postalCode) parts.push(addr.postalCode);
        return parts.length > 0 ? parts.join(', ') : '-';
      }
      if (key === 'emergencyContact' && typeof value === 'object' && value !== null) {
        const ec = value as EmergencyContact;
        const parts = [];
        if (ec.name) parts.push(ec.name);
        if (ec.relationship) parts.push(`(${ec.relationship})`);
        if (ec.contactNumber) parts.push(ec.contactNumber);
        return parts.length > 0 ? parts.join(' ') : '-';
      }
      if (key === 'cases' && Array.isArray(value)) {
        if (value.length === 0) return 'No cases';
        return `${value.length} case(s): ${value.map((c: Case) => c.title || 'Untitled').join(', ')}`;
      }
    }
    
    // Format appointment-specific nested objects
    if (reportType === 'appointments' || reportType === 'finished-appointments') {
      if (key === 'patient' && typeof value === 'object' && value !== null) {
        const p = value as PatientInfo;
        const name = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim();
        return name || '-';
      }
      if (key === 'cancellationReason') {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object' && value !== null) {
          const reasonObj = value as { reason?: string; [key: string]: unknown };
          return reasonObj.reason || value.toString() || '-';
        }
        return String(value) || '-';
      }
      if (key === '_id') {
        // Show only last 8 characters of ID for readability
        return String(value).slice(-8) || '-';
      }
    }
    
    // Format logs-specific nested objects
    if (reportType === 'logs') {
      if (key === 'details' && typeof value === 'object' && value !== null) {
        const details = value as Record<string, unknown>;
        const entries = Object.entries(details);
        if (entries.length === 0) return '-';
        // Format key-value pairs in a readable way without JSON
        return entries.map(([k, v]) => {
          const formattedKey = formatHeader(k);
          let formattedValue: string;
          if (v === null || v === undefined) {
            formattedValue = '-';
          } else if (Array.isArray(v)) {
            formattedValue = `${v.length} item(s)`;
          } else if (typeof v === 'object') {
            // For nested objects, show key-value pairs instead of JSON
            const nestedEntries = Object.entries(v);
            if (nestedEntries.length === 0) {
              formattedValue = 'Empty';
            } else {
              formattedValue = nestedEntries.map(([nk, nv]) => 
                `${formatHeader(nk)}: ${nv === null || nv === undefined ? '-' : String(nv)}`
              ).join(', ');
            }
          } else {
            formattedValue = String(v);
          }
          return `${formattedKey}: ${formattedValue}`;
        }).join('; ');
      }
      if (key === 'action' && typeof value === 'string') {
        // Format action: INQUIRY_STATUS_UPDATED -> Inquiry Status Updated
        return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      }
      if (key === 'adminId' && typeof value === 'object' && value !== null) {
        const admin = value as AdminInfo;
        if (admin.firstName || admin.lastName) {
          return `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email || '-';
        }
        return admin.email || String(value) || '-';
      }
      if (key === 'entityId') {
        // Show only last 8 characters of ID for readability
        return String(value).slice(-8) || '-';
      }
      if (key === 'entityName' && typeof value === 'object' && value !== null) {
        // If entityName is an object, format it as readable text
        const entity = value as EntityInfo;
        if (entity.firstName || entity.lastName) {
          return `${entity.firstName || ''} ${entity.middleName || ''} ${entity.lastName || ''}`.trim() || entity.name || '-';
        }
        return entity.name || entity.title || String(value) || '-';
      }
      if (key === '_id') {
        // Show only last 8 characters of ID for readability
        return String(value).slice(-8) || '-';
      }
    }
    
    // Format inquiries-specific nested objects
    if (reportType === 'inquiries') {
      if (key === 'archivedBy' && typeof value === 'object' && value !== null) {
        const admin = value as AdminInfo;
        if (admin.firstName || admin.lastName) {
          return `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email || '-';
        }
        return admin.email || String(value) || '-';
      }
      if (key === '_id') {
        // Show only last 8 characters of ID for readability
        return String(value).slice(-8) || '-';
      }
      // Don't truncate message - let it wrap in the PDF table
    }
    
    // Format date strings
    if (typeof value === 'string') {
      // Check if it's an ISO date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        try {
          const date = parseISO(value);
          // Format based on the field type
          if (key.toLowerCase() === 'starttime' || key.toLowerCase() === 'endtime' || key.toLowerCase() === 'startTime' || key.toLowerCase() === 'endTime') {
            return format(date, 'HH:mm');
          }
          if (key.toLowerCase() === 'date') {
            return format(date, 'MMM dd, yyyy');
          }
          if (key.toLowerCase().includes('date') || key === 'createdAt' || key === 'updatedAt') {
            return format(date, 'MMM dd, yyyy');
          }
          return format(date, 'MMM dd, yyyy HH:mm');
        } catch {
          return value;
        }
      }
    }
    
    // Format other objects (not patient/appointment/logs/inquiries specific)
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // For other objects, show key-value pairs in a readable format
      const entries = Object.entries(value);
      if (entries.length === 0) return '-';
      return entries.slice(0, 3).map(([k, v]) => {
        const formattedKey = formatHeader(k);
        const formattedValue = typeof v === 'object' && v !== null 
          ? (Array.isArray(v) ? `${v.length} item(s)` : 'Object')
          : String(v);
        return `${formattedKey}: ${formattedValue}`;
      }).join('; ') + (entries.length > 3 ? '...' : '');
    }
    
    // Format arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return `${value.length} item(s)`;
    }
    
    return String(value);
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // A4 Landscape dimensions: 297mm x 210mm (842pt x 595pt)
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth(); // ~297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // ~210mm
      
      // Safe margins for A4 printing (20mm on each side)
      const margin = 20; // 20mm = ~57pt, but we'll work in mm
      const contentWidth = pageWidth - (margin * 2); // ~257mm usable width

      // Place clinic logos on both sides of the header if available
      const logoWidth = 45;
      const logoHeight = 45;
      const logoY = 1;
      const leftLogoX = Math.max(0, margin - 8);
      const rightLogoX = Math.min(pageWidth - logoWidth, pageWidth - margin - logoWidth + 8);

      // Swap logos: Smile icon on the left, clinic logo on the right
      if (rightLogo) {
        doc.addImage(rightLogo, 'PNG', leftLogoX, logoY, logoWidth, logoHeight);
      }
      if (leftLogo) {
        doc.addImage(leftLogo, 'PNG', rightLogoX, logoY, logoWidth, logoHeight);
      }
      
      // Add clinic header at the top (centered)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MA Florencio Dental Clinic', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('M&F Building National Road cor. Govic Highway', pageWidth / 2, 22, { align: 'center' });
      doc.text('Brgy. Del Pilar, Castillejos, Philippines', pageWidth / 2, 28, { align: 'center' });
      
      // Report title
      const reportTitle = reportType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Add report title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${reportTitle} Report`, pageWidth / 2, 38, { align: 'center' });
      
      // Add metadata (centered or left-aligned within margins)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const dateRangeText = `Date Range: ${format(parseISO(startDate), 'MMM dd, yyyy')} - ${format(parseISO(endDate), 'MMM dd, yyyy')}`;
      doc.text(dateRangeText, margin, 46);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, margin, 52);
      doc.text(`Total Records: ${data.length}`, margin, 58);

      // Prepare table data with formatted headers and values
      let rawHeaders = Object.keys(data[0]);
      let formattedHeaders: string[];
      let rows: string[][];

      // For appointments, reorder columns and rename title to Treatment
      if (reportType === 'appointments' || reportType === 'finished-appointments') {
        // Define desired column order
        const desiredOrder = ['_id', 'patient', 'title', 'date', 'startTime', 'endTime', 'status', 'cancellationReason'];
        
        // Columns to exclude from the report
        const excludedColumns = ['__v', 'createdAt', 'updatedAt', 'formattedCreatedAt', 'isActive'];
        
        // If _id exists, exclude 'id' to avoid duplicates
        if (rawHeaders.includes('_id')) {
          excludedColumns.push('id');
        }
        
        // Get available columns in desired order, then add any remaining columns
        // Exclude unwanted columns
        const orderedHeaders: string[] = [];
        const remainingHeaders = [...rawHeaders].filter(header => !excludedColumns.includes(header));
        
        desiredOrder.forEach(key => {
          if (rawHeaders.includes(key) && !excludedColumns.includes(key)) {
            orderedHeaders.push(key);
            const index = remainingHeaders.indexOf(key);
            if (index > -1) remainingHeaders.splice(index, 1);
          }
        });
        
        // Add any remaining columns that weren't in the desired order (excluding unwanted columns)
        rawHeaders = [...orderedHeaders, ...remainingHeaders.filter(header => !excludedColumns.includes(header))];
        
        // Format headers and handle special cases
        formattedHeaders = rawHeaders.map(header => {
          if (header === 'title') return 'Treatment';
          if (header === 'cancellationReason') return 'Cancellation Reason (if Applicable)';
          return formatHeader(header);
        });
        
        rows = data.map(row => 
          rawHeaders.map(header => formatCellValue((row as Record<string, unknown>)[header], header))
        );
      } else {
        // For other report types, use default order but exclude unwanted columns
        const excludedColumns = ['__v', 'createdAt', 'updatedAt', 'formattedCreatedAt', 'isActive'];
        
        // If _id exists, exclude 'id' to avoid duplicates
        if (rawHeaders.includes('_id')) {
          excludedColumns.push('id');
        }
        
        rawHeaders = rawHeaders.filter(header => !excludedColumns.includes(header));
        formattedHeaders = rawHeaders.map(formatHeader);
        rows = data.map(row => 
          rawHeaders.map(header => formatCellValue((row as Record<string, unknown>)[header], header))
        );
      }

      // Build column styles with special handling for description and message columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columnStyles: Record<string, any> = {};
      
      // Find description column (for logs)
      const descriptionIndex = formattedHeaders.findIndex(h => 
        h.toLowerCase().includes('description') || h.toLowerCase() === 'description'
      );
      
      // Find message column (for inquiries)
      const messageIndex = formattedHeaders.findIndex(h => 
        h.toLowerCase().includes('message') || h.toLowerCase() === 'message'
      );
      
      // Find entity name column (for logs)
      const entityNameIndex = formattedHeaders.findIndex(h => 
        h.toLowerCase().includes('entity name') || h.toLowerCase() === 'entity name'
      );
      
      // Apply wrapping styles to description and message columns
      [descriptionIndex, messageIndex].forEach(index => {
        if (index !== -1) {
          columnStyles[index] = {
            cellWidth: 'auto',
            overflow: 'linebreak',
            minCellHeight: 8,
            valign: 'top'
          };
        }
      });
      
      // Ensure Entity Name column has enough width
      if (entityNameIndex !== -1) {
        columnStyles[entityNameIndex] = {
          cellWidth: 'auto',
          overflow: 'linebreak',
          minCellHeight: 8,
          valign: 'top'
        };
      }
      
      // Add table with improved styling - optimized for A4 landscape
      autoTable(doc, {
        head: [formattedHeaders],
        body: rows,
        startY: 65,
        styles: { 
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          cellWidth: 'auto',
          font: 'helvetica',
          fontStyle: 'normal',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        headStyles: { 
          fillColor: [51, 51, 51], // Dark gray for formal look
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 8,
          overflow: 'linebreak', // Allow header text to wrap to multiple lines
          cellPadding: 2.5,
          minCellHeight: 8
        },
        bodyStyles: {
          overflow: 'linebreak',
          cellPadding: 2.5,
          valign: 'top'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: columnStyles,
        margin: { 
          top: 65, 
          left: margin, 
          right: margin,
          bottom: 20
        },
        tableWidth: contentWidth, // Use calculated content width
        showHead: 'everyPage',
        showFoot: 'everyPage',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didDrawCell: (data: any) => {
          // Ensure cells with long text wrap properly
          if (data.cell && data.cell.text && data.cell.text.length > 0) {
            // autoTable handles wrapping automatically with overflow: 'linebreak'
          }
        }
      });

      // Add page numbers if multiple pages (positioned within margins)
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      doc.save(`${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold text-slate-800">Reports & Exports</h1>
                <p className="text-slate-600">Generate and export reports in CSV, Excel, or PDF format</p>
              </div>

              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Select report type and date range, then fetch and export data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Report Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                        <SelectTrigger id="reportType">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patients">Active Patients</SelectItem>
                          <SelectItem value="archived-patients">Archived Patients</SelectItem>
                          <SelectItem value="appointments">Appointments</SelectItem>
                          <SelectItem value="finished-appointments">Finished Appointments</SelectItem>
                          <SelectItem value="logs">System Logs</SelectItem>
                          <SelectItem value="inquiries">Inquiries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range Type */}
                    <div className="space-y-2">
                      <Label htmlFor="dateRangeType">Date Range Type</Label>
                      <Select value={dateRangeType} onValueChange={(value) => setDateRangeType(value as DateRangeType)}>
                        <SelectTrigger id="dateRangeType">
                          <SelectValue placeholder="Select date range type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Today</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          disabled={dateRangeType !== 'custom'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          disabled={dateRangeType !== 'custom'}
                        />
                      </div>
                    </div>

                    {/* Fetch Button */}
                    <Button 
                      onClick={fetchData} 
                      disabled={exporting || !startDate || !endDate}
                      className="w-full"
                    >
                      {exporting ? 'Fetching...' : 'Fetch Data'}
                    </Button>

                    {/* Data Count */}
                    {data.length > 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {data.length} records loaded
                        </p>
                      </div>
                    )}

                    {/* Export Buttons */}
                    {data.length > 0 && (
                      <div className="space-y-4">
                        <Label>Export Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button
                            onClick={exportToCSV}
                            variant="outline"
                            className="w-full flex items-center gap-2"
                          >
                            <IconFileTypeCsv className="h-5 w-5" />
                            Export CSV
                          </Button>
                          <Button
                            onClick={exportToExcel}
                            variant="outline"
                            className="w-full flex items-center gap-2"
                          >
                            <IconFileSpreadsheet className="h-5 w-5" />
                            Export Excel
                          </Button>
                          <Button
                            onClick={exportToPDF}
                            variant="outline"
                            className="w-full flex items-center gap-2"
                          >
                            <IconFileTypePdf className="h-5 w-5" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Preview Section */}
                {data.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <IconEye className="h-5 w-5" />
                            Report Preview
                          </CardTitle>
                          <CardDescription>
                            Preview of {data.length} records that will be exported
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <div className="max-h-[600px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {data.length > 0 && Object.keys(data[0]).slice(0, 10).map((key) => (
                                  <TableHead key={key} className="capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </TableHead>
                                ))}
                                {Object.keys(data[0] || {}).length > 10 && (
                                  <TableHead>...</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.slice(0, 100).map((row, index) => (
                                <TableRow key={index}>
                                  {Object.keys(data[0]).slice(0, 10).map((key) => (
                                    <TableCell key={key} className="max-w-[200px] truncate">
                                      {(() => {
                                        const value = (row as Record<string, unknown>)[key];
                                        if (value === null || value === undefined) return '-';
                                        
                                        // Format patient-specific nested objects
                                        if (reportType === 'patients' || reportType === 'archived-patients') {
                                          if (key === 'address' && typeof value === 'object' && value !== null) {
                                            const addr = value as Address;
                                            const parts = [];
                                            if (addr.street) parts.push(addr.street);
                                            if (addr.city) parts.push(addr.city);
                                            if (addr.province) parts.push(addr.province);
                                            if (addr.postalCode) parts.push(addr.postalCode);
                                            return parts.length > 0 ? parts.join(', ') : '-';
                                          }
                                          if (key === 'emergencyContact' && typeof value === 'object' && value !== null) {
                                            const ec = value as EmergencyContact;
                                            const parts = [];
                                            if (ec.name) parts.push(ec.name);
                                            if (ec.relationship) parts.push(`(${ec.relationship})`);
                                            if (ec.contactNumber) parts.push(ec.contactNumber);
                                            return parts.length > 0 ? parts.join(' ') : '-';
                                          }
                                          if (key === 'cases' && Array.isArray(value)) {
                                            if (value.length === 0) return 'No cases';
                                            return `${value.length} case(s): ${value.map((c: Case) => c.title || 'Untitled').join(', ')}`;
                                          }
                                          if (key === 'patient' && typeof value === 'object' && value !== null) {
                                            const p = value as PatientInfo;
                                            return `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim() || '-';
                                          }
                                        }
                                        
                                        // Format appointment-specific nested objects
                                        if (reportType === 'appointments' || reportType === 'finished-appointments') {
                                          if (key === 'patient' && typeof value === 'object' && value !== null) {
                                            const p = value as PatientInfo;
                                            return `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim() || '-';
                                          }
                                        }
                                        
                                        // Format date strings
                                        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                                          try {
                                            return format(parseISO(value), 'MMM dd, yyyy');
                                          } catch {
                                            return value;
                                          }
                                        }
                                        
                                        // Format other objects (not patient/appointment specific)
                                        if (typeof value === 'object' && !Array.isArray(value)) {
                                          // For logs details or other objects, show key-value pairs
                                          const entries = Object.entries(value);
                                          if (entries.length === 0) return '-';
                                          return entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ') + (entries.length > 2 ? '...' : '');
                                        }
                                        
                                        // Format arrays
                                        if (Array.isArray(value)) {
                                          if (value.length === 0) return '-';
                                          return `${value.length} item(s)`;
                                        }
                                        
                                        return String(value).substring(0, 100);
                                      })()}
                                    </TableCell>
                                  ))}
                                  {Object.keys(data[0]).length > 10 && (
                                    <TableCell className="text-slate-500">
                                      +{Object.keys(data[0]).length - 10} more
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {data.length > 100 && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t text-sm text-slate-600 dark:text-slate-400">
                            Showing first 100 of {data.length} records. All records will be included in the export.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  );
}

