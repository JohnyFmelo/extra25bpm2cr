
import { supabase } from "@/integrations/supabase/client";
import { TimeSlot } from "@/types/timeSlot";
import { format, parseISO } from "date-fns";

export interface SupabaseTimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  description?: string;
  allowed_military_types?: string[];
  volunteers?: any[];
  created_at?: string;
  updated_at?: string;
}

export const supabaseOperations = {
  async fetch(): Promise<TimeSlot[]> {
    try {
      // Using raw SQL query since the table types are not in the generated types
      const { data, error } = await supabase.rpc('get_extra_time_slots') as any;

      if (error) {
        console.error('Error fetching time slots:', error);
        // Fallback to empty array if function doesn't exist
        return [];
      }

      return (data || []).map((slot: any) => ({
        id: slot.id,
        date: parseISO(slot.date),
        startTime: slot.start_time,
        endTime: slot.end_time,
        slots: slot.total_slots,
        slotsUsed: slot.slots_used,
        description: slot.description || "",
        allowedMilitaryTypes: slot.allowed_military_types || [],
        volunteers: slot.volunteers || []
      }));
    } catch (error) {
      console.error('Error in fetch operation:', error);
      return [];
    }
  },

  async insert(timeSlot: Partial<TimeSlot>): Promise<{ success: boolean }> {
    try {
      const supabaseSlot = {
        date: timeSlot.date ? format(timeSlot.date, 'yyyy-MM-dd') : undefined,
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime,
        total_slots: timeSlot.slots || 1,
        slots_used: timeSlot.slotsUsed || 0,
        description: timeSlot.description || null,
        allowed_military_types: timeSlot.allowedMilitaryTypes || [],
        volunteers: timeSlot.volunteers || []
      };

      const { error } = await supabase.rpc('insert_extra_time_slot', supabaseSlot) as any;

      if (error) {
        console.error('Error inserting time slot:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in insert operation:', error);
      return { success: false };
    }
  },

  async update(updatedSlot: Partial<TimeSlot>, conditions: { id: string }): Promise<{ success: boolean }> {
    try {
      const supabaseSlot = {
        id: conditions.id,
        date: updatedSlot.date ? format(updatedSlot.date, 'yyyy-MM-dd') : undefined,
        start_time: updatedSlot.startTime,
        end_time: updatedSlot.endTime,
        total_slots: updatedSlot.slots,
        slots_used: updatedSlot.slotsUsed,
        description: updatedSlot.description || null,
        allowed_military_types: updatedSlot.allowedMilitaryTypes || [],
        volunteers: updatedSlot.volunteers || []
      };

      // Remove undefined values
      Object.keys(supabaseSlot).forEach(key => {
        if ((supabaseSlot as any)[key] === undefined) {
          delete (supabaseSlot as any)[key];
        }
      });

      const { error } = await supabase.rpc('update_extra_time_slot', supabaseSlot) as any;

      if (error) {
        console.error('Error updating time slot:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in update operation:', error);
      return { success: false };
    }
  },

  async delete(conditions: { id: string }): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase.rpc('delete_extra_time_slot', { slot_id: conditions.id }) as any;

      if (error) {
        console.error('Error deleting time slot:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in delete operation:', error);
      return { success: false };
    }
  },

  async clear(): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase.rpc('clear_extra_time_slots') as any;

      if (error) {
        console.error('Error clearing time slots:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in clear operation:', error);
      return { success: false };
    }
  }
};
