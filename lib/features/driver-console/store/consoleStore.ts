// lib/features/driver-console/store/consoleStore.ts
import { create } from 'zustand';
import type { ConsoleTab, SheetState } from '../types/console';

export interface EvidenceModalState {
  open: boolean;
  type: 'pickup' | 'skip' | 'report' | 'deviation';
  buildingId: string | null;
  label: string;
}

export interface SearchDestination {
  lat: number;
  lng: number;
  label: string;
}

interface ConsoleState {
  activeTab: ConsoleTab;
  sheetState: SheetState;
  selectedStopId: string | null;
  evidence: EvidenceModalState;
  pauseModalOpen: boolean;
  notifOpen: boolean;
  searchOpen: boolean;
  searchDestination: SearchDestination | null;
  setActiveTab: (tab: ConsoleTab) => void;
  setSheetState: (state: SheetState) => void;
  setSelectedStopId: (id: string | null) => void;
  openEvidence: (type: EvidenceModalState['type'], buildingId: string | null, label: string) => void;
  closeEvidence: () => void;
  setPauseModalOpen: (open: boolean) => void;
  setNotifOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchDestination: (d: SearchDestination | null) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  activeTab: 'map',
  sheetState: 'collapsed',
  selectedStopId: null,
  evidence: { open: false, type: 'pickup', buildingId: null, label: '' },
  pauseModalOpen: false,
  notifOpen: false,
  searchOpen: false,
  searchDestination: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSheetState: (state) => set({ sheetState: state }),
  setSelectedStopId: (id) => set({ selectedStopId: id }),
  openEvidence: (type, buildingId, label) => set({ evidence: { open: true, type, buildingId, label } }),
  closeEvidence: () => set((s) => ({ evidence: { ...s.evidence, open: false } })),
  setPauseModalOpen: (open) => set({ pauseModalOpen: open }),
  setNotifOpen: (open) => set({ notifOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchDestination: (d) => set({ searchDestination: d }),
}));