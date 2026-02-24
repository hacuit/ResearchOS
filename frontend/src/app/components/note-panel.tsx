"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { API_BASE, fetchRetry } from "../lib/api";
import { IconTrash } from "./icons";

type Note = {
  id: string;
  title: string;
  body_md: string;
  source: string;
  created_at: string;
};

export function NotePanel({ ideaId }: { ideaId: string }) {
  const { headers } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  async function loadNotes() {
    try {
      const res = await fetchRetry(`${API_BASE}/ideas/${ideaId}/update_logs?limit=50`, { headers });
      if (res.ok) {
        const all = (await res.json()) as Note[];
        setNotes(all.filter((n) => n.source === "note"));
      }
    } catch { /* ignore */ }
  }

  async function saveNote() {
    if (!text.trim()) return;
    setSaving(true);
    const now = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetchRetry(`${API_BASE}/ideas/${ideaId}/update_logs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          source: "note",
          title: `Note - ${now}`,
          body_md: text.trim(),
          idea_id: ideaId,
        }),
      });
      if (res.ok) {
        setText("");
        await loadNotes();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function deleteNote(noteId: string) {
    try {
      const res = await fetchRetry(`${API_BASE}/update_logs/${noteId}`, { method: "DELETE", headers });
      if (res.ok) await loadNotes();
    } catch { /* ignore */ }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="note-panel" onClick={(e) => e.stopPropagation()}>
      <div className="note-input-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          rows={2}
          className="note-textarea"
        />
        <button onClick={() => void saveNote()} disabled={saving || !text.trim()} style={{ height: 36, fontSize: 12, flexShrink: 0 }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {notes.length > 0 && (
        <div className="note-list">
          {notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-item-content">
                <span className="note-date">{formatDate(note.created_at)}</span>
                <p className="note-body">{note.body_md}</p>
              </div>
              <button
                onClick={() => void deleteNote(note.id)}
                className="btn-del"
                style={{ flexShrink: 0 }}
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && (
        <p className="empty" style={{ fontSize: 12, marginTop: 8 }}>No notes yet.</p>
      )}
    </div>
  );
}
