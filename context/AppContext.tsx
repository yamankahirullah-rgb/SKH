import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// FIX: Import `DbRecord` to use it as a generic constraint.
import { AppState, Profile, Operation, JointType, Material, Warehouse, Technician, OperationType, StockTransfer, InventoryItem, DbRecord } from '../types';
import { supabase } from '../supabase/client';
import { Session, User } from '@supabase/supabase-js';
import AccountSetupPage from '../pages/AccountSetupPage';

// Define the shape of the context value
interface AppContextType extends AppState {
  profile: Profile | null;
  session: Session;
  addOperation: (operation: Omit<Operation, 'id' | keyof DbRecordDefaults>) => void;
  updateOperation: (operation: Operation) => void;
  deleteOperation: (operationId: string) => void;
  
  transferStock: (materialId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number) => void;
  transferMultipleStock: (items: { materialId: string; quantity: number }[], fromWarehouseId: string, toWarehouseId: string) => void;
  setInitialStock: (materialId: string, warehouseId: string, quantity: number) => void;

  addJointType: (item: Omit<JointType, 'id' | keyof DbRecordDefaults>) => void;
  updateJointType: (item: JointType) => void;
  deleteJointType: (id: string) => void;

  addMaterial: (item: Omit<Material, 'id' | keyof DbRecordDefaults>) => void;
  updateMaterial: (item: Material) => void;
  deleteMaterial: (id: string) => void;
  
