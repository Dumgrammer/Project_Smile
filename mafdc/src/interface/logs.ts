export interface Log {
  _id?: string;
  id: string;
  adminId: string;
  adminName: string;
  action: LogAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description: string;
  details: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt?: string;
}

export type LogAction = 
  // Inquiry actions
  | 'INQUIRY_STATUS_UPDATED'
  | 'INQUIRY_ARCHIVED'
  | 'INQUIRY_RESTORED'
  | 'INQUIRY_DELETED'
  | 'INQUIRY_REPLIED'
  // Appointment actions
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_DELETED'
  | 'APPOINTMENT_STATUS_CHANGED'
  // Patient actions
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'PATIENT_DELETED'
  // General actions
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED';

export type EntityType = 'inquiry' | 'appointment' | 'patient' | 'admin' | 'system';

export interface LogStats {
  total: number;
  today: number;
  byAction: Array<{
    _id: LogAction;
    count: number;
  }>;
}

export interface LogResponse {
  logs: Log[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface LogFilters {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: LogAction;
  entityType?: EntityType;
  startDate?: string;
  endDate?: string;
}

export interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PopulatedLog extends Omit<Log, 'adminId'> {
  adminId: Admin;
}

export interface LogStatsResponse {
  stats: LogStats;
}

export interface CleanupResponse {
  message: string;
  deletedCount: number;
}
