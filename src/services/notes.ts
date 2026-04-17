import { supabase } from "../lib/supabase";
import type { Note } from "../types/database";

export async function fetchNotes(notebookId: string): Promise<Note[]> {
  const { data, error } = await (supabase.from("notes" as any) as any)
    .select("*")
    .eq("notebook_id", notebookId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(
  notebookId: string,
  title: string,
): Promise<Note> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase.from("notes" as any) as any)
    .insert({ title, notebook_id: notebookId, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, title: string): Promise<void> {
  const { error } = await (supabase.from("notes" as any) as any)
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await (supabase.from("notes" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
