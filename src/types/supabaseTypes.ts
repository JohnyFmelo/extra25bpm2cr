
/**
 * This file extends the Supabase database types to include our custom tables
 * that may not be included in the auto-generated types.
 */

import { Database as GeneratedDatabase } from "@/integrations/supabase/types";

// Define our TCO PDFs table structure
export interface TcoPdf {
  id: string; // UUID
  tcoNumber: string;
  natureza: string;
  policiais: Array<{ nome: string, rg: string, posto: string }>;
  pdfPath: string;
  pdfUrl: string;
  createdBy?: string; // UUID of creator, optional as it might be null
  created_at: string;
}

// Extend the generated database types
export interface Database extends GeneratedDatabase {
  public: {
    Tables: {
      tco_pdfs: {
        Row: TcoPdf;
        Insert: Omit<TcoPdf, 'id'> & { id?: string }; // Allow id to be optional for inserts
        Update: Partial<TcoPdf>;
        Relationships: [
          {
            foreignKeyName: "tco_pdfs_createdBy_fkey";
            columns: ["createdBy"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    } & GeneratedDatabase['public']['Tables'];
  };
}

// Utility type helper for accessing tables with proper typing
export type Tables = Database['public']['Tables'];
