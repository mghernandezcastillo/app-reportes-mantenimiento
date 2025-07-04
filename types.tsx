

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      maintenance_cities: {
        Row: { id: string; name: string; created_at?: string; };
        Insert: { id?: string; name: string; created_at?: string; };
        Update: { id?: string; name?: string; created_at?: string; };
        Relationships: [];
      };
      maintenance_companies: {
        Row: { id: string; name: string; city_id: string; created_at?: string; };
        Insert: { id?: string; name: string; city_id: string; created_at?: string; };
        Update: { id?: string; name?: string; city_id?: string; created_at?: string; };
        Relationships: [];
      };
      maintenance_dependencies: {
        Row: { id: string; name: string; company_id: string; created_at?: string; };
        Insert: { id?: string; name: string; company_id: string; created_at?: string; };
        Update: { id?: string; name?: string; company_id?: string; created_at?: string; };
        Relationships: [];
      };
      maintenance_equipment: {
        Row: {
          id: string;
          created_at?: string;
          model: string;
          brand: string;
          type: string;
          capacity: string | null;
          refrigerant: string | null;
          city_id: string;
          company_id: string;
          dependency_id: string;
          periodicity_months: number;
          last_maintenance_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          model: string;
          brand: string;
          type: string;
          capacity?: string | null;
          refrigerant?: string | null;
          city_id: string;
          company_id: string;
          dependency_id: string;
          periodicity_months: number;
          last_maintenance_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          model?: string;
          brand?: string;
          type?: string;
          capacity?: string | null;
          refrigerant?: string | null;
          city_id?: string;
          company_id?: string;
          dependency_id?: string;
          periodicity_months?: number;
          last_maintenance_date?: string | null;
        };
        Relationships: [];
      };
      maintenance_reports: {
        Row: {
          id: string;
          timestamp: string;
          service_type: "preventivo" | "correctivo";
          observations: string | null;
          equipment_snapshot: Json;
          city_id: string;
          company_id: string;
          dependency_id: string;
          worker_id: string;
          worker_name: string;
          client_signature: string | null;
        };
        Insert: {
          id?: string;
          timestamp: string;
          service_type: "preventivo" | "correctivo";
          observations?: string | null;
          equipment_snapshot: Json;
          city_id: string;
          company_id: string;
          dependency_id: string;
          worker_id: string;
          worker_name: string;
          client_signature?: string | null;
        };
        Update: {
          id?: string;
          timestamp?: string;
          service_type?: "preventivo" | "correctivo";
          observations?: string | null;
          equipment_snapshot?: Json;
          city_id?: string;
          company_id?: string;
          dependency_id?: string;
          worker_id?: string;
          worker_name?: string;
          client_signature?: string | null;
        };
        Relationships: [];
      };
      maintenance_users: {
        Row: {
          id: string;
          username: string;
          password?: string;
          role: "admin" | "worker";
          name: string | null;
          cedula: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          role: "admin" | "worker";
          name?: string | null;
          cedula?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          role?: "admin" | "worker";
          name?: string | null;
          cedula?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
  };
}


export interface User {
    id: string;
    username: string; // For admin: 'admin', for worker: cedula
    password?: string; // Hashed or plain for localStorage, plain for initial setup
    role: 'admin' | 'worker';
    name?: string; // Worker's full name
    cedula?: string; // Worker's ID, also username
    isActive?: boolean;
}

export interface City {
    id: string;
    name: string;
}

export interface Company {
    id: string;
    name: string;
    cityId: string;
}

export interface Dependency {
    id: string;
    name: string;
    companyId: string;
}

export interface Equipment {
    id: string;
    created_at?: string; // ISO date string
    model: string;
    brand: string;
    type: 'Mini split' | 'Cassette' | 'Central' | 'Piso techo' | 'Otro' | string; // string for "Otro"
    capacity?: string; // e.g., "12000 BTU", "5 TR"
    refrigerant?: 'R410A' | 'R22' | 'R32' | 'R134a' | 'R407C' | 'Otro' | string;
    cityId: string;
    companyId: string;
    dependencyId: string;
    periodicityMonths: number; // Maintenance frequency in months
    qrCodeValue?: string; // Optional: if actual QR codes are used
    lastMaintenanceDate?: string; // ISO date string
}

export interface Report {
    id: string;
    timestamp: string; // ISO date string
    serviceType: 'preventivo' | 'correctivo';
    observations: string | null;
    equipmentSnapshot: { // Snapshot of equipment details at the time of report
        id: string; // Original equipment ID
        model: string;
        brand: string;
        type: string;
        capacity?: string;
        refrigerant?: string;
    };
    cityId: string;
    companyId: string;
    dependencyId: string;
    workerId: string; // User ID of the worker
    workerName: string; // Name of the worker
    clientSignature: string | null; // Base64 data URL of the signature image
}

export interface ScheduledMaintenanceItem { // Renamed from ScheduledMaintenance for clarity
    equipment: Equipment;
    nextDueDate: Date;
    daysRemaining: number;
    statusText: string;
    statusColorClass: string;
    lastMaintenanceDate: string;
}


export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems?: number; // Optional: can be useful for display
}

export type MaintenanceTableKey = 
    'myReports' | 
    'adminReports' | 
    'adminSchedule' | 
    'adminEquipment' | 
    'adminCities' | 
    'adminCompanies' | 
    'adminDependencies' | 
    'adminEmployees';