  addWarehouse: (item: Omit<Warehouse, 'id' | keyof DbRecordDefaults>) => void;
  updateWarehouse: (item: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  
  addTechnician: (item: Omit<Technician, 'id' | keyof DbRecordDefaults>) => void;
  updateTechnician: (item: Technician) => void;
  deleteTechnician: (id: string) => void;
  
  addOperationType: (item: Omit<OperationType, 'id' | keyof DbRecordDefaults>) => void;
  updateOperationType: (item: OperationType) => void;
  deleteOperationType: (id: string) => void;
}

type DbRecordDefaults = 'account_id' | 'created_at' | 'created_by';

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAppState: AppState = {
    jointTypes: [],
    materials: [],
    warehouses: [],
    inventory: [],
    technicians: [],
    operationTypes: [],
    operations: [],
    stockTransfers: [],
};

// AppProvider component
export const AppProvider: React.FC<{ children: ReactNode; session: Session }> = ({ children, session }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [state, setState] = useState<AppState>(initialAppState);

  const fetchProfile = useCallback(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
      setLoadingProfile(false);
  }, [session.user.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile?.account_id) return;
    const accountId = profile.account_id;

    const fetchInitialData = async () => {
        const [
            jointTypes, materials, warehouses, technicians, operationTypes, operations, stockTransfers, inventory
        ] = await Promise.all([
            supabase.from('joint_types').select('*').eq('account_id', accountId),
            supabase.from('materials').select('*').eq('account_id', accountId),
            supabase.from('warehouses').select('*').eq('account_id', accountId),
            supabase.from('technicians').select('*').eq('account_id', accountId),
            supabase.from('operation_types').select('*').eq('account_id', accountId),
            supabase.from('operations').select('*').eq('account_id', accountId),
            supabase.from('stock_transfers').select('*').eq('account_id', accountId),
            supabase.from('inventory_view').select('*').eq('account_id', accountId)
        ]);

        setState({
            jointTypes: jointTypes.data || [],
            materials: materials.data || [],
            warehouses: warehouses.data || [],
            technicians: technicians.data || [],
            operationTypes: operationTypes.data || [],
            operations: operations.data || [],
            stockTransfers: stockTransfers.data || [],
            inventory: inventory.data || [],
        });
    };
    
    fetchInitialData();

    const handleDbChanges = (payload: any) => {
        console.log('Realtime change received:', payload);
        fetchInitialData(); // simple refetch for now
    };

    const subscriptions = [
      supabase.channel('public:joint_types').on('postgres_changes', { event: '*', schema: 'public', table: 'joint_types' }, handleDbChanges).subscribe(),
      supabase.channel('public:materials').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, handleDbChanges).subscribe(),
      supabase.channel('public:warehouses').on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, handleDbChanges).subscribe(),
      supabase.channel('public:technicians').on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, handleDbChanges).subscribe(),
      supabase.channel('public:operation_types').on('postgres_changes', { event: '*', schema: 'public', table: 'operation_types' }, handleDbChanges).subscribe(),
      supabase.channel('public:operations').on('postgres_changes', { event: '*', schema: 'public', table: 'operations' }, handleDbChanges).subscribe(),
      supabase.channel('public:stock_transfers').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_transfers' }, handleDbChanges).subscribe(),
    ];
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };

  }, [profile]);
  
  const logAction = useCallback(async (action_type: 'CREATE' | 'UPDATE' | 'DELETE', table_name: string, record_id: string, old_data?: any, new_data?: any) => {
    if(!profile || !session.user) return;
    await supabase.from('audit_log').insert([{
        account_id: profile.account_id,
        user_id: session.user.id,
        user_email: session.user.email,
        action_type,
        table_name,
        record_id,
        old_data,
        new_data,
    }]);
  }, [profile, session.user]);

  const createCrudFunctions = <T extends DbRecord>(tableName: string, stateKey: keyof AppState) => {
    const addItem = async (item: Omit<T, 'id' | keyof DbRecordDefaults>) => {
        const { data } = await supabase.from(tableName).insert([{ ...item, account_id: profile!.account_id, created_by: session.user.id }]).select().single();
        if(data) await logAction('CREATE', tableName, data.id, null, data);
    };
    const updateItem = async (item: T) => {
        const { data } = await supabase.from(tableName).update(item).eq('id', item.id).select().single();
        if(data) await logAction('UPDATE', tableName, data.id, (state[stateKey] as any[]).find(i => i.id === item.id), data);
    };
    const deleteItem = async (id: string) => {
        const oldData = (state[stateKey] as any[]).find(i => i.id === id);
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if(!error) await logAction('DELETE', tableName, id, oldData);
    };
    return { addItem, updateItem, deleteItem };
  };

  const jointTypeCrud = createCrudFunctions<JointType>('joint_types', 'jointTypes');
  const materialCrud = createCrudFunctions<Material>('materials', 'materials');
  const warehouseCrud = createCrudFunctions<Warehouse>('warehouses', 'warehouses');
  const technicianCrud = createCrudFunctions<Technician>('technicians', 'technicians');
  const operationTypeCrud = createCrudFunctions<OperationType>('operation_types', 'operationTypes');
  
  const addOperation = async (operation: Omit<Operation, 'id' | keyof DbRecordDefaults>) => {
    const { data } = await supabase.rpc('add_operation', {
        op_data: operation,
        p_account_id: profile!.account_id,
        p_user_id: session.user.id
    });
    if(data) await logAction('CREATE', 'operations', data, null, { ...operation, id: data });
  };

  const deleteOperation = async (operationId: string) => {
      const oldData = state.operations.find(op => op.id === operationId);
      const { error } = await supabase.rpc('delete_operation', { p_operation_id: operationId, p_account_id: profile!.account_id });
      if(!error) await logAction('DELETE', 'operations', operationId, oldData);
  };
  
  const transferMultipleStock = async (items: { materialId: string; quantity: number }[], fromWarehouseId: string, toWarehouseId: string) => {
      const { error } = await supabase.rpc('transfer_multiple_stock', {
          items,
          p_from_warehouse_id: fromWarehouseId,
          p_to_warehouse_id: toWarehouseId,
          p_account_id: profile!.account_id,
          p_user_id: session.user.id
      });
      if (!error) {
          // Log each transfer
          items.forEach(item => {
              logAction('CREATE', 'stock_transfers', 'N/A', null, { ...item, fromWarehouseId, toWarehouseId });
          });
      }
  };


  if (loadingProfile) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
        </div>
    );
  }

  if (!profile) {
    return <AccountSetupPage user={session.user} onComplete={fetchProfile} />;
  }


  const value: AppContextType = {
    ...state,
    profile,
    session,
    addOperation,
    updateOperation: async (op) => { /* Complex updates may need a dedicated RPC function */ },
    deleteOperation,
    transferStock: async (materialId, from, to, qty) => transferMultipleStock([{materialId, quantity: qty}], from, to),
    transferMultipleStock,
    setInitialStock: async (materialId, warehouseId, quantity) => {
      await supabase.rpc('set_initial_stock', { p_material_id: materialId, p_warehouse_id: warehouseId, p_quantity: quantity, p_account_id: profile.account_id });
    },
    addJointType: jointTypeCrud.addItem,
    updateJointType: jointTypeCrud.updateItem,
    deleteJointType: jointTypeCrud.deleteItem,
    addMaterial: materialCrud.addItem,
    updateMaterial: materialCrud.updateItem,
    deleteMaterial: materialCrud.deleteItem,
    addWarehouse: warehouseCrud.addItem,
    updateWarehouse: warehouseCrud.updateItem,
    deleteWarehouse: warehouseCrud.deleteItem,
    addTechnician: technicianCrud.addItem,
    updateTechnician: technicianCrud.updateItem,
    deleteTechnician: technicianCrud.deleteItem,
    addOperationType: operationTypeCrud.addItem,
    updateOperationType: operationTypeCrud.updateItem,
    deleteOperationType: operationTypeCrud.deleteItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};