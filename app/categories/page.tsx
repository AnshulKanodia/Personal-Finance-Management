"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tags, X, Check, RefreshCw } from "lucide-react";
import { CategoryIcon, AVAILABLE_ICONS } from "@/components/CategoryIcon";

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#0ea5e9", // Sky
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#71717a", // Zinc
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("Tag");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        const sorted = [...json.data].sort((a: Category, b: Category) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
        setCategories(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setColor("#10b981");
    setIcon("Tag");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const url = editingCategory ? `/api/categories/${editingCategory._id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to save category");
        return;
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "Failed to delete category");
        return;
      }
      fetchCategories();
    } catch (e) {
      console.error("Delete error", e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Category Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Customize income and expense classifications with hex colors and icons
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
          <span className="text-xs">Loading categories...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-md flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    borderColor: `${cat.color}35`,
                    color: cat.color,
                  }}
                >
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">{cat.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[11px] font-mono text-zinc-500">{cat.color}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between">
              <span className="text-base font-bold text-zinc-100">
                {editingCategory ? "Edit Category" : "New Category"}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Gym, Stocks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setColor(hex)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        color === hex ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : ""
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {color === hex && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 w-28 uppercase"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-zinc-900/50 rounded-xl border border-zinc-850">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const isSelected = icon === iconName;
                    return (
                      <button
                        type="button"
                        key={iconName}
                        onClick={() => setIcon(iconName)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                            : "border-zinc-800/80 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                        title={iconName}
                      >
                        <CategoryIcon name={iconName} className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: `${color}20`,
                    borderColor: `${color}40`,
                    color: color,
                  }}
                >
                  <CategoryIcon name={icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Live Preview</div>
                  <div className="text-sm font-bold text-zinc-100">{name || "Sample Category"}</div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                >
                  {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
