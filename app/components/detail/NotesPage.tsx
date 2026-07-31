"use client";

import { useState } from "react";
import { addNoteAction, updateNoteAction, deleteNoteAction, type Note } from "../../lib/note-actions";

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

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
      <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
          <button onClick={() => setEditor(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            {editor.note ? "Edit note" : "New note"}
          </button>
          {editor.note && (
            <button onClick={() => remove(editor.note!.id)} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Delete</button>
          )}
        </div>
        <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ border: "none", borderRadius: 12, padding: "12px 14px", fontSize: 17, fontWeight: 700, color: "#1A1A2E", background: "white", outline: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your note…" rows={14} style={{ border: "none", borderRadius: 12, padding: "12px 14px", fontSize: 14.5, lineHeight: 1.6, color: "#231911", background: "white", outline: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", resize: "vertical", fontFamily: "inherit" }} />
          <button onClick={save} disabled={busy || (!title.trim() && !body.trim())} style={{ background: gradient, color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 800, cursor: busy ? "default" : "pointer", opacity: busy || (!title.trim() && !body.trim()) ? 0.6 : 1 }}>
            {busy ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    );
  }

  // ── List ──
  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        My Notes
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <button onClick={openNew} style={{ width: "100%", background: gradient, color: "white", border: "none", borderRadius: 14, padding: "13px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(61,36,17,0.28)" }}>
          ✎ New note
        </button>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", margin: "16px 0" }}>No notes yet — jot down anything you want to remember.</p>
          )}
          {notes.map((n) => (
            <button key={n.id} onClick={() => openEdit(n)} style={{ textAlign: "left", background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "none", cursor: "pointer" }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
              {n.body && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#6B7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
