export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ABRIL: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      AGOSTO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      DEZEMBRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      ESCALA: {
        Row: {
          data1: string | null
          data10: string | null
          data11: string | null
          data12: string | null
          data13: string | null
          data14: string | null
          data15: string | null
          data2: string | null
          data3: string | null
          data4: string | null
          data5: string | null
          data6: string | null
          data7: string | null
          data8: string | null
          data9: string | null
          Matricula: string
          Nome: string
        }
        Insert: {
          data1?: string | null
          data10?: string | null
          data11?: string | null
          data12?: string | null
          data13?: string | null
          data14?: string | null
          data15?: string | null
          data2?: string | null
          data3?: string | null
          data4?: string | null
          data5?: string | null
          data6?: string | null
          data7?: string | null
          data8?: string | null
          data9?: string | null
          Matricula: string
          Nome?: string
        }
        Update: {
          data1?: string | null
          data10?: string | null
          data11?: string | null
          data12?: string | null
          data13?: string | null
          data14?: string | null
          data15?: string | null
          data2?: string | null
          data3?: string | null
          data4?: string | null
          data5?: string | null
          data6?: string | null
          data7?: string | null
          data8?: string | null
          data9?: string | null
          Matricula?: string
          Nome?: string
        }
        Relationships: []
      }
      FEVEREIRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Sinfra: string | null
          Sonora: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Sinfra?: string | null
          Sonora?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Sinfra?: string | null
          Sonora?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      JANEIRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: string
          Nome: string
          Sinfra: string | null
          Sonora: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: string
          Nome: string
          Sinfra?: string | null
          Sonora?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: string
          Nome?: string
          Sinfra?: string | null
          Sonora?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      JULHO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      JUNHO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      MAIO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      MARCO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      NOVEMBRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      OUTUBRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      police_officers: {
        Row: {
          cpf: string | null
          created_at: string | null
          graduacao: string
          id: string
          mae: string | null
          naturalidade: string | null
          nome: string
          pai: string | null
          rgpm: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          graduacao: string
          id?: string
          mae?: string | null
          naturalidade?: string | null
          nome: string
          pai?: string | null
          rgpm: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          graduacao?: string
          id?: string
          mae?: string | null
          naturalidade?: string | null
          nome?: string
          pai?: string | null
          rgpm?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      SETEMBRO: {
        Row: {
          "Horas 25° BPM": string | null
          Matricula: number
          Nome: string
          Saiop: string | null
          Sinfra: string | null
          "Total 25° BPM": string | null
          "Total Geral": string | null
        }
        Insert: {
          "Horas 25° BPM"?: string | null
          Matricula: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Update: {
          "Horas 25° BPM"?: string | null
          Matricula?: number
          Nome?: string
          Saiop?: string | null
          Sinfra?: string | null
          "Total 25° BPM"?: string | null
          "Total Geral"?: string | null
        }
        Relationships: []
      }
      user_slot_limits: {
        Row: {
          created_at: string | null
          id: string
          max_slots: number
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_slots?: number
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_slots?: number
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
