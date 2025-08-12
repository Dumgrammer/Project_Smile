export interface Inquiry {
  _id?: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Read' | 'Replied';
  isArchived: boolean;
  archiveReason?: string;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  formattedCreatedAt?: string;
}

export interface InquiryFormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface InquiryStats {
  total: number;
  unread: number;
  byStatus: Array<{
    _id: string;
    count: number;
  }>;
}

export interface InquiryResponse {
  inquiries: Inquiry[];
  totalPages: number;
  currentPage: number;
  total: number;
  stats: InquiryStats;
}
