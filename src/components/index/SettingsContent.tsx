
interface SettingsContentProps {
  onProfileClick: () => void;
  onPasswordClick: () => void;
  onInformationClick: () => void;
}

const SettingsContent = ({
  onProfileClick,
  onPasswordClick,
  onInformationClick,
}: SettingsContentProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-semibold mb-6">Configurações</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onProfileClick}
          className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-medium">Alterar Cadastro</h3>
          <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
        </button>
        <button
          onClick={onPasswordClick}
          className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-medium">Alterar Senha</h3>
          <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
        </button>
        <button
          onClick={onInformationClick}
          className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-medium">Informações</h3>
          <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
        </button>
      </div>
    </div>
  );
};

export default SettingsContent;
