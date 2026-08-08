import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

const STORAGE_KEY = "convilarge_user_projects";

export default function ProjectsTab() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to save projects to localStorage", e);
    }
  }, [projects]);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const newProj = {
      id: Date.now().toString(),
      name: name.trim(),
      fileCount: 0,
      lastUpdated: "Just now"
    };
    setProjects((prev) => [newProj, ...prev]);
    setName("");
    setShowAdd(false);
    toast.success(`Created project "${newProj.name}"!`);
  }

  function handleUpdate(e) {
    e.preventDefault();
    if (!name.trim() || !editingId) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, name: name.trim(), lastUpdated: "Just now" } : p))
    );
    setName("");
    setEditingId(null);
    toast.success("Project updated successfully.");
  }

  function handleDelete(id, projName) {
    if (confirm(`Are you sure you want to delete the project "${projName}"?`)) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Deleted project "${projName}"`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">My Projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize your uploaded files and document packages into folders.</p>
        </div>
        {!showAdd && !editingId && (
          <Button onClick={() => setShowAdd(true)} className="self-start text-xs">
            Create Project
          </Button>
        )}
      </div>

      {(showAdd || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="max-w-md p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {editingId ? "Rename Project" : "Create New Project"}
          </h3>
          <label className="block text-sm font-semibold">
            Project Name
            <input
              type="text"
              required
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setName("");
                setEditingId(null);
                setShowAdd(false);
              }}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <Button type="submit">{editingId ? "Save Changes" : "Create Project"}</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-40">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{p.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{p.fileCount} files collected</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 text-xs">
              <span className="text-slate-400">Updated {p.lastUpdated}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setName(p.name);
                  }}
                  className="font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="font-bold text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500">
            No projects found. Click "Create Project" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
