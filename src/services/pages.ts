import { supabase } from "../lib/supabase";
import type { Page, BlockType } from "../types/database";

export async function fetchPages(noteId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("note_id", noteId)
    .order("order");
  if (error) throw error;
  return data;
}

export async function createPage(
  noteId: string,
  blockType: BlockType,
  order: number,
): Promise<Page> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("pages")
    .insert({
      note_id: noteId,
      user_id: user.id,
      block_type: blockType,
      title: "",
      content: "",
      checked: false,
      order,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePage(
  id: string,
  fields: { title?: string; content?: string; checked?: boolean },
): Promise<void> {
  const { error } = await supabase.from("pages").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}
