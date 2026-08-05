import React, { useState, useEffect } from "react";
import { Folder, Plus, Check, BookmarkPlus } from "lucide-react";
import {
  loadProjects,
  setVerseProjects,
  createProject,
  EVENT_PROJECTS_UPDATED,
} from "@/lib/verse-collections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type VerseProjectSelectorProps = {
  surah: number;
  ayah: number;
  trigger?: React.ReactNode;
  onChanged?: () => void;
};

export function VerseProjectSelector({
  surah,
  ayah,
  trigger,
  onChanged,
}: VerseProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(() => loadProjects());
  const [isCreating, setIsCreating] = useState(false);
  const [newProjName, setNewProjName] = useState("");

  const verseKey = `${surah}:${ayah}`;

  const refreshProjects = () => {
    setProjects(loadProjects());
  };

  useEffect(() => {
    window.addEventListener(EVENT_PROJECTS_UPDATED, refreshProjects);
    return () => window.removeEventListener(EVENT_PROJECTS_UPDATED, refreshProjects);
  }, []);

  const handleToggle = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    const currentSelectedIds = projects.filter((p) => !!p.verses[verseKey]).map((p) => p.id);

    const hasIt = currentSelectedIds.includes(projId);
    const nextSelectedIds = hasIt
      ? currentSelectedIds.filter((id) => id !== projId)
      : [...currentSelectedIds, projId];

    setVerseProjects(surah, ayah, nextSelectedIds);
    refreshProjects();
    if (onChanged) onChanged();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const newProj = createProject(newProjName);
    setVerseProjects(surah, ayah, [
      ...projects.filter((p) => !!p.verses[verseKey]).map((p) => p.id),
      newProj.id,
    ]);
    setNewProjName("");
    setIsCreating(false);
    refreshProjects();
    if (onChanged) onChanged();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-gold hover:border-gold/50 flex items-center gap-1 transition-colors"
            title="Add verse to research projects"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Projects</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 bg-card border-border shadow-xl z-[95]">
        <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 border-b border-border pb-2">
          <Folder className="h-3.5 w-3.5 text-gold" />
          Assign Verse {surah}:{ayah} to Projects
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto my-2 pr-1">
          {projects.map((proj) => {
            const isChecked = !!proj.verses[verseKey];
            return (
              <label
                key={proj.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-gold/10 text-gold font-semibold"
                    : "hover:bg-background text-foreground"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleToggle(proj.id);
                }}
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked
                      ? "bg-gold border-gold text-background"
                      : "border-border bg-background"
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate flex-1">{proj.name}</span>
              </label>
            );
          })}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="pt-2 border-t border-border space-y-2">
            <input
              type="text"
              placeholder="Project Name..."
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-gold"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-0.5 rounded text-[11px] text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProjName.trim()}
                className="px-2 py-0.5 rounded bg-gold text-background text-[11px] font-semibold"
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full mt-1 pt-2 border-t border-border text-xs text-gold hover:underline font-medium flex items-center justify-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Create New Project
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
