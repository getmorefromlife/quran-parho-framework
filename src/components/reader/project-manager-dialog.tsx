import React, { useState } from "react";
import { FolderPlus, Pencil, Trash2, Check, X, Folder, Sparkles } from "lucide-react";
import {
  loadProjects,
  loadActiveProjectId,
  createProject,
  renameProject,
  deleteProject,
  saveActiveProjectId,
  type ResearchProject,
} from "@/lib/verse-collections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ProjectManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectChange?: () => void;
};

export function ProjectManagerDialog({
  open,
  onOpenChange,
  onProjectChange,
}: ProjectManagerDialogProps) {
  const projects = loadProjects();
  const activeId = loadActiveProjectId();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProject(newName, newDesc);
    setNewName("");
    setNewDesc("");
    setIsCreating(false);
    if (onProjectChange) onProjectChange();
  };

  const handleStartEdit = (proj: ResearchProject) => {
    setEditingId(proj.id);
    setEditName(proj.name);
    setEditDesc(proj.description || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    renameProject(id, editName, editDesc);
    setEditingId(null);
    if (onProjectChange) onProjectChange();
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeletingId(null);
    if (onProjectChange) onProjectChange();
  };

  const handleSelect = (id: string) => {
    saveActiveProjectId(id);
    if (onProjectChange) onProjectChange();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-card border-border sm:rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Folder className="h-5 w-5 text-gold" />
            Research Projects & Collections
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Organize your Quranic research, favorited verses, and searches into distinct named
            collections.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Create New Project Trigger / Form */}
          {isCreating ? (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl border border-gold/40 bg-gold/5 space-y-3"
            >
              <div className="text-sm font-semibold text-gold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FolderPlus className="h-4 w-4" />
                  New Project Collection
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="e.g. Patience & Resilience"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-gold"
              />

              <input
                type="text"
                placeholder="Optional description or topic theme"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-gold text-background font-semibold text-xs hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  Create & Select
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-gold/40 bg-gold/5 hover:bg-gold/10 text-gold text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <FolderPlus className="h-4 w-4" />
              Create New Research Project
            </button>
          )}

          {/* List of Projects */}
          <div className="space-y-2">
            {projects.map((proj) => {
              const isActive = proj.id === activeId;
              const isEditing = editingId === proj.id;
              const isDeleting = deletingId === proj.id;
              const verseCount = Object.keys(proj.verses || {}).length;
              const searchCount = (proj.savedSearches || []).length;

              if (isEditing) {
                return (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-gold/40 bg-card space-y-2"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md bg-background border border-border text-sm font-semibold focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md bg-background border border-border text-xs text-muted-foreground focus:outline-none focus:border-gold"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded text-xs text-muted-foreground hover:bg-background"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(proj.id)}
                        className="px-2.5 py-1 rounded bg-gold text-background font-semibold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              if (isDeleting) {
                return (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-destructive/40 bg-destructive/5 space-y-2"
                  >
                    <p className="text-xs text-destructive font-medium">
                      Delete &quot;{proj.name}&quot;? Verses in other projects will remain
                      untouched.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 rounded text-xs border border-border text-muted-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(proj.id)}
                        className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground font-semibold text-xs"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelect(proj.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "border-gold/60 bg-gold/10 shadow-gold"
                      : "border-border bg-card/60 hover:bg-card hover:border-gold/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{proj.name}</span>
                      {isActive && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-background">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {proj.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span>
                        {verseCount} {verseCount === 1 ? "verse" : "verses"}
                      </span>
                      {searchCount > 0 && (
                        <span>
                          · {searchCount} saved {searchCount === 1 ? "search" : "searches"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleStartEdit(proj)}
                      title="Edit project details"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(proj.id)}
                        title="Delete project"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
