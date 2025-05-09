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
      tcos: {
        Row: {
          apreensoes: string | null
          autores: Json | null
          componentes_guarnicao: Json | null
          comunicante: string | null
          conclusao_policial: string | null
          created_at: string | null
          created_by: string | null
          custom_natureza: string | null
          data_fato: string | null
          data_inicio_registro: string | null
          data_termino_registro: string | null
          droga_cor: string | null
          droga_custom_desc: string | null
          droga_is_unknown: boolean | null
          droga_nome_comum: string | null
          droga_quantidade: string | null
          droga_tipo: string | null
          end_time: string | null
          endereco: string | null
          guarnicao: string | null
          hora_fato: string | null
          hora_inicio_registro: string | null
          hora_termino_registro: string | null
          id: string
          image_urls: string[] | null
          lacre_numero: string | null
          local_fato: string | null
          municipio: string | null
          natureza: string | null
          operacao: string | null
          original_natureza: string | null
          pdf_path: string | null
          pdf_url: string | null
          pena_descricao: string | null
          relato_autor: string | null
          relato_policial: string | null
          relato_testemunha: string | null
          relato_vitima: string | null
          representacao: string | null
          start_time: string | null
          tco_number: string
          testemunhas: Json | null
          tipificacao: string | null
          updated_at: string | null
          user_registration: string | null
          video_links: string[] | null
          vitimas: Json | null
        }
        Insert: {
          apreensoes?: string | null
          autores?: Json | null
          componentes_guarnicao?: Json | null
          comunicante?: string | null
          conclusao_policial?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_natureza?: string | null
          data_fato?: string | null
          data_inicio_registro?: string | null
          data_termino_registro?: string | null
          droga_cor?: string | null
          droga_custom_desc?: string | null
          droga_is_unknown?: boolean | null
          droga_nome_comum?: string | null
          droga_quantidade?: string | null
          droga_tipo?: string | null
          end_time?: string | null
          endereco?: string | null
          guarnicao?: string | null
          hora_fato?: string | null
          hora_inicio_registro?: string | null
          hora_termino_registro?: string | null
          id?: string
          image_urls?: string[] | null
          lacre_numero?: string | null
          local_fato?: string | null
          municipio?: string | null
          natureza?: string | null
          operacao?: string | null
          original_natureza?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          pena_descricao?: string | null
          relato_autor?: string | null
          relato_policial?: string | null
          relato_testemunha?: string | null
          relato_vitima?: string | null
          representacao?: string | null
          start_time?: string | null
          tco_number: string
          testemunhas?: Json | null
          tipificacao?: string | null
          updated_at?: string | null
          user_registration?: string | null
          video_links?: string[] | null
          vitimas?: Json | null
        }
        Update: {
          apreensoes?: string | null
          autores?: Json | null
          componentes_guarnicao?: Json | null
          comunicante?: string | null
          conclusao_policial?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_natureza?: string | null
          data_fato?: string | null
          data_inicio_registro?: string | null
          data_termino_registro?: string | null
          droga_cor?: string | null
          droga_custom_desc?: string | null
          droga_is_unknown?: boolean | null
          droga_nome_comum?: string | null
          droga_quantidade?: string | null
          droga_tipo?: string | null
          end_time?: string | null
          endereco?: string | null
          guarnicao?: string | null
          hora_fato?: string | null
          hora_inicio_registro?: string | null
          hora_termino_registro?: string | null
          id?: string
          image_urls?: string[] | null
          lacre_numero?: string | null
          local_fato?: string | null
          municipio?: string | null
          natureza?: string | null
          operacao?: string | null
          original_natureza?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          pena_descricao?: string | null
          relato_autor?: string | null
          relato_policial?: string | null
          relato_testemunha?: string | null
          relato_vitima?: string | null
          representacao?: string | null
          start_time?: string | null
          tco_number?: string
          testemunhas?: Json | null
          tipificacao?: string | null
          updated_at?: string | null
          user_registration?: string | null
          video_links?: string[] | null
          vitimas?: Json | null
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
