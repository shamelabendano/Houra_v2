import { create } from "zustand";
import { load, save } from "../lib/storage";
import { seedTags } from "../lib/seed";
import { useSessionStore } from "./useSessionStore";
import type { Tag } from "../types";

export type TagInput = Pick<Tag, "name" | "color" | "icon" | "parentId" | "weeklyGoalSec">;

interface TagState {
  tags: Tag[];
  addTag: (input: TagInput) => Tag | null;
  updateTag: (id: string, input: TagInput) => boolean;
  /** Deletes the tag and its sub-tags; their sessions become untagged. */
  deleteTag: (id: string) => void;
}

function persist(tags: Tag[]) {
  save("tags", tags);
  return tags;
}

/** Sub-tags are one level deep; a tag with children cannot become a sub-tag. */
function validParent(tags: Tag[], id: string | null, parentId: string | null): boolean {
  if (parentId === null) return true;
  if (parentId === id) return false;
  const parent = tags.find((t) => t.id === parentId);
  if (!parent || parent.parentId !== null) return false;
  if (id && tags.some((t) => t.parentId === id)) return false;
  return true;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: load<Tag[]>("tags", seedTags),

  addTag: (input) => {
    const name = input.name.trim();
    if (!name || !validParent(get().tags, null, input.parentId)) return null;
    const tag: Tag = {
      ...input,
      name,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    set({ tags: persist([...get().tags, tag]) });
    return tag;
  },

  updateTag: (id, input) => {
    const name = input.name.trim();
    if (!name || !validParent(get().tags, id, input.parentId)) return false;
    set({
      tags: persist(get().tags.map((t) => (t.id === id ? { ...t, ...input, name } : t))),
    });
    return true;
  },

  deleteTag: (id) => {
    const tags = get().tags;
    const doomed = new Set([id, ...tags.filter((t) => t.parentId === id).map((t) => t.id)]);
    useSessionStore.getState().untagSessions([...doomed]);
    set({ tags: persist(tags.filter((t) => !doomed.has(t.id))) });
  },
}));
