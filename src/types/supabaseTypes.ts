

import { Database as OriginalDatabase } from "@/integrations/supabase/types";

// Define o tipo para a tabela tco_pdfs
export interface TcoPdf {
  id: string;
  tcoNumber: string;
  natureza: string;
  policiais: {
    nome: string;
    rg: string;
    posto: string;
  }[];
  pdfPath: string;
  pdfUrl: string;
  createdBy?: string;
  created_at: string;
}

// Estende a interface Database original, adicionando nossa tabela tco_pdfs
export interface Database extends OriginalDatabase {
  public: {
    Tables: {
      tco_pdfs: {
        Row: TcoPdf;
        Insert: Omit<TcoPdf, "id"> & { id?: string };
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
    } & OriginalDatabase['public']['Tables'];
    Views: OriginalDatabase['public']['Views'];
    Functions: OriginalDatabase['public']['Functions'];
    Enums: OriginalDatabase['public']['Enums'];
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  };
}

// Adding explicit type export to fix the import error while avoiding TS1205 error
export type { Database };

