export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      aviamentos: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string
          fornecedor_id: string | null
          id: string
          preco_un: number | null
          tamanho: string | null
          tipo: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao: string
          fornecedor_id?: string | null
          id?: string
          preco_un?: number | null
          tamanho?: string | null
          tipo: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          preco_un?: number | null
          tamanho?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      aviamentos_ordem: {
        Row: {
          aviamento_id: string | null
          descricao: string
          id: string
          ordem_corte_id: string
          quantidade: number
        }
        Insert: {
          aviamento_id?: string | null
          descricao: string
          id?: string
          ordem_corte_id: string
          quantidade?: number
        }
        Update: {
          aviamento_id?: string | null
          descricao?: string
          id?: string
          ordem_corte_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "aviamentos_ordem_aviamento_id_fkey"
            columns: ["aviamento_id"]
            isOneToOne: false
            referencedRelation: "aviamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aviamentos_ordem_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cidade: string | null
          cnpj: string | null
          contato: string | null
          created_at: string
          id: string
          prazo_recebimento: number | null
          razao_social: string
          status: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          prazo_recebimento?: number | null
          razao_social: string
          status?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          prazo_recebimento?: number | null
          razao_social?: string
          status?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entrega_cliente: {
        Row: {
          cliente_id: string | null
          created_at: string
          created_by: string | null
          data_entrega: string | null
          id: string
          observacoes: string | null
          oficina_nome: string | null
          ordem_corte_id: string
          qtd_entregue: number | null
          recebimento_id: string | null
          segunda_qualidade: number | null
          status: string
          tempo_producao: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          id?: string
          observacoes?: string | null
          oficina_nome?: string | null
          ordem_corte_id: string
          qtd_entregue?: number | null
          recebimento_id?: string | null
          segunda_qualidade?: number | null
          status?: string
          tempo_producao?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          id?: string
          observacoes?: string | null
          oficina_nome?: string | null
          ordem_corte_id?: string
          qtd_entregue?: number | null
          recebimento_id?: string | null
          segunda_qualidade?: number | null
          status?: string
          tempo_producao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrega_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrega_cliente_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrega_cliente_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimento"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          ordem_corte_id: string | null
          quantidade_kg: number
          tecido_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ordem_corte_id?: string | null
          quantidade_kg: number
          tecido_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ordem_corte_id?: string | null
          quantidade_kg?: number
          tecido_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_tecido_id_fkey"
            columns: ["tecido_id"]
            isOneToOne: false
            referencedRelation: "tecidos"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao: {
        Row: {
          created_at: string
          created_by: string | null
          data_saida: string | null
          destino: string | null
          id: string
          nota_fiscal: string | null
          observacoes: string | null
          oficina_id: string | null
          oficina_nome: string | null
          ordem_corte_id: string
          preco_peca: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_saida?: string | null
          destino?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          oficina_id?: string | null
          oficina_nome?: string | null
          ordem_corte_id: string
          preco_peca?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_saida?: string | null
          destino?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          oficina_id?: string | null
          oficina_nome?: string | null
          ordem_corte_id?: string
          preco_peca?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cidade: string | null
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          prazo_pagamento: number | null
          razao_social: string
          status: string
          telefone: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          prazo_pagamento?: number | null
          razao_social: string
          status?: string
          telefone?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          prazo_pagamento?: number | null
          razao_social?: string
          status?: string
          telefone?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      grade_corte: {
        Row: {
          cor: string
          g: number | null
          g1: number | null
          g2: number | null
          g3: number | null
          gg: number | null
          id: string
          m: number | null
          ordem_corte_id: string
          p: number | null
          pp: number | null
          tecido_id: string | null
        }
        Insert: {
          cor: string
          g?: number | null
          g1?: number | null
          g2?: number | null
          g3?: number | null
          gg?: number | null
          id?: string
          m?: number | null
          ordem_corte_id: string
          p?: number | null
          pp?: number | null
          tecido_id?: string | null
        }
        Update: {
          cor?: string
          g?: number | null
          g1?: number | null
          g2?: number | null
          g3?: number | null
          gg?: number | null
          id?: string
          m?: number | null
          ordem_corte_id?: string
          p?: number | null
          pp?: number | null
          tecido_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_corte_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_corte_tecido_id_fkey"
            columns: ["tecido_id"]
            isOneToOne: false
            referencedRelation: "tecidos"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_expedicao: {
        Row: {
          cor: string
          expedicao_id: string
          g_exp: number | null
          g_prod: number | null
          g1_exp: number | null
          g1_prod: number | null
          g2_exp: number | null
          g2_prod: number | null
          g3_exp: number | null
          g3_prod: number | null
          gg_exp: number | null
          gg_prod: number | null
          id: string
          m_exp: number | null
          m_prod: number | null
          p_exp: number | null
          p_prod: number | null
          pp_exp: number | null
          pp_prod: number | null
        }
        Insert: {
          cor: string
          expedicao_id: string
          g_exp?: number | null
          g_prod?: number | null
          g1_exp?: number | null
          g1_prod?: number | null
          g2_exp?: number | null
          g2_prod?: number | null
          g3_exp?: number | null
          g3_prod?: number | null
          gg_exp?: number | null
          gg_prod?: number | null
          id?: string
          m_exp?: number | null
          m_prod?: number | null
          p_exp?: number | null
          p_prod?: number | null
          pp_exp?: number | null
          pp_prod?: number | null
        }
        Update: {
          cor?: string
          expedicao_id?: string
          g_exp?: number | null
          g_prod?: number | null
          g1_exp?: number | null
          g1_prod?: number | null
          g2_exp?: number | null
          g2_prod?: number | null
          g3_exp?: number | null
          g3_prod?: number | null
          gg_exp?: number | null
          gg_prod?: number | null
          id?: string
          m_exp?: number | null
          m_prod?: number | null
          p_exp?: number | null
          p_prod?: number | null
          pp_exp?: number | null
          pp_prod?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_expedicao_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos: {
        Row: {
          colecao: string | null
          consumo_tecido: number | null
          created_at: string
          descricao: string
          id: string
          imagem_url: string | null
          referencia: string
          status: string
          tamanhos_grade: string | null
          tecido_principal: string | null
          updated_at: string
        }
        Insert: {
          colecao?: string | null
          consumo_tecido?: number | null
          created_at?: string
          descricao: string
          id?: string
          imagem_url?: string | null
          referencia: string
          status?: string
          tamanhos_grade?: string | null
          tecido_principal?: string | null
          updated_at?: string
        }
        Update: {
          colecao?: string | null
          consumo_tecido?: number | null
          created_at?: string
          descricao?: string
          id?: string
          imagem_url?: string | null
          referencia?: string
          status?: string
          tamanhos_grade?: string | null
          tecido_principal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ordens_corte: {
        Row: {
          cliente_id: string | null
          consumo_por_peca: number | null
          cortador: string | null
          created_at: string
          created_by: string | null
          data_corte: string | null
          enfestos: number | null
          id: string
          modelo_id: string | null
          modelo_ref: string | null
          numero: string
          observacoes: string | null
          perda_percent: number | null
          quantidade_pecas: number
          status: string
          tecido_id: string | null
          tecido_nome: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          consumo_por_peca?: number | null
          cortador?: string | null
          created_at?: string
          created_by?: string | null
          data_corte?: string | null
          enfestos?: number | null
          id?: string
          modelo_id?: string | null
          modelo_ref?: string | null
          numero: string
          observacoes?: string | null
          perda_percent?: number | null
          quantidade_pecas?: number
          status?: string
          tecido_id?: string | null
          tecido_nome?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          consumo_por_peca?: number | null
          cortador?: string | null
          created_at?: string
          created_by?: string | null
          data_corte?: string | null
          enfestos?: number | null
          id?: string
          modelo_id?: string | null
          modelo_ref?: string | null
          numero?: string
          observacoes?: string | null
          perda_percent?: number | null
          quantidade_pecas?: number
          status?: string
          tecido_id?: string | null
          tecido_nome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_corte_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_corte_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_corte_tecido_id_fkey"
            columns: ["tecido_id"]
            isOneToOne: false
            referencedRelation: "tecidos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recebimento: {
        Row: {
          created_at: string
          created_by: string | null
          data_envio: string | null
          data_recebimento: string | null
          defeitos: number | null
          expedicao_id: string
          id: string
          observacoes: string | null
          oficina_nome: string | null
          ordem_corte_id: string
          segunda_qualidade: number | null
          status: string
          total_pagar: number | null
          total_sem_defeitos: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          defeitos?: number | null
          expedicao_id: string
          id?: string
          observacoes?: string | null
          oficina_nome?: string | null
          ordem_corte_id: string
          segunda_qualidade?: number | null
          status?: string
          total_pagar?: number | null
          total_sem_defeitos?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          defeitos?: number | null
          expedicao_id?: string
          id?: string
          observacoes?: string | null
          oficina_nome?: string | null
          ordem_corte_id?: string
          segunda_qualidade?: number | null
          status?: string
          total_pagar?: number | null
          total_sem_defeitos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_ordem_corte_id_fkey"
            columns: ["ordem_corte_id"]
            isOneToOne: false
            referencedRelation: "ordens_corte"
            referencedColumns: ["id"]
          },
        ]
      }
      tecidos: {
        Row: {
          cliente_id: string | null
          composicao: string | null
          cor: string | null
          created_at: string
          estoque_kg: number
          id: string
          largura: number | null
          nome: string
          peso: number | null
          preco_kg: number
          status: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          composicao?: string | null
          cor?: string | null
          created_at?: string
          estoque_kg?: number
          id?: string
          largura?: number | null
          nome: string
          peso?: number | null
          preco_kg?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          composicao?: string | null
          cor?: string | null
          created_at?: string
          estoque_kg?: number
          id?: string
          largura?: number | null
          nome?: string
          peso?: number | null
          preco_kg?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "corte"
        | "modelagem"
        | "expedicao"
        | "recebimento"
        | "acabamento"
        | "gestao"
        | "dev"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "corte",
        "modelagem",
        "expedicao",
        "recebimento",
        "acabamento",
        "gestao",
        "dev",
      ],
    },
  },
} as const
