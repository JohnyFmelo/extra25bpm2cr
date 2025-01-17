import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/10 p-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Extra+</h2>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <div className="p-4 space-y-2">
            <p className="text-sm font-medium text-sidebar-foreground">{user.warName}</p>
            <p className="text-xs text-sidebar-foreground/70">{user.rank}</p>
            {user.userType === 'admin' && (
              <p className="text-xs text-sidebar-foreground/70">Administrador</p>
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;