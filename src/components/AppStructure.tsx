const AppStructure = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Estrutura do Aplicativo</h2>
      
      <div className="space-y-4">
        <section>
          <h3 className="text-lg font-medium text-primary">1. Autenticação</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Login com email e senha</li>
            <li>Registro de novos usuários</li>
            <li>Recuperação de senha</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-medium text-primary">2. Funcionalidades Principais</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Registro de Horas</li>
            <li>Horas Extras</li>
            <li>Notificações</li>
            <li>Escala de Trabalho</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-medium text-primary">3. Área Administrativa</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Gerenciamento de Usuários</li>
            <li>Editor de Horários</li>
            <li>Sistema de Recados</li>
            <li>Configurações do Sistema</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-medium text-primary">4. Recursos Adicionais</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Calendário Semanal</li>
            <li>Histórico de Registros</li>
            <li>Sistema de Notificações</li>
            <li>Perfil do Usuário</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AppStructure;