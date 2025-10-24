import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { Operation, Material, Warehouse, JointType, Technician, OperationType, InventoryItem, StockTransfer, Profile, UsedMaterial } from '../types';

interface AppContextType {
  session: Session;
  profile: Profile | null;
  profiles: Profile[];
  operations: Operation[];
  materials: Material[];
  warehouses: Warehouse[];
  jointTypes: JointType[];
  technicians: Technician[];
  operationTypes: OperationType[];
  inventory: InventoryItem[];
  stockTransfers: StockTransfer[];
  loading: boolean;
  addOperation: (operation: Omit<Operation, 'id' | 'created_at' | 'account_id'>) => Promise<void>;
  updateOperation: (operation: Partial<Operation> & { id: string }) => Promise<void>;
  deleteOperation: (operationId: string) => Promise<void>;
  transferMultipleStock: (items: { materialId: string; quantity: number }[], fromWarehouseId: string, toWarehouseId: string) => Promise<void>;
  addJointType: (item: Omit<JointType, 'id' | 'account_id'>) => Promise<void>;
  updateJointType: (item: Partial<JointType> & { id: string }) => Promise<void>;
  deleteJointType: (id: string) => Promise<void>;
  addMaterial: (item: Omit<Material, 'id' | 'account_id'>) => Promise<void>;
  updateMaterial: (item: Partial<Material> & { id: string }) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addWarehouse: (item: Omit<Warehouse, 'id' | 'account_id'>) => Promise<void>;
  updateWarehouse: (item: Partial<Warehouse> & { id: string }) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  addTechnician: (item: Omit<Technician, 'id' | 'account_id'>) => Promise<void>;
  updateTechnician: (item: Partial<Technician> & { id: string }) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  addOperationType: (item: Omit<OperationType, 'id' | 'account_id'>) => Promise<void>;
  updateOperationType: (item: Partial<OperationType> & { id: string }) => Promise<void>;
  deleteOperationType: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; session: Session }> = ({ children, session }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [jointTypes, setJointTypes] = useState<JointType[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) console.error('Error fetching profile:', profileError);
        setProfile(userProfile);

        if (userProfile?.account_id) {
            const [
                profilesRes, operationsRes, materialsRes, warehousesRes, jointTypesRes,
                techniciansRes, operationTypesRes, inventoryRes, stockTransfersRes,
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('account_id', userProfile.account_id),
                supabase.from('operations').select('*').eq('account_id', userProfile.account_id),
                supabase.from('materials').select('*').eq('account_id', userProfile.account_id),
                supabase.from('warehouses').select('*').eq('account_id', userProfile.account_id),
                supabase.from('joint_types').select('*').eq('account_id', userProfile.account_id),
                supabase.from('technicians').select('*').eq('account_id', userProfile.account_id),
                supabase.from('operation_types').select('*').eq('account_id', userProfile.account_id),
                supabase.from('inventory').select('*').eq('account_id', userProfile.account_id),
                supabase.from('stock_transfers').select('*').eq('account_id', userProfile.account_id),
            ]);

            setProfiles(profilesRes.data || []);
            setOperations(operationsRes.data || []);
            setMaterials(materialsRes.data || []);
            setWarehouses(warehousesRes.data || []);
            setJointTypes(jointTypesRes.data || []);
            setTechnicians(techniciansRes.data || []);
            setOperationTypes(operationTypesRes.data || []);
            setInventory(inventoryRes.data || []);
            setStockTransfers(stockTransfersRes.data || []);
        }
    } catch (error) {
        console.error("Error loading application data:", error);
    } finally {
        setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // NOTE: The following functions for operations and stock transfers assume you have created
  // corresponding RPC/edge functions in your Supabase project to handle the logic atomically
  // (e.g., updating inventory when an operation is created/deleted).

  const addOperation = useCallback(async (operationData: Omit<Operation, 'id' | 'created_at' | 'account_id'>) => {
    if (!profile?.account_id) return;
    // This assumes an RPC 'add_operation' that handles inventory deduction.
    const { error } = await supabase.rpc('add_operation', { p_account_id: profile.account_id, ...operationData });
    if (error) console.error("Error adding operation:", error);
    else await fetchData();
  }, [profile, fetchData]);

  const updateOperation = useCallback(async (operationData: Partial<Operation> & { id: string }) => {
    if (!profile?.account_id) return;
     // This assumes an RPC 'update_operation' that handles inventory adjustments.
    const { error } = await supabase.rpc('update_operation', { p_account_id: profile.account_id, p_operation_id: operationData.id, ...operationData });
    if (error) console.error("Error updating operation:", error);
    else await fetchData();
  }, [profile, fetchData]);

  const deleteOperation = useCallback(async (operationId: string) => {
    if (!profile?.account_id) return;
    // This assumes an RPC 'delete_operation' that handles restocking inventory.
    const { error } = await supabase.rpc('delete_operation', { p_operation_id: operationId, p_account_id: profile.account_id });
    if (error) console.error("Error deleting operation:", error);
    else await fetchData();
  }, [profile, fetchData]);

  const transferMultipleStock = useCallback(async (items: { materialId: string; quantity: number }[], fromWarehouseId: string, toWarehouseId: string) => {
    if (!profile?.account_id) return;
    // Assumes an RPC 'transfer_stock_multiple'
    const { error } = await supabase.rpc('transfer_stock_multiple', {
        p_account_id: profile.account_id,
        items_to_transfer: items,
        from_warehouse: fromWarehouseId,
        to_warehouse: toWarehouseId
    });
    if (error) {
        console.error("Error transferring stock:", error);
        alert(`Failed to transfer stock: ${error.message}`);
    }
    else await fetchData();
  }, [profile, fetchData]);
  
  const createCrudFunctions = <T extends {id: string, account_id: string}>(tableName: string) => {
      const addItem = async (item: Omit<T, 'id' | 'account_id'>) => {
          if (!profile?.account_id) return;
          const { error } = await supabase.from(tableName).insert([{ ...item, account_id: profile.account_id }]);
          if (error) console.error(`Error adding to ${tableName}:`, error); else await fetchData();
      };
      const updateItem = async (item: Partial<T> & { id: string }) => {
          const { id, ...updateData } = item;
          const { error } = await supabase.from(tableName).update(updateData).eq('id', id);
          if (error) console.error(`Error updating ${tableName}:`, error); else await fetchData();
      };
      const deleteItem = async (id: string) => {
          const { error } = await supabase.from(tableName).delete().eq('id', id);
          if (error) console.error(`Error deleting from ${tableName}:`, error); else await fetchData();
      };
      return { addItem, updateItem, deleteItem };
  };

  const { addItem: addJointType, updateItem: updateJointType, deleteItem: deleteJointType } = createCrudFunctions('joint_types');
  const { addItem: addMaterial, updateItem: updateMaterial, deleteItem: deleteMaterial } = createCrudFunctions('materials');
  const { addItem: addWarehouse, updateItem: updateWarehouse, deleteItem: deleteWarehouse } = createCrudFunctions('warehouses');
  const { addItem: addTechnician, updateItem: updateTechnician, deleteItem: deleteTechnician } = createCrudFunctions('technicians');
  const { addItem: addOperationType, updateItem: updateOperationType, deleteItem: deleteOperationType } = createCrudFunctions('operation_types');

  const value = {
    session, profile, profiles, operations, materials, warehouses, jointTypes, technicians,
    operationTypes, inventory, stockTransfers, loading, addOperation, updateOperation,
    deleteOperation, transferMultipleStock, addJointType, updateJointType, deleteJointType,
    addMaterial, updateMaterial, deleteMaterial, addWarehouse, updateWarehouse, deleteWarehouse,
    addTechnician, updateTechnician, deleteTechnician, addOperationType, updateOperationType, deleteOperationType
  };

  return <AppContext.Provider value={value as AppContextType}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
