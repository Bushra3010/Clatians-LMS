"use client";

import { useState } from "react";
import { addNoteAction, updateNoteAction, deleteNoteAction, type Note } from "../../lib/note-actions";
import { AppIcon } from "../AppIcon";
import { card, primaryBtn, input, page, body as bodyStyle, ScreenHeader, IconTile, EmptyState } from "../ui/kit";

type Editor = { note: Note | null } | null; // {note:null} = new note; null = list view

export default function NotesPage({ onBack, initialNotes }: { onBack: () => void; initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editor, setEditor] = useState<Editor>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const openNew = () => { setEditor({ note: null }); setTitle(""); setBody(""); };
  const openEdit = (n: Note) => { setEditor({ note: n }); setTitle(n.title); setBody(n.body); };

  const save = async () => {
    if (busy || (!title.trim() && !body.trim())) return;
    setBusy(true);
    try {
      if (editor?.note) {
        const id = editor.note.id;
        setNotes((list) => list.map((x) => (x.id === id ? { ...x, title: title.trim() || "Untitled note", body: body.trim() } : x)));
        await updateNoteAction(id, title, body);
      } else {
        const res = await addNoteAction(title, body);
        if (res.ok && res.note) setNotes((list) => [res.note!, ...list]);
      }
      setEditor(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const prev = notes;
    setNotes((list) => list.filter((x) => x.id !== id));
    setEditor(null);
    try { await deleteNoteAction(id); } catch { setNotes(prev); }
  };

  // ── Editor ──
  if (editor) {
    return (
      <div style={page}>
        <ScreenHeader title={editor.note ? "Edit note" : "New note"} onBack={() => setEditor(null)} />
        <div style={bodyStyle}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ ...input, fontSize: 17, fontWeight: 700, padding: "13px 14px", borderRadius: 16 }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your note…" rows={14} style={{ ...input, fontSize: 15, lineHeight: 1.6, padding: "13px 14px", borderRadius: 16, resize: "vertical" }} />
          <button onClick={save} disabled={busy || (!title.trim() && !body.trim())} style={{ ...primaryBtn, padding: "14px", fontSize: 15, cursor: busy ? "default" : "pointer", opacity: busy || (!title.trim() && !body.trim()) ? 0.6 : 1 }}>
            {!busy && <AppIcon name="check" size={17} color="white" strokeWidth={2.6} />}
            {busy ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    );
  }

  // ── List ──
  return (
    <div style={page}>
      <ScreenHeader title="My Notes" onBack={onBack} />

      <div style={bodyStyle}>
        <button onClick={openNew} style={{ ...primaryBtn, width: "100%", padding: "14px", fontSize: 14.5 }}>
          <AppIcon name="pen" size={17} color="white" strokeWidth={2.4} />
          New note
        </button>

        {notes.length === 0 && (
          <EmptyState icon="file" title="No notes yet" text="Jot down anything you want to remember." />
        )}
        {notes.map((n) => (
          <button key={n.id} onClick={() => openEdit(n)} style={{ ...card, textAlign: "left", padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
            <IconTile icon="file" size={38} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
              {n.body && <span style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</span>}
            </span>
            <AppIcon name="chevronRight" size={17} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </div>
  );
}
