import { supabase } from "../lib/supabase";
import type { Notebook } from "../types/database";

export async function fetchNotebooks(): Promise<Notebook[]> {
  const { data, error } = await (supabase.from("notebooks" as any) as any)
    .select("*")
    .order("order")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Notebook[];
}

export async function createNotebook(title: string): Promise<Notebook> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: last, error: maxError } = await (
    supabase.from("notebooks" as any) as any
  )
    .select("order")
    .eq("user_id", user.id)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) throw maxError;

  const nextOrder = ((last as { order?: number } | null)?.order ?? -1) + 1;

  const { data, error } = await (supabase.from("notebooks" as any) as any)
    .insert({ title, user_id: user.id, order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data as Notebook;
}

export async function updateNotebook(id: string, title: string): Promise<void> {
  const { error } = await (supabase.from("notebooks" as any) as any)
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNotebook(id: string): Promise<void> {
  const { error } = await (supabase.from("notebooks" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderNotebooks(notebooks: Notebook[]): Promise<void> {
  if (notebooks.length === 0) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const results = await Promise.all(
    notebooks.map((nb, index) =>
      (supabase.from("notebooks" as any) as any)
        .update({ order: index })
        .eq("id", nb.id)
        .eq("user_id", user.id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
