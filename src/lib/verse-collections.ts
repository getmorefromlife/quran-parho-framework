export type SavedSearchQuery = {
  id: string;
  query: string;
  surahFilter?: number;
  createdAt: number;
};

export type ResearchProject = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  verses: Record<string, true>; // Keyed by `${surah}:${ayah}`
  savedSearches: SavedSearchQuery[];
};

const KEY_PROJECTS = "qp_research_projects";
const KEY_ACTIVE_PROJECT_ID = "qp_active_project_id";
const KEY_LEGACY_FAVORITES = "qp_favorites";

export const EVENT_PROJECTS_UPDATED = "qp-projects-updated";

function canStore(): boolean {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Migration & Initial Load
 * Loads projects from localStorage. If no projects exist, migrates any legacy `qp_favorites`
 * into a default "General Research" project.
 */
export function loadProjects(): ResearchProject[] {
  if (!canStore()) return [];

  const rawProjects = localStorage.getItem(KEY_PROJECTS);
  let projects: ResearchProject[] = safeParse<ResearchProject[]>(rawProjects, []);

  if (projects.length === 0) {
    // Check for legacy favorites
    const legacyFavs = safeParse<Record<string, true>>(
      localStorage.getItem(KEY_LEGACY_FAVORITES),
      {},
    );

    const defaultProject: ResearchProject = {
      id: "default_general_research",
      name: "General Research",
      description: "Default collection for your favorited verses and topics",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verses: { ...legacyFavs },
      savedSearches: [],
    };

    projects = [defaultProject];
    localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));

    // Store active project ID if not set
    if (!localStorage.getItem(KEY_ACTIVE_PROJECT_ID)) {
      localStorage.setItem(KEY_ACTIVE_PROJECT_ID, defaultProject.id);
    }
  }

  return projects;
}

export function saveProjects(projects: ResearchProject[]): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent(EVENT_PROJECTS_UPDATED));
}

export function loadActiveProjectId(): string {
  if (!canStore()) return "default_general_research";
  const projects = loadProjects();
  const storedId = localStorage.getItem(KEY_ACTIVE_PROJECT_ID);
  if (storedId && projects.some((p) => p.id === storedId)) {
    return storedId;
  }
  const fallbackId = projects[0]?.id || "default_general_research";
  localStorage.setItem(KEY_ACTIVE_PROJECT_ID, fallbackId);
  return fallbackId;
}

export function saveActiveProjectId(id: string): void {
  if (!canStore()) return;
  localStorage.setItem(KEY_ACTIVE_PROJECT_ID, id);
  window.dispatchEvent(new CustomEvent(EVENT_PROJECTS_UPDATED));
}

export function getActiveProject(): ResearchProject | null {
  const projects = loadProjects();
  const activeId = loadActiveProjectId();
  return projects.find((p) => p.id === activeId) || projects[0] || null;
}

export function createProject(name: string, description?: string): ResearchProject {
  const projects = loadProjects();
  const newProj: ResearchProject = {
    id: generateId(),
    name: name.trim() || "Untitled Project",
    description: description?.trim() || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    verses: {},
    savedSearches: [],
  };

  const updated = [newProj, ...projects];
  saveProjects(updated);
  saveActiveProjectId(newProj.id);
  return newProj;
}

export function renameProject(id: string, name: string, description?: string): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;

  projects[idx] = {
    ...projects[idx],
    name: name.trim() || projects[idx].name,
    description: description !== undefined ? description.trim() : projects[idx].description,
    updatedAt: Date.now(),
  };

  saveProjects(projects);
}

export function deleteProject(id: string): void {
  let projects = loadProjects();
  if (projects.length <= 1) {
    // Do not delete the last remaining project, clear its contents instead
    projects[0] = {
      ...projects[0],
      name: "General Research",
      description: "Default collection for your favorited verses and topics",
      verses: {},
      savedSearches: [],
      updatedAt: Date.now(),
    };
    saveProjects(projects);
    return;
  }

  projects = projects.filter((p) => p.id !== id);
  saveProjects(projects);

  const activeId = loadActiveProjectId();
  if (activeId === id) {
    saveActiveProjectId(projects[0].id);
  }
}

export function toggleVerseInProject(projectId: string, surah: number, ayah: number): boolean {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;

  const key = `${surah}:${ayah}`;
  const hasVerse = !!projects[idx].verses[key];

  const updatedVerses = { ...projects[idx].verses };
  if (hasVerse) {
    delete updatedVerses[key];
  } else {
    updatedVerses[key] = true;
  }

  projects[idx] = {
    ...projects[idx],
    verses: updatedVerses,
    updatedAt: Date.now(),
  };

  saveProjects(projects);
  return !hasVerse;
}

export function setVerseProjects(surah: number, ayah: number, projectIds: string[]): void {
  const projects = loadProjects();
  const key = `${surah}:${ayah}`;
  const selectedSet = new Set(projectIds);

  const updated = projects.map((proj) => {
    const has = !!proj.verses[key];
    const shouldHave = selectedSet.has(proj.id);
    if (has === shouldHave) return proj;

    const nextVerses = { ...proj.verses };
    if (shouldHave) {
      nextVerses[key] = true;
    } else {
      delete nextVerses[key];
    }

    return {
      ...proj,
      verses: nextVerses,
      updatedAt: Date.now(),
    };
  });

  saveProjects(updated);
}

export function isVerseInProject(projectId: string, surah: number, ayah: number): boolean {
  const projects = loadProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return false;
  return !!proj.verses[`${surah}:${ayah}`];
}

export function getVerseProjects(surah: number, ayah: number): ResearchProject[] {
  const projects = loadProjects();
  const key = `${surah}:${ayah}`;
  return projects.filter((p) => !!p.verses[key]);
}

export function saveSearchToProject(projectId: string, query: string, surahFilter?: number): void {
  if (!query.trim()) return;
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return;

  const trimmed = query.trim();
  const existingSearches = projects[idx].savedSearches || [];

  // Avoid duplicate search strings
  if (existingSearches.some((s) => s.query.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }

  const newSearch: SavedSearchQuery = {
    id: generateId(),
    query: trimmed,
    surahFilter,
    createdAt: Date.now(),
  };

  projects[idx] = {
    ...projects[idx],
    savedSearches: [newSearch, ...existingSearches],
    updatedAt: Date.now(),
  };

  saveProjects(projects);
}

export function removeSearchFromProject(projectId: string, searchId: string): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return;

  projects[idx] = {
    ...projects[idx],
    savedSearches: (projects[idx].savedSearches || []).filter((s) => s.id !== searchId),
    updatedAt: Date.now(),
  };

  saveProjects(projects);
}
