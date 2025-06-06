
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
      const { data, error } = await supabase
        .from('extra_time_slots')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching time slots:', error);
        throw error;
      }

      return (data || []).map((slot: SupabaseTimeSlot) => ({
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
      const supabaseSlot: Partial<SupabaseTimeSlot> = {
        date: timeSlot.date ? format(timeSlot.date, 'yyyy-MM-dd') : undefined,
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime,
        total_slots: timeSlot.slots || 1,
        slots_used: timeSlot.slotsUsed || 0,
        description: timeSlot.description || null,
        allowed_military_types: timeSlot.allowedMilitaryTypes || [],
        volunteers: timeSlot.volunteers || []
      };

      console.log('Inserting time slot to Supabase:', supabaseSlot);

      const { error } = await supabase
        .from('extra_time_slots')
        .insert([supabaseSlot]);

      if (error) {
        console.error('Error inserting time slot:', error);
        throw error;
      }

      console.log('Time slot inserted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in insert operation:', error);
      return { success: false };
    }
  },

  async update(updatedSlot: Partial<TimeSlot>, conditions: { id: string }): Promise<{ success: boolean }> {
    try {
      const supabaseSlot: Partial<SupabaseTimeSlot> = {
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
        if (supabaseSlot[key as keyof SupabaseTimeSlot] === undefined) {
          delete supabaseSlot[key as keyof SupabaseTimeSlot];
        }
      });

      console.log('Updating time slot in Supabase:', supabaseSlot);

      const { error } = await supabase
        .from('extra_time_slots')
        .update(supabaseSlot)
        .eq('id', conditions.id);

      if (error) {
        console.error('Error updating time slot:', error);
        throw error;
      }

      console.log('Time slot updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in update operation:', error);
      return { success: false };
    }
  },

  async delete(conditions: { id: string }): Promise<{ success: boolean }> {
    try {
      console.log('Deleting time slot from Supabase:', conditions.id);

      const { error } = await supabase
        .from('extra_time_slots')
        .delete()
        .eq('id', conditions.id);

      if (error) {
        console.error('Error deleting time slot:', error);
        throw error;
      }

      console.log('Time slot deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in delete operation:', error);
      return { success: false };
    }
  },

  async clear(): Promise<{ success: boolean }> {
    try {
      console.log('Clearing all time slots from Supabase');

      const { error } = await supabase
        .from('extra_time_slots')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('Error clearing time slots:', error);
        throw error;
      }

      console.log('All time slots cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in clear operation:', error);
      return { success: false };
    }
  }
};
