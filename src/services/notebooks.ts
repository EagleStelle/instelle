import { supabase } from "../lib/supabase";
import type { Notebook } from "../types/database";

export async function fetchNotebooks(): Promise<Notebook[]> {
  const { data, error } = await supabase
    .from("notebooks")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function createNotebook(title: string): Promise<Notebook> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notebooks")
    .insert({ title, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNotebook(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("notebooks")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNotebook(id: string): Promise<void> {
  const { error } = await supabase
    .from("notebooks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
