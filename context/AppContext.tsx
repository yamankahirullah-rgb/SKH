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
  addMaterial: (item: Omit<Material, 'id' | 'account_id'>, initialStock?: { warehouseId: string; quantity: number }[]) => Promise<void>;
  updateMaterial: (item: Partial<Material> & { id: string }, stockLevels?: { warehouseId: string; quantity: number }[]) => Promise<void>;
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

  const addOperation = useCallback(async (operationData: Omit<Operation, 'id' | 'created_at' | 'account_id'>) => {
    if (!profile?.account_id) {
      alert("Profile not loaded. Cannot add operation.");
      return;
    }

    // Step 1: Pre-flight check in client-side state to prevent obvious failures
    if (operationData.materialsUsed && operationData.materialsUsed.length > 0) {
        for (const usedMaterial of operationData.materialsUsed) {
            const inventoryItem = inventory.find(i => i.materialId === usedMaterial.materialId && i.warehouseId === operationData.warehouseId);
            if (!inventoryItem || inventoryItem.quantity < usedMaterial.quantity) {
                const materialName = materials.find(m => m.id === usedMaterial.materialId)?.name || `ID ${usedMaterial.materialId}`;
                const availableStock = inventoryItem ? inventoryItem.quantity : 0;
                alert(`Operation not added. Not enough stock for "${materialName}".\nAvailable: ${availableStock}, Required: ${usedMaterial.quantity}.`);
                return; // Abort
            }
        }
    }

    // Step 2: Insert the operation record.
    const { data: newOperation, error: operationError } = await supabase
      .from('operations')
      .insert([{ 
        ...operationData, 
        account_id: profile.account_id, 
        materialsUsed: operationData.materialsUsed || [] // ensure materialsUsed is not undefined
      }])
      .select('id')
      .single();

    if (operationError || !newOperation) {
      console.error("Error inserting operation:", operationError);
      alert(`Failed to save the operation: ${operationError.message}`);
      return;
    }

    // Step 3: Deduct stock from inventory.
    if (operationData.materialsUsed && operationData.materialsUsed.length > 0) {
      const updateErrors: string[] = [];
      for (const usedMaterial of operationData.materialsUsed) {
        // This is safer via RPC to prevent race conditions, but this is the best client-side approach.
        const { data: currentItem, error: fetchError } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('materialId', usedMaterial.materialId)
          .eq('warehouseId', operationData.warehouseId)
          .single();

        if (fetchError || !currentItem) {
          const materialName = materials.find(m => m.id === usedMaterial.materialId)?.name || `ID ${usedMaterial.materialId}`;
          updateErrors.push(`${materialName} (could not find item to update)`);
          continue;
        }

        const newQuantity = currentItem.quantity - usedMaterial.quantity;
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', currentItem.id);

        if (updateError) {
          const materialName = materials.find(m => m.id === usedMaterial.materialId)?.name || `ID ${usedMaterial.materialId}`;
          updateErrors.push(`${materialName} (${updateError.message})`);
        }
      }

      if (updateErrors.length > 0) {
        alert(`CRITICAL WARNING: The operation was saved, but failed to deduct stock for the following items:\n- ${updateErrors.join('\n- ')}\n\nPlease manually adjust the inventory.`);
      }
    }

    // Step 4: Refresh data to show the new operation.
    await fetchData();
  }, [profile, fetchData, inventory, materials]);

  const updateOperation = useCallback(async (operationData: Partial<Operation> & { id: string }) => {
    if (!profile?.account_id) return;
     // This assumes an RPC 'update_operation' that handles inventory adjustments.
    const { error } = await supabase.rpc('update_operation', { p_account_id: profile.account_id, p_operation_id: operationData.id, ...operationData });
    if (error) {
        console.error("Error updating operation:", error);
        alert(`Failed to update operation: ${error.message}. This may require a backend function.`);
    }
    else await fetchData();
  }, [profile, fetchData]);

  const deleteOperation = useCallback(async (operationId: string) => {
    if (!profile?.account_id) return;
    // This assumes an RPC 'delete_operation' that handles restocking inventory.
    const { error } = await supabase.rpc('delete_operation', { p_operation_id: operationId, p_account_id: profile.account_id });
    if (error) {
        console.error("Error deleting operation:", error);
        alert(`Failed to delete operation: ${error.message}. This may require a backend function.`);
    }
    else await fetchData();
  }, [profile, fetchData]);

  const transferMultipleStock = useCallback(async (items: { materialId: string; quantity: number }[], fromWarehouseId: string, toWarehouseId: string) => {
    if (!profile?.account_id) return;
    
    // Convert item keys to snake_case for the RPC function
    const itemsForDb = items.map(item => ({
        material_id: item.materialId,
        quantity: item.quantity
    }));

    const { error } = await supabase.rpc('transfer_stock_multiple', {
        p_account_id: profile.account_id,
        p_items_to_transfer: itemsForDb,
        p_from_warehouse: fromWarehouseId,
        p_to_warehouse: toWarehouseId
    });

    if (error) {
        console.error("Error transferring stock:", error);
        alert(`Failed to transfer stock: ${error.message}`);
    } else {
        await fetchData();
    }
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

  const addMaterial = useCallback(async (
    materialData: Omit<Material, 'id' | 'account_id'>,
    initialStock?: { warehouseId: string; quantity: number }[]
  ) => {
      if (!profile?.account_id) return;
      const { data: newMaterial, error: materialError } = await supabase
          .from('materials')
          .insert([{ ...materialData, account_id: profile.account_id }])
          .select('id')
          .single();

      if (materialError || !newMaterial) {
          console.error("Error adding material:", materialError);
          alert(`Failed to add material: ${materialError?.message}`);
          return;
      }

      if (initialStock && initialStock.length > 0) {
        const stockToAdd = initialStock.filter(stock => stock.quantity > 0);
        for (const stockItem of stockToAdd) {
          // Check if a record for this material and warehouse already exists
          const { data: existingItem, error: selectError } = await supabase
            .from('inventory')
            .select('id')
            .eq('materialId', newMaterial.id)
            .eq('warehouseId', stockItem.warehouseId)
            .maybeSingle(); // Use maybeSingle to avoid error if no row is found

          if (selectError) {
            console.error("Error checking for existing stock:", selectError);
            alert(`Material created, but there was an error processing stock: ${selectError.message}`);
            continue; // Skip to next item
          }

          if (existingItem) {
            // If it exists, update it with the new quantity
            const { error: updateError } = await supabase
              .from('inventory')
              .update({ quantity: stockItem.quantity, account_id: profile.account_id })
              .eq('id', existingItem.id);
            if (updateError) {
              console.error("Error updating initial stock:", updateError);
              alert(`Material created, but failed to update stock for a warehouse: ${updateError.message}`);
            }
          } else {
            // If it does not exist, insert a new record
            const { error: insertError } = await supabase
              .from('inventory')
              .insert({
                materialId: newMaterial.id,
                warehouseId: stockItem.warehouseId,
                quantity: stockItem.quantity,
                account_id: profile.account_id,
              });
            if (insertError) {
              console.error("Error inserting initial stock:", insertError);
              alert(`Material created, but failed to insert stock for a warehouse: ${insertError.message}`);
            }
          }
        }
      }
      await fetchData();
  }, [profile, fetchData]);

  const updateMaterial = useCallback(async (
    materialData: Partial<Material> & { id: string },
    stockLevels?: { warehouseId: string; quantity: number }[]
  ) => {
    if (!profile?.account_id) return;

    const { id, ...updateData } = materialData;
    
    // 1. Update material details
    const { error: materialError } = await supabase
        .from('materials')
        .update(updateData)
        .eq('id', id);

    if (materialError) {
        console.error("Error updating material:", materialError);
        alert(`Failed to update material: ${materialError.message}`);
        return;
    }

    // 2. Update stock levels
    if (stockLevels) {
        for (const stockItem of stockLevels) {
            const { data: existingItem } = await supabase
                .from('inventory')
                .select('id')
                .eq('materialId', id)
                .eq('warehouseId', stockItem.warehouseId)
                .maybeSingle();

            if (existingItem) {
                const { error } = await supabase
                    .from('inventory')
                    .update({ quantity: stockItem.quantity })
                    .eq('id', existingItem.id);
                if (error) console.error("Error updating stock:", error);
            } else if (stockItem.quantity > 0) { // Only insert if there's stock
                const { error } = await supabase
                    .from('inventory')
                    .insert({
                        materialId: id,
                        warehouseId: stockItem.warehouseId,
                        quantity: stockItem.quantity,
                        account_id: profile.account_id,
                    });
                if (error) console.error("Error inserting stock:", error);
            }
        }
    }
    
    await fetchData();
  }, [profile, fetchData]);

  const { addItem: addJointType, updateItem: updateJointType, deleteItem: deleteJointType } = createCrudFunctions('joint_types');
  const { deleteItem: deleteMaterial } = createCrudFunctions('materials');
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
