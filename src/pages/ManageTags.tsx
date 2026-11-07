import { useMemo, useState } from "react";
import TagBadge from "../components/TagBadge";
import TagEditor from "../components/TagEditor";
import TagRow from "../components/TagRow";
import { tagTreeTotalSec, totalByTag } from "../lib/aggregate";
import { TAG_COLORS } from "../lib/seed";
import { useSessionStore } from "../store/useSessionStore";
import { useTagStore } from "../store/useTagStore";
import type { Tag } from "../types";

export default function ManageTags() {
  const { tags, addTag, updateTag, deleteTag } = useTagStore();
  const sessions = useSessionStore((s) => s.sessions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const totals = useMemo(() => totalByTag(sessions), [sessions]);
  const topLevel = tags.filter((t) => t.parentId === null);
  const selected = topLevel.find((t) => t.id === selectedId) ?? null;
  const subTags = selected ? tags.filter((t) => t.parentId === selected.id) : [];

  const quickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = addTag({
      name: draft,
      color: selected?.color ?? TAG_COLORS[tags.length % TAG_COLORS.length],
      icon: selected ? "book" : "tag",
      parentId: selected?.id ?? null,
    });
    if (tag) setDraft("");
  };

  const confirmDelete = (tag: Tag) => {
    const children = tags.filter((t) => t.parentId === tag.id).length;
    const extra = children ? ` and its ${children} sub-tag${children > 1 ? "s" : ""}` : "";
    if (window.confirm(`Delete "${tag.name}"${extra}? Sessions using them become untagged.`)) {
      if (selectedId === tag.id) setSelectedId(null);
      deleteTag(tag.id);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">Manage Tags</h1>

      <form onSubmit={quickAdd} className="mt-4 flex max-w-[500px] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
        <TagBadge color="#8f94fb" icon="tag" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={selected ? `Add a sub-tag to ${selected.name}` : "Add your tags here"}
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button type="button" aria-label="More options" onClick={() => setCreating(true)} className="px-1 text-xl leading-none">
          ⋮
        </button>
      </form>

      <hr className="my-8 border-panel" />

      <div className="grid gap-8 md:grid-cols-2 md:gap-0">
        <section className="md:pr-8">
          <h2 className="mb-4 text-3xl font-normal">Your Tags</h2>
          <div className="space-y-4">
            {topLevel.map((t) => (
              <TagRow
                key={t.id}
                tag={t}
                totalSec={tagTreeTotalSec(t.id, tags, totals)}
                selected={t.id === selectedId}
                onSelect={() => setSelectedId(t.id === selectedId ? null : t.id)}
                onEdit={() => setEditing(t)}
                onDelete={() => confirmDelete(t)}
              />
            ))}
            {topLevel.length === 0 && <p className="text-sm text-accent">No tags yet. Add one above.</p>}
          </div>
        </section>

        <section className="md:border-l md:border-line md:pl-8">
          <h2 className="mb-4 text-3xl font-normal">Sub Tags</h2>
          <div className="space-y-4">
            {subTags.map((t) => (
              <TagRow
                key={t.id}
                tag={t}
                totalSec={totals[t.id] ?? 0}
                onEdit={() => setEditing(t)}
                onDelete={() => confirmDelete(t)}
              />
            ))}
            {!selected && <p className="text-sm text-accent">Select a tag to see its sub-tags.</p>}
            {selected && subTags.length === 0 && (
              <p className="text-sm text-accent">No sub-tags for {selected.name} yet.</p>
            )}
          </div>
        </section>
      </div>

      {editing && (
        <TagEditor
          tag={editing}
          tags={tags}
          onSave={(input) => updateTag(editing.id, input)}
          onClose={() => setEditing(null)}
        />
      )}
      {creating && (
        <TagEditor
          tag={null}
          tags={tags}
          initial={{ name: draft, parentId: selected?.id ?? null }}
          onSave={(input) => {
            const ok = addTag(input) !== null;
            if (ok) setDraft("");
            return ok;
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
