// Defines the shape of a user profile, linking a user to an account.
export interface Profile {
  id: string; // Corresponds to Supabase auth user ID
  email: string;
  account_id: string; // The account (organization/tenant) the user belongs to
  password_set_at?: string | null; // Tracks if the user has set their password
}

// Represents a surgical operation record.
export interface Operation {
  id: string;
  patientName: string;
  operationTypeId: string;
  jointTypeId: string;
  technicianId?: string | null;
  assistantTechnicianId?: string | null;
  warehouseId: string;
  materialsUsed: UsedMaterial[];
  date: string; // ISO date string (e.g., "2023-10-27")
  notes?: string | null;
  priceUSD?: number | null;
  priceSYP?: number | null;
  doctorName?: string | null;
  created_at: string;
  account_id: string;
}

// Details of a specific material used in an operation.
export interface UsedMaterial {
  materialId: string;
  quantity: number;
}

// Represents a type of material in the inventory.
export interface Material {
  id: string;
  name: string;
  minStockLevel: number;
  jointTypeIds?: string[] | null; // Can be linked to multiple joint types or be generic
  account_id: string;
}

// Represents a physical warehouse or storage location.
export interface Warehouse {
  id: string;
  name: string;
  account_id: string;
}

// Represents a type of joint for operations.
export interface JointType {
  id: string;
  name: string;
  account_id: string;
}

// Represents a technician who can be assigned to operations.
export interface Technician {
  id: string;
  name: string;
  account_id: string;
}

// Represents a type of surgical operation.
export interface OperationType {
  id: string;
  name: string;
  account_id: string;
}

// Represents the stock quantity of a material in a specific warehouse.
export interface InventoryItem {
  id: number;
  materialId: string;
  warehouseId: string;
  quantity: number;
  account_id: string;
}

// A log entry for when stock is transferred between warehouses.
export interface StockTransfer {
  id: string;
  materialId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  date: string; // ISO timestamp
  account_id: string;
}

// An entry in the audit log, tracking changes to data.
export interface AuditLogEntry {
  id: number;
  created_at: string;
  user_email: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  account_id: string;
}