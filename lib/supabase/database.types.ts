export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          class_session_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          registered_by_user_id: string | null
          school_id: string
          signaled_at: string | null
          status: string
          student_id: string
          student_notes: string | null
          updated_at: string
        }
        Insert: {
          class_session_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          registered_by_user_id?: string | null
          school_id: string
          signaled_at?: string | null
          status?: string
          student_id: string
          student_notes?: string | null
          updated_at?: string
        }
        Update: {
          class_session_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          registered_by_user_id?: string | null
          school_id?: string
          signaled_at?: string | null
          status?: string
          student_id?: string
          student_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          school_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          school_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_systems: {
        Row: {
          audience: string
          created_at: string
          description: string | null
          id: string
          modality_id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          audience: string
          created_at?: string
          description?: string | null
          id?: string
          modality_id: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          description?: string | null
          id?: string
          modality_id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belt_systems_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_systems_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_graduation_requirements: {
        Row: {
          belt_system_id: string
          created_at: string
          from_belt_id: string
          id: string
          required_classes: number
          school_id: string
          to_belt_id: string
          updated_at: string
        }
        Insert: {
          belt_system_id: string
          created_at?: string
          from_belt_id: string
          id?: string
          required_classes?: number
          school_id: string
          to_belt_id: string
          updated_at?: string
        }
        Update: {
          belt_system_id?: string
          created_at?: string
          from_belt_id?: string
          id?: string
          required_classes?: number
          school_id?: string
          to_belt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belt_graduation_requirements_belt_system_id_fkey"
            columns: ["belt_system_id"]
            isOneToOne: false
            referencedRelation: "belt_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_graduation_requirements_from_belt_id_fkey"
            columns: ["from_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_graduation_requirements_to_belt_id_fkey"
            columns: ["to_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_graduation_requirements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      belts: {
        Row: {
          belt_system_id: string
          color_hex: string | null
          created_at: string
          id: string
          max_degrees: number
          name: string
          ordering: number
          school_id: string
          updated_at: string
        }
        Insert: {
          belt_system_id: string
          color_hex?: string | null
          created_at?: string
          id?: string
          max_degrees?: number
          name: string
          ordering: number
          school_id: string
          updated_at?: string
        }
        Update: {
          belt_system_id?: string
          color_hex?: string | null
          created_at?: string
          id?: string
          max_degrees?: number
          name?: string
          ordering?: number
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belts_belt_system_id_fkey"
            columns: ["belt_system_id"]
            isOneToOne: false
            referencedRelation: "belt_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_groups: {
        Row: {
          capacity: number | null
          created_at: string
          end_date: string | null
          end_time: string
          id: string
          main_teacher_id: string | null
          min_belt_id: string | null
          min_degree: number | null
          modality_id: string
          name: string
          notes: string | null
          school_id: string
          sex_restriction: string | null
          start_date: string | null
          start_time: string
          status: string
          suggested_audience: string | null
          suggested_student_limit: number | null
          unit_id: string
          updated_at: string
          week_days: number[]
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          end_date?: string | null
          end_time: string
          id?: string
          main_teacher_id?: string | null
          min_belt_id?: string | null
          min_degree?: number | null
          modality_id: string
          name: string
          notes?: string | null
          school_id: string
          sex_restriction?: string | null
          start_date?: string | null
          start_time: string
          status?: string
          suggested_audience?: string | null
          suggested_student_limit?: number | null
          unit_id: string
          updated_at?: string
          week_days?: number[]
        }
        Update: {
          capacity?: number | null
          created_at?: string
          end_date?: string | null
          end_time?: string
          id?: string
          main_teacher_id?: string | null
          min_belt_id?: string | null
          min_degree?: number | null
          modality_id?: string
          name?: string
          notes?: string | null
          school_id?: string
          sex_restriction?: string | null
          start_date?: string | null
          start_time?: string
          status?: string
          suggested_audience?: string | null
          suggested_student_limit?: number | null
          unit_id?: string
          updated_at?: string
          week_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "class_groups_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_min_belt_id_fkey"
            columns: ["min_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          actual_teacher_id: string | null
          attendance_closed_at: string | null
          class_group_id: string
          created_at: string
          date: string
          id: string
          lesson_content: string | null
          notes: string | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_teacher_id?: string | null
          attendance_closed_at?: string | null
          class_group_id: string
          created_at?: string
          date?: string
          id?: string
          lesson_content?: string | null
          notes?: string | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_teacher_id?: string | null
          attendance_closed_at?: string | null
          class_group_id?: string
          created_at?: string
          date?: string
          id?: string
          lesson_content?: string | null
          notes?: string | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_actual_teacher_id_fkey"
            columns: ["actual_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "todays_class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_installments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          reference_month: string
          remaining_amount: number
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          reference_month: string
          remaining_amount: number
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          reference_month?: string
          remaining_amount?: number
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_installments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_students: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_students_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string | null
          final_price: number
          financial_responsible_id: string | null
          financial_responsible_type: string
          first_due_date: string
          id: string
          installment_amount: number
          installments_count: number
          notes: string | null
          original_price: number
          payment_day: number | null
          plan_id: string
          price_table_id: string
          school_id: string
          setup_fee_amount: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          final_price: number
          financial_responsible_id?: string | null
          financial_responsible_type: string
          first_due_date: string
          id?: string
          installment_amount: number
          installments_count?: number
          notes?: string | null
          original_price: number
          payment_day?: number | null
          plan_id: string
          price_table_id: string
          school_id: string
          setup_fee_amount?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          final_price?: number
          financial_responsible_id?: string | null
          financial_responsible_type?: string
          first_due_date?: string
          id?: string
          installment_amount?: number
          installments_count?: number
          notes?: string | null
          original_price?: number
          payment_day?: number | null
          plan_id?: string
          price_table_id?: string
          school_id?: string
          setup_fee_amount?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_movements: {
        Row: {
          amount: number
          category: string
          contract_id: string | null
          contract_installment_id: string | null
          created_at: string
          description: string | null
          financial_account_id: string
          id: string
          movement_date: string
          payment_method: string | null
          school_id: string
          student_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          contract_id?: string | null
          contract_installment_id?: string | null
          created_at?: string
          description?: string | null
          financial_account_id: string
          id?: string
          movement_date?: string
          payment_method?: string | null
          school_id: string
          student_id: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          contract_id?: string | null
          contract_installment_id?: string | null
          created_at?: string
          description?: string | null
          financial_account_id?: string
          id?: string
          movement_date?: string
          payment_method?: string | null
          school_id?: string
          student_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_movements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_contract_installment_id_fkey"
            columns: ["contract_installment_id"]
            isOneToOne: false
            referencedRelation: "contract_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_financial_account_id_fkey"
            columns: ["financial_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_history: {
        Row: {
          created_at: string
          graduation_date: string
          id: string
          modality_id: string
          new_belt_id: string
          new_degree: number
          notes: string | null
          previous_belt_id: string | null
          previous_degree: number
          registered_by_teacher_id: string | null
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          graduation_date?: string
          id?: string
          modality_id: string
          new_belt_id: string
          new_degree?: number
          notes?: string | null
          previous_belt_id?: string | null
          previous_degree?: number
          registered_by_teacher_id?: string | null
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          graduation_date?: string
          id?: string
          modality_id?: string
          new_belt_id?: string
          new_degree?: number
          notes?: string | null
          previous_belt_id?: string | null
          previous_degree?: number
          registered_by_teacher_id?: string | null
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_history_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_new_belt_id_fkey"
            columns: ["new_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_previous_belt_id_fkey"
            columns: ["previous_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_registered_by_teacher_id_fkey"
            columns: ["registered_by_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_suggestions: {
        Row: {
          created_at: string
          current_belt_id: string | null
          current_degree: number | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          school_id: string
          status: string
          student_id: string
          suggested_belt_id: string | null
          suggested_by_teacher_id: string | null
          suggested_degree: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_belt_id?: string | null
          current_degree?: number | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          school_id: string
          status?: string
          student_id: string
          suggested_belt_id?: string | null
          suggested_by_teacher_id?: string | null
          suggested_degree?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_belt_id?: string | null
          current_degree?: number | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          school_id?: string
          status?: string
          student_id?: string
          suggested_belt_id?: string | null
          suggested_by_teacher_id?: string | null
          suggested_degree?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_suggestions_current_belt_id_fkey"
            columns: ["current_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_suggested_belt_id_fkey"
            columns: ["suggested_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graduation_suggestions_suggested_by_teacher_id_fkey"
            columns: ["suggested_by_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_charges: {
        Row: {
          amount: number
          charge_type: string
          contract_installment_id: string
          created_at: string
          id: string
          pix_key: string | null
          pix_payload: string | null
          school_id: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          amount: number
          charge_type?: string
          contract_installment_id: string
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_payload?: string | null
          school_id: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          amount?: number
          charge_type?: string
          contract_installment_id?: string
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_payload?: string | null
          school_id?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_charges_contract_installment_id_fkey"
            columns: ["contract_installment_id"]
            isOneToOne: false
            referencedRelation: "contract_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_charges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_charges_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_class_groups: {
        Row: {
          class_group_id: string
          created_at: string
          id: string
          label_override: string | null
          ordering: number
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          class_group_id: string
          created_at?: string
          id?: string
          label_override?: string | null
          ordering?: number
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          class_group_id?: string
          created_at?: string
          id?: string
          label_override?: string | null
          ordering?: number
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_class_groups_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_class_groups_class_group_id_fkey"
            columns: ["class_group_id"]
            isOneToOne: false
            referencedRelation: "todays_class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_class_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          about: Json
          campaign: Json
          contact: Json
          created_at: string
          footer: Json
          hero: Json
          id: string
          identity: Json
          metrics: Json
          navigation: Json
          published_at: string | null
          school_id: string
          seo: Json
          status: string
          updated_at: string
        }
        Insert: {
          about?: Json
          campaign?: Json
          contact?: Json
          created_at?: string
          footer?: Json
          hero?: Json
          id?: string
          identity?: Json
          metrics?: Json
          navigation?: Json
          published_at?: string | null
          school_id: string
          seo?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          about?: Json
          campaign?: Json
          contact?: Json
          created_at?: string
          footer?: Json
          hero?: Json
          id?: string
          identity?: Json
          metrics?: Json
          navigation?: Json
          published_at?: string | null
          school_id?: string
          seo?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_teacher_profiles: {
        Row: {
          belt_label: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          instagram_url: string | null
          ordering: number
          photo_url: string | null
          quote: string | null
          role_title: string | null
          school_id: string
          specialties: string[]
          status: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          belt_label?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          instagram_url?: string | null
          ordering?: number
          photo_url?: string | null
          quote?: string | null
          role_title?: string | null
          school_id: string
          specialties?: string[]
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          belt_label?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          instagram_url?: string | null
          ordering?: number
          photo_url?: string | null
          quote?: string | null
          role_title?: string | null
          school_id?: string
          specialties?: string[]
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_teacher_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_teacher_profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted_student_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          school_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          converted_student_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          school_id: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          converted_student_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          school_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      medal_event_point_rules: {
        Row: {
          event_id: string
          id: string
          level: string
          points: number
        }
        Insert: {
          event_id: string
          id?: string
          level: string
          points: number
        }
        Update: {
          event_id?: string
          id?: string
          level?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "medal_event_point_rules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "medal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      medal_events: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          event_date: string
          id: string
          modality_id: string | null
          name: string
          organization: string | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          event_date: string
          id?: string
          modality_id?: string | null
          name: string
          organization?: string | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          event_date?: string
          id?: string
          modality_id?: string | null
          name?: string
          organization?: string | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medal_events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medal_events_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medal_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      medal_point_rules: {
        Row: {
          id: string
          level: string
          points: number
          school_id: string
        }
        Insert: {
          id?: string
          level: string
          points: number
          school_id: string
        }
        Update: {
          id?: string
          level?: string
          points?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medal_point_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      medals: {
        Row: {
          category: string | null
          created_at: string
          event_id: string
          id: string
          level: string
          modality_id: string | null
          proof_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          school_id: string
          status: string
          student_id: string
          submitted_by_student_id: string | null
          submitted_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_id: string
          id?: string
          level: string
          modality_id?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          school_id: string
          status?: string
          student_id: string
          submitted_by_student_id?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          event_id?: string
          id?: string
          level?: string
          modality_id?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          school_id?: string
          status?: string
          student_id?: string
          submitted_by_student_id?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "medal_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_submitted_by_student_id_fkey"
            columns: ["submitted_by_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medals_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modalities: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          school_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          school_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          school_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modalities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          school_id: string
          student_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          school_id: string
          student_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          school_id?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          contract_id: string
          created_at: string
          created_by_user_id: string | null
          id: string
          reason: string | null
          school_id: string
        }
        Insert: {
          adjustment_type: string
          amount: number
          contract_id: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          reason?: string | null
          school_id: string
        }
        Update: {
          adjustment_type?: string
          amount?: number
          contract_id?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          reason?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_adjustments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustments_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_adjustments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_price: number
          classes_per_week: number | null
          classes_total: number | null
          created_at: string
          description: string | null
          duration_months: number
          id: string
          loyalty_months: number
          name: string
          plan_duration: string
          price_table_id: string
          school_id: string
          setup_fee: number
          status: string
          unlimited: boolean
          updated_at: string
        }
        Insert: {
          base_price: number
          classes_per_week?: number | null
          classes_total?: number | null
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          loyalty_months?: number
          name: string
          plan_duration: string
          price_table_id: string
          school_id: string
          setup_fee?: number
          status?: string
          unlimited?: boolean
          updated_at?: string
        }
        Update: {
          base_price?: number
          classes_per_week?: number | null
          classes_total?: number | null
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          loyalty_months?: number
          name?: string
          plan_duration?: string
          price_table_id?: string
          school_id?: string
          setup_fee?: number
          status?: string
          unlimited?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          status: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          status?: string
          updated_at?: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          status?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tables_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          pix_key: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_financial_exemptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          reason: string
          school_id: string
          start_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason: string
          school_id: string
          start_date?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string
          school_id?: string
          start_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_financial_exemptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_financial_exemptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_financial_exemptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_financial_responsible: boolean
          is_primary: boolean
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_financial_responsible?: boolean
          is_primary?: boolean
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_financial_responsible?: boolean
          is_primary?: boolean
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internal_notes: {
        Row: {
          author_user_id: string | null
          created_at: string
          id: string
          note: string
          school_id: string
          student_id: string
        }
        Insert: {
          author_user_id?: string | null
          created_at?: string
          id?: string
          note: string
          school_id: string
          student_id: string
        }
        Update: {
          author_user_id?: string | null
          created_at?: string
          id?: string
          note?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_internal_notes_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internal_notes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internal_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          auth_user_id: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          current_belt_id: string | null
          current_contract_id: string | null
          current_degree: number
          email: string | null
          emergency_contact: string | null
          enrollment_date: string
          financial_status: string
          id: string
          last_graduation_date: string | null
          lgpd_consent_at: string | null
          main_teacher_id: string | null
          medical_certificate_expires_at: string | null
          medical_certificate_url: string | null
          medical_notes: string | null
          must_change_password: boolean
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          school_id: string
          sex: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          current_belt_id?: string | null
          current_contract_id?: string | null
          current_degree?: number
          email?: string | null
          emergency_contact?: string | null
          enrollment_date?: string
          financial_status?: string
          id?: string
          last_graduation_date?: string | null
          lgpd_consent_at?: string | null
          main_teacher_id?: string | null
          medical_certificate_expires_at?: string | null
          medical_certificate_url?: string | null
          medical_notes?: string | null
          must_change_password?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id: string
          sex?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          current_belt_id?: string | null
          current_contract_id?: string | null
          current_degree?: number
          email?: string | null
          emergency_contact?: string | null
          enrollment_date?: string
          financial_status?: string
          id?: string
          last_graduation_date?: string | null
          lgpd_consent_at?: string | null
          main_teacher_id?: string | null
          medical_certificate_expires_at?: string | null
          medical_certificate_url?: string | null
          medical_notes?: string | null
          must_change_password?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          sex?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_current_belt_id_fkey"
            columns: ["current_belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_current_contract_id_fkey"
            columns: ["current_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_graduations: {
        Row: {
          belt_id: string
          created_at: string
          degree: number
          id: string
          modality_id: string
          school_id: string
          since_date: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          belt_id: string
          created_at?: string
          degree?: number
          id?: string
          modality_id: string
          school_id: string
          since_date?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          belt_id?: string
          created_at?: string
          degree?: number
          id?: string
          modality_id?: string
          school_id?: string
          since_date?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_graduations_belt_id_fkey"
            columns: ["belt_id"]
            isOneToOne: false
            referencedRelation: "belts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_graduations_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_graduations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_graduations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          id: string
          name: string
          role: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_positions: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string
          end_date: string | null
          id: string
          image_url: string
          published: boolean
          school_id: string
          start_date: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description: string
          end_date?: string | null
          id?: string
          image_url: string
          published?: boolean
          school_id: string
          start_date: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string
          published?: boolean
          school_id?: string
          start_date?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_positions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_positions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_message_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          message_template: string
          notify_students: boolean
          notify_teachers: boolean
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          message_template?: string
          notify_students?: boolean
          notify_teachers?: boolean
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          message_template?: string
          notify_students?: boolean
          notify_teachers?: boolean
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_message_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_birthday_messages: {
        Row: {
          channel: string
          created_at: string
          date: string
          error_message: string | null
          id: string
          recipient_type: string
          school_id: string
          status: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          date: string
          error_message?: string | null
          id?: string
          recipient_type: string
          school_id: string
          status: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          date?: string
          error_message?: string | null
          id?: string
          recipient_type?: string
          school_id?: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_birthday_messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_birthday_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_birthday_messages_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      birthday_students: {
        Row: {
          birth_date: string | null
          birth_day: number | null
          id: string | null
          name: string | null
          phone: string | null
          photo_url: string | null
          school_id: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_day?: never
          id?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_day?: never
          id?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      overdue_students: {
        Row: {
          oldest_overdue_due_date: string | null
          overdue_amount: number | null
          overdue_installments_count: number | null
          school_id: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_installments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "birthday_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_directory: {
        Row: {
          current_belt_id: string | null
          current_degree: number | null
          id: string | null
          name: string | null
          photo_url: string | null
          school_id: string | null
          status: string | null
        }
        Relationships: []
      }
      todays_class_groups: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string | null
          main_teacher_id: string | null
          modality_id: string | null
          name: string | null
          notes: string | null
          school_id: string | null
          start_time: string | null
          status: string | null
          suggested_audience: string | null
          suggested_student_limit: number | null
          unit_id: string | null
          updated_at: string | null
          week_days: number[] | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string | null
          main_teacher_id?: string | null
          modality_id?: string | null
          name?: string | null
          notes?: string | null
          school_id?: string | null
          start_time?: string | null
          status?: string | null
          suggested_audience?: string | null
          suggested_student_limit?: number | null
          unit_id?: string | null
          updated_at?: string | null
          week_days?: number[] | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string | null
          main_teacher_id?: string | null
          modality_id?: string | null
          name?: string | null
          notes?: string | null
          school_id?: string | null
          start_time?: string | null
          status?: string | null
          suggested_audience?: string | null
          suggested_student_limit?: number | null
          unit_id?: string | null
          updated_at?: string | null
          week_days?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "class_groups_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_school_with_admin: {
        Args: {
          p_admin_email: string
          p_admin_name: string
          p_auth_user_id: string
          p_school_name: string
        }
        Returns: string
      }
      current_school_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
