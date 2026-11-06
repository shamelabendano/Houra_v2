import { create } from "zustand";
import type { Tag } from "../types";

interface TagState {
  tags: Tag[];
}

export const useTagStore = create<TagState>(() => ({
  tags: [],
}));
