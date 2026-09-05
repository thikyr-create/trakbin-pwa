import { create } from 'zustand';

export type ConsoleTab = 'map' | 'stops' | 'activity';

export type SheetState = 'collapsed' | 'expanded';

export type SearchDestination = {
  lat: number;
  lng: number;
  label?: string;
} | null;

export type EvidenceActivityType = 'pickup' | 'skip' | 'report' | 'deviation';

export interface ConsoleState {
  activeTab: ConsoleTab;
  setActiveTab: (tab: ConsoleTab) => void;

  sheetState: SheetState;
  setSheetState: (state: SheetState) => void;

  selectedStopId: string | null;
  setSelectedStopId: (id: string | null) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  searchDestination: SearchDestination;
  setSearchDestination: (destination: SearchDestination) => void;

  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;

  pauseModalOpen: boolean;
  setPauseModalOpen: (open: boolean) => void;

  reportOpen: boolean;
  setReportOpen: (open: boolean) => void;

  endShiftOpen: boolean;
  setEndShiftOpen: (open: boolean) => void;

  evidenceOpen: boolean;
  evidenceActivityType: EvidenceActivityType;
  evidenceBuildingId: string | null;
  evidenceContextLabel: string | undefined;
  openEvidence: (
    activityType: EvidenceActivityType,
    buildingId?: string | null,
    contextLabel?: string
  ) => void;
  closeEvidence: () => void;

  resetConsole: () => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  activeTab: 'map',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sheetState: 'collapsed',
  setSheetState: (state) => set({ sheetState: state }),

  selectedStopId: null,
  setSelectedStopId: (id) => set({ selectedStopId: id }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  searchDestination: null,
  setSearchDestination: (destination) => set({ searchDestination: destination }),

  notifOpen: false,
  setNotifOpen: (open) => set({ notifOpen: open }),

  pauseModalOpen: false,
  setPauseModalOpen: (open) => set({ pauseModalOpen: open }),

  reportOpen: false,
  setReportOpen: (open) => set({ reportOpen: open }),

  endShiftOpen: false,
  setEndShiftOpen: (open) => set({ endShiftOpen: open }),

  evidenceOpen: false,
  evidenceActivityType: 'pickup',
  evidenceBuildingId: null,
  evidenceContextLabel: undefined,
  openEvidence: (activityType, buildingId = null, contextLabel) =>
    set({
      evidenceOpen: true,
      evidenceActivityType: activityType,
      evidenceBuildingId: buildingId,
      evidenceContextLabel: contextLabel,
    }),
  closeEvidence: () =>
    set({
      evidenceOpen: false,
      evidenceBuildingId: null,
      evidenceContextLabel: undefined,
    }),

  resetConsole: () =>
    set({
      activeTab: 'map',
      sheetState: 'collapsed',
      selectedStopId: null,
      searchOpen: false,
      searchDestination: null,
      notifOpen: false,
      pauseModalOpen: false,
      reportOpen: false,
      endShiftOpen: false,
      evidenceOpen: false,
      evidenceActivityType: 'pickup',
      evidenceBuildingId: null,
      evidenceContextLabel: undefined,
    }),
}));