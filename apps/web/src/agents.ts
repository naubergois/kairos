export type AgentVisual = {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  blurb: string;
};

export const AGENT_ROBOTS: AgentVisual[] = [
  {
    id: "supervisor",
    name: "Nova",
    role: "Supervisor",
    emoji: "🤖",
    color: "#2563eb",
    blurb: "Owns the delivery flow end-to-end",
  },
  {
    id: "triagem",
    name: "Scout",
    role: "Triage",
    emoji: "🛰️",
    color: "#0891b2",
    blurb: "Classifies demand and missing info",
  },
  {
    id: "requisitos",
    name: "Spec",
    role: "Requirements",
    emoji: "📋",
    color: "#7c3aed",
    blurb: "Writes acceptance criteria",
  },
  {
    id: "arquiteto",
    name: "Atlas",
    role: "Architect",
    emoji: "🏗️",
    color: "#0f766e",
    blurb: "Shapes components and interfaces",
  },
  {
    id: "coordenador",
    name: "Hive",
    role: "Swarm Lead",
    emoji: "🧠",
    color: "#4f46e5",
    blurb: "Forms and directs the agent swarm",
  },
  {
    id: "desenvolvedor",
    name: "Forge",
    role: "Developer",
    emoji: "🛠️",
    color: "#ea580c",
    blurb: "Builds and deploys the mini-app",
  },
  {
    id: "revisor",
    name: "Lens",
    role: "Reviewer",
    emoji: "🔎",
    color: "#db2777",
    blurb: "Independent quality review",
  },
  {
    id: "testador",
    name: "Pulse",
    role: "Tester",
    emoji: "🧪",
    color: "#059669",
    blurb: "Runs acceptance checks",
  },
  {
    id: "documentacao",
    name: "Quill",
    role: "Docs",
    emoji: "✍️",
    color: "#64748b",
    blurb: "Publishes delivery notes",
  },
  {
    id: "chamados",
    name: "Beacon",
    role: "Tickets",
    emoji: "🚨",
    color: "#e11d48",
    blurb: "Opens blockers and incidents",
  },
];

export function agentVisual(id: string): AgentVisual {
  return (
    AGENT_ROBOTS.find((a) => a.id === id || a.role.toLowerCase() === id.toLowerCase()) ?? {
      id,
      name: id,
      role: id,
      emoji: "🤖",
      color: "#64748b",
      blurb: "Specialist agent",
    }
  );
}

export const SOFTWARE_TEMPLATES = [
  {
    title: "Todo Mini App",
    description:
      "Build a complete single-page Todo app with add/complete/delete, local persistence, clean UI, and a runnable preview.",
  },
  {
    title: "Notes Pad",
    description:
      "Build a complete notes web app: create, edit, search notes, autosave in localStorage, modern UI, deploy a live preview.",
  },
  {
    title: "JSON Echo API + UI",
    description:
      "Build a tiny full-stack tool: POST /echo API and a simple UI that sends JSON and shows the response. Make it runnable.",
  },
  {
    title: "Bookmark Board",
    description:
      "Build a complete bookmark manager: save links with titles/tags, filter by tag, persist locally, ship a working preview.",
  },
  {
    title: "Pomodoro Timer",
    description:
      "Build a complete Pomodoro timer web app with start/pause/reset, session history, and a polished runnable UI.",
  },
];
