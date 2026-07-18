'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EntityType = 'customer' | 'lead' | 'opportunity' | 'order' | 'visit' | 'task' | 'payment' | 'cheque' | 'presentation' | 'territory' | 'product' | 'price-list' | 'session' | 'permission' | 'audit' | 'user' | null;
export type EntityMode = 'create' | 'edit' | 'view';

interface GlobalEntityState {
  isOpen: boolean;
  type: EntityType;
  mode: EntityMode;
  entityId: string | null;
}

interface GlobalEntityContextType extends GlobalEntityState {
  openCreate: (type: EntityType, initialData?: any) => void;
  openEdit: (type: EntityType, id: string) => void;
  openView: (type: EntityType, id: string) => void;
  closeModal: () => void;
}

const GlobalEntityContext = createContext<GlobalEntityContextType | undefined>(undefined);

export function GlobalEntityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GlobalEntityState & { initialData?: any }>({
    isOpen: false,
    type: null,
    mode: 'create',
    entityId: null,
    initialData: null,
  });

  const openCreate = (type: EntityType, initialData?: any) => {
    setState({ isOpen: true, type, mode: 'create', entityId: null, initialData });
  };

  const openEdit = (type: EntityType, id: string) => {
    setState({ isOpen: true, type, mode: 'edit', entityId: id });
  };

  const openView = (type: EntityType, id: string) => {
    setState({ isOpen: true, type, mode: 'view', entityId: id });
  };

  const closeModal = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    // Wait for exit animation before clearing data
    setTimeout(() => {
      setState((prev) => (!prev.isOpen ? { ...prev, type: null, entityId: null } : prev));
    }, 300);
  };

  return (
    <GlobalEntityContext.Provider value={{ ...state, openCreate, openEdit, openView, closeModal }}>
      {children}
    </GlobalEntityContext.Provider>
  );
}

export function useGlobalEntity() {
  const context = useContext(GlobalEntityContext);
  if (context === undefined) {
    throw new Error('useGlobalEntity must be used within a GlobalEntityProvider');
  }
  return context;
}
