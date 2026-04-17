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

export async function fetchFirstPageContents(noteIds: string[]): Promise<Record<string, string>> {
  if (noteIds.length === 0) return {};
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .in("note_id", noteIds)
    .order("order");
  if (error) return {};
  const map: Record<string, string> = {};
  for (const page of data) {
    if (!map[page.note_id]) {
      const text =
        page.block_type === "paragraph" ||
        page.block_type === "bullet" ||
        page.block_type === "numbered"
          ? page.content || page.title
          : page.title || page.content;
      if (text) map[page.note_id] = text;
    }
  }
  return map;
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
  fields: { title?: string; content?: string; checked?: boolean; order?: number },
): Promise<void> {
  const { error } = await supabase.from("pages").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}
