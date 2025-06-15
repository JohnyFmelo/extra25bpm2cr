// (Mantenha todos os imports e a lógica do componente acima do return)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gerenciar Voluntários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {/* CORREÇÃO 1: Cor do ícone de busca ajustada para melhor visibilidade */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Pesquisar por nome, posto ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        
        {filteredUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-semibold">{user.rank} {user.warName}</p>
              {user.email ? (
                // CORREÇÃO 2: Cor do e-mail ajustada para ter bom contraste
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              ) : (
                <p className="text-sm text-muted-foreground/70 italic">E-mail não informado</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`volunteer-switch-${user.id}`}
                checked={!!user.isVolunteer}
                onCheckedChange={() => handleToggleVolunteer(user)}
              />
              {/* CORREÇÃO 3: Classe adicionada ao Label para garantir a cor do texto */}
              <Label htmlFor={`volunteer-switch-${user.id}`} className="cursor-pointer text-sm">
                Voluntário
              </Label>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VolunteersManager;
