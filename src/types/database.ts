export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  notebook_id: string;
  title: string;
  created_at: string;
}

export type BlockType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "checkbox"
  | "bullet"
  | "numbered";

export interface Page {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  content: string;
  block_type: BlockType;
  checked: boolean;
  order: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      notebooks: {
        Row: Notebook;
        Insert: { user_id: string; title: string; order: number };
        Update: { title?: string; order?: number };
        Relationships: [];
      };
      notes: {
        Row: Note;
        Insert: { user_id: string; notebook_id: string; title: string };
        Update: { title?: string };
        Relationships: [];
      };
      pages: {
        Row: Page;
        Insert: {
          user_id: string;
          note_id: string;
          title: string;
          content: string;
          block_type: BlockType;
          checked: boolean;
          order: number;
        };
        Update: {
          title?: string;
          content?: string;
          block_type?: BlockType;
          checked?: boolean;
          order?: number;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
