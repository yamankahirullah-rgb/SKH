import { User } from '@supabase/supabase-js';

export interface Account {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Profile {
  id: string; // user id from auth
  account_id: string;
  email: string;
}

// Base type for all database records
// FIX: Export DbRecord so it can be used as a type constraint in other files.
export interface DbRecord {
  id: string;
  account_id: string;
  created_at: string;
  created_by: string; // user id
}

export interface JointType extends DbRecord {
  name: string;
}

export interface Material extends DbRecord {
  name: string;
  minStockLevel: number;
  jointTypeId: string;
}

export interface Warehouse extends DbRecord {
  name: string;
}

export interface InventoryItem {
  materialId: string;
  warehouseId: string;
  quantity: number;
  // This is a view/join, not a table, so it doesn't need full DbRecord fields
}

export interface Technician extends DbRecord {
  name: string;
}

export interface OperationType extends DbRecord {
  name: string;
}

export interface UsedMaterial {
  materialId: string;
  quantity: number;
}

export interface Operation extends DbRecord {
  patientName: string;
  operationTypeId: string;
  jointTypeId: string;
  doctorName?: string;
  technicianId?: string;
  assistantTechnicianId?: string;
  warehouseId: string;
  materialsUsed: UsedMaterial[];
  date: string;
  notes?: string;
  priceUSD?: number;
  priceSYP?: number;
}

export interface StockTransfer extends DbRecord {
    materialId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    date: string;
}

export interface AuditLogEntry {
  id: number;
  created_at: string;
  user_id: string;
  user_email: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_data?: any;
  new_data?: any;
}


export interface AppState {
  jointTypes: JointType[];
  materials: Material[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  technicians: Technician[];
  operationTypes: OperationType[];
  operations: Operation[];
  stockTransfers: StockTransfer[];
  profiles: Profile[];
}