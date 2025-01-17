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
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-primary p-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground tracking-tight">Extra+</h2>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-sidebar-accent-foreground">{user.rank}</span>
                <span className="text-sm text-sidebar-foreground">{user.warName}</span>
              </div>
              {user.userType === 'admin' && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                    Administrador
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;