
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
    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
        Configurações
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onProfileClick}
          className="p-6 text-left bg-white rounded-xl hover:shadow-lg transition-all duration-300 group"
        >
          <h3 className="font-semibold text-lg text-primary mb-2 group-hover:text-primary-light transition-colors">
            Alterar Cadastro
          </h3>
          <p className="text-gray-600">
            Atualize suas informações pessoais
          </p>
        </button>
        <button
          onClick={onPasswordClick}
          className="p-6 text-left bg-white rounded-xl hover:shadow-lg transition-all duration-300 group"
        >
          <h3 className="font-semibold text-lg text-primary mb-2 group-hover:text-primary-light transition-colors">
            Alterar Senha
          </h3>
          <p className="text-gray-600">
            Modifique sua senha de acesso
          </p>
        </button>
        <button
          onClick={onInformationClick}
          className="p-6 text-left bg-white rounded-xl hover:shadow-lg transition-all duration-300 group"
        >
          <h3 className="font-semibold text-lg text-primary mb-2 group-hover:text-primary-light transition-colors">
            Informações
          </h3>
          <p className="text-gray-600">
            Visualize a estrutura funcional do sistema
          </p>
        </button>
      </div>
    </div>
  );
};

export default SettingsContent;
