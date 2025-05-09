
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useTeam } from "./TeamContext";
import supabase from "@/lib/supabaseClient";

interface UnreadMessagesContextType {
  unreadCounts: { [channelId: string]: number };
  totalUnread: number;
  refreshUnreadCounts: () => Promise<void>;
  markChannelAsRead: (channelId: string) => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadCounts: {},
  totalUnread: 0,
  refreshUnreadCounts: async () => {},
  markChannelAsRead: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<{ [channelId: string]: number }>({});
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const refreshUnreadCounts = async () => {
    if (!user || !currentTeam) {
      setUnreadCounts({});
      return;
    }

    try {
      // Get all channels in the current team
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id, last_message_at')
        .eq('team_id', currentTeam.id);

      if (channelsError) throw channelsError;

      if (channels) {
        // For each channel, count unread messages
        const counts: { [channelId: string]: number } = {};
        
        await Promise.all(channels.map(async (channel) => {
          // Get last read timestamp for this user in this channel
          const { data: readReceipt, error: receiptError } = await supabase
            .from('read_receipts')
            .select('last_read_at')
            .eq('channel_id', channel.id)
            .eq('user_id', user.id)
            .single();

          if (receiptError && receiptError.code !== 'PGRST116') { // Not found is ok
            throw receiptError;
          }

          const lastReadAt = readReceipt?.last_read_at || '1970-01-01T00:00:00Z';

          // Count messages after the last read timestamp
          const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .gt('created_at', lastReadAt)
            .neq('user_id', user.id); // Don't count your own messages

          if (countError) throw countError;

          counts[channel.id] = count || 0;
        }));
        
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error("Error refreshing unread counts:", error);
    }
  };

  useEffect(() => {
    refreshUnreadCounts();

    // Subscribe to messages for real-time updates
    if (user && currentTeam) {
      const messagesSubscription = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `user_id=neq.${user.id}` // Only other users' messages
          },
          () => {
            refreshUnreadCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [user, currentTeam]);

  const markChannelAsRead = async (channelId: string) => {
    if (!user) return;

    try {
      // Update read receipt
      const { error } = await supabase
        .from('read_receipts')
        .upsert({
          user_id: user.id,
          channel_id: channelId,
          last_read_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      // Update local state
      setUnreadCounts(prev => ({
        ...prev,
        [channelId]: 0
      }));
    } catch (error) {
      console.error("Error marking channel as read:", error);
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCounts,
        totalUnread,
        refreshUnreadCounts,
        markChannelAsRead,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};
