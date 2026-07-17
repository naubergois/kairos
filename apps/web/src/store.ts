import { create } from "zustand";
import { api } from "./api/client";
import type {
  AgentCatalogItem,
  DashboardMetrics,
  HumanApproval,
  Project,
  SupportTicket,
  SwarmMission,
  TaskCard,
} from "./types";

interface AppState {
  cards: TaskCard[];
  projects: Project[];
  approvals: HumanApproval[];
  agents: AgentCatalogItem[];
  missions: SwarmMission[];
  tickets: SupportTicket[];
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  toast: string | null;
  refreshAll: () => Promise<void>;
  setToast: (message: string | null) => void;
  setCards: (cards: TaskCard[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cards: [],
  projects: [],
  approvals: [],
  agents: [],
  missions: [],
  tickets: [],
  metrics: null,
  loading: false,
  error: null,
  toast: null,
  setToast: (message) => set({ toast: message }),
  setCards: (cards) => set({ cards }),
  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      const [cards, projects, approvals, agents, missions, tickets, metrics] =
        await Promise.all([
          api.cards.list(),
          api.projects.list(),
          api.approvals.list(),
          api.agents.list(),
          api.swarm.missions(),
          api.tickets.list(),
          api.dashboard.metrics(),
        ]);
      set({ cards, projects, approvals, agents, missions, tickets, metrics, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao carregar dados",
      });
    }
  },
}));
