// lib/features/driver-console/store/consoleStore.ts
import { create } from 'zustand';
import type { ConsoleTab, SheetState } from '../types/console';

interface ConsoleState {
  activeTab: ConsoleTab;
  sheetState: SheetState;
  selectedStopId: string | null;
  setActiveTab: (tab: ConsoleTab) => void;
  setSheetState: (state: SheetState) => void;
  setSelectedStopId: (id: string | null) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  activeTab: 'map',
  sheetState: 'collapsed',
  selectedStopId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSheetState: (state) => set({ sheetState: state }),
  setSelectedStopId: (id) => set({ selectedStopId: id }),
}));