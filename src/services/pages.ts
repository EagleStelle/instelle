import { supabase } from "../lib/supabase";
import type { Page, BlockType } from "../types/database";

const CHECKBOX_CONTENT_PREFIX = "__checkbox_items__:";

function getCheckboxPreviewText(page: Page): string {
  if (page.title) return page.title;
  if (!page.content || !page.content.startsWith(CHECKBOX_CONTENT_PREFIX)) {
    return page.content || "";
  }

  try {
    const raw = JSON.parse(page.content.slice(CHECKBOX_CONTENT_PREFIX.length));
    if (!Array.isArray(raw)) return "";
    const firstText = raw.find(
      (item): item is { title: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof item.title === "string" &&
        item.title.length > 0,
    );
    return firstText?.title || "";
  } catch {
    return "";
  }
}

export async function fetchPages(noteId: string): Promise<Page[]> {
  const { data, error } = await (supabase.from("pages" as any) as any)
    .select("*")
    .eq("note_id", noteId)
    .order("order");
  if (error) throw error;
  return (data ?? []) as Page[];
}

export async function fetchFirstPageContents(
  noteIds: string[],
): Promise<Record<string, string>> {
  if (noteIds.length === 0) return {};
  const { data, error } = await (supabase.from("pages" as any) as any)
    .select("*")
    .in("note_id", noteIds)
    .order("order");
  if (error) return {};
  const rows = (data ?? []) as Page[];
  const map: Record<string, string> = {};
  for (const page of rows) {
    if (!map[page.note_id]) {
      const text =
        page.block_type === "paragraph" ||
        page.block_type === "bullet" ||
        page.block_type === "numbered"
          ? page.content || page.title
          : page.block_type === "checkbox"
            ? getCheckboxPreviewText(page)
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase.from("pages" as any) as any)
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
  return data as Page;
}

export async function updatePage(
  id: string,
  fields: {
    title?: string;
    content?: string;
    checked?: boolean;
    order?: number;
  },
): Promise<void> {
  const { error } = await (supabase.from("pages" as any) as any)
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await (supabase.from("pages" as any) as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
