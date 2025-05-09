
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import supabase from "@/lib/supabaseClient";

interface Team {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "admin" | "member";
  username?: string;
  email?: string;
}

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  teamMembers: TeamMember[];
  loading: boolean;
  setCurrentTeam: (team: Team | null) => void;
  createTeam: (name: string, description?: string) => Promise<{ error: any }>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<{ error: any }>;
  deleteTeam: (id: string) => Promise<{ error: any }>;
  loadTeamMembers: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, email: string, role?: "admin" | "member") => Promise<{ error: any }>;
  removeTeamMember: (teamId: string, userId: string) => Promise<{ error: any }>;
  updateMemberRole: (teamId: string, userId: string, role: "admin" | "member") => Promise<{ error: any }>;
}

const TeamContext = createContext<TeamContextType>({
  currentTeam: null,
  teams: [],
  teamMembers: [],
  loading: true,
  setCurrentTeam: () => {},
  createTeam: async () => ({ error: null }),
  updateTeam: async () => ({ error: null }),
  deleteTeam: async () => ({ error: null }),
  loadTeamMembers: async () => {},
  addTeamMember: async () => ({ error: null }),
  removeTeamMember: async () => ({ error: null }),
  updateMemberRole: async () => ({ error: null }),
});

export const useTeam = () => useContext(TeamContext);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadTeams = async () => {
      if (!user) {
        setTeams([]);
        setCurrentTeam(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all teams the user is a member of
        const { data: membershipData, error: membershipError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;

        if (membershipData && membershipData.length > 0) {
          const teamIds = membershipData.map(item => item.team_id);
          
          // Load team details
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .in('id', teamIds);

          if (teamsError) throw teamsError;

          if (teamsData) {
            setTeams(teamsData);
            
            // Set current team from localStorage or first team
            const savedTeamId = localStorage.getItem('currentTeamId');
            if (savedTeamId) {
              const savedTeam = teamsData.find(t => t.id === savedTeamId);
              if (savedTeam) {
                setCurrentTeam(savedTeam);
              } else if (teamsData.length > 0) {
                setCurrentTeam(teamsData[0]);
                localStorage.setItem('currentTeamId', teamsData[0].id);
              }
            } else if (teamsData.length > 0) {
              setCurrentTeam(teamsData[0]);
              localStorage.setItem('currentTeamId', teamsData[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading teams:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user]);

  const createTeam = async (name: string, description?: string) => {
    if (!user) return { error: new Error("User not authenticated") };

    try {
      // Create a new team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{ name, description }])
        .select();

      if (teamError) throw teamError;
      
      if (teamData && teamData.length > 0) {
        const newTeam = teamData[0];
        
        // Add current user as team admin
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([{ 
            team_id: newTeam.id, 
            user_id: user.id, 
            role: 'admin' 
          }]);

        if (memberError) throw memberError;
        
        // Update local state
        setTeams([...teams, newTeam]);
        setCurrentTeam(newTeam);
        localStorage.setItem('currentTeamId', newTeam.id);
      }
      
      return { error: null };
    } catch (error) {
      console.error("Error creating team:", error);
      return { error };
    }
  };

  const updateTeam = async (id: string, data: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setTeams(teams.map(team => team.id === id ? { ...team, ...data } : team));
      
      if (currentTeam?.id === id) {
        setCurrentTeam({ ...currentTeam, ...data });
      }
      
      return { error: null };
    } catch (error) {
      console.error("Error updating team:", error);
      return { error };
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      const updatedTeams = teams.filter(team => team.id !== id);
      setTeams(updatedTeams);
      
      if (currentTeam?.id === id) {
        if (updatedTeams.length > 0) {
          setCurrentTeam(updatedTeams[0]);
          localStorage.setItem('currentTeamId', updatedTeams[0].id);
        } else {
          setCurrentTeam(null);
          localStorage.removeItem('currentTeamId');
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error("Error deleting team:", error);
      return { error };
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      // Get team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, profiles:user_id(username, email)')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      if (membersData) {
        // Format members data
        const formattedMembers = membersData.map((member: any) => ({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role,
          username: member.profiles?.username,
          email: member.profiles?.email,
        }));
        
        setTeamMembers(formattedMembers);
      }
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const addTeamMember = async (teamId: string, email: string, role: "admin" | "member" = "member") => {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) {
        return { error: new Error("User not found") };
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        return { error: new Error("User is already a member of this team") };
      }

      // Add team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ 
          team_id: teamId, 
          user_id: userData.id, 
          role 
        }]);

      if (memberError) throw memberError;
      
      // Reload team members
      await loadTeamMembers(teamId);
      
      return { error: null };
    } catch (error) {
      console.error("Error adding team member:", error);
      return { error };
    }
  };

  const removeTeamMember = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Update local state
      setTeamMembers(teamMembers.filter(member => 
        !(member.team_id === teamId && member.user_id === userId)
      ));
      
      return { error: null };
    } catch (error) {
      console.error("Error removing team member:", error);
      return { error };
    }
  };

  const updateMemberRole = async (teamId: string, userId: string, role: "admin" | "member") => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Update local state
      setTeamMembers(teamMembers.map(member => 
        (member.team_id === teamId && member.user_id === userId) 
          ? { ...member, role } 
          : member
      ));
      
      return { error: null };
    } catch (error) {
      console.error("Error updating member role:", error);
      return { error };
    }
  };

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        teams,
        teamMembers,
        loading,
        setCurrentTeam: (team) => {
          setCurrentTeam(team);
          if (team) {
            localStorage.setItem('currentTeamId', team.id);
          } else {
            localStorage.removeItem('currentTeamId');
          }
        },
        createTeam,
        updateTeam,
        deleteTeam,
        loadTeamMembers,
        addTeamMember,
        removeTeamMember,
        updateMemberRole,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
