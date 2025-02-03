import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}

const InformationDialog = ({ open, onOpenChange, isAdmin }: InformationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Estrutura Funcional do Sistema</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isAdmin ? (
            // Admin view
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold mb-2">Módulo de Usuários</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Gerenciamento de usuários</li>
                  <li>Controle de permissões</li>
                  <li>Alteração de senhas</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Módulo de Horas</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Visualização do quadro de horas</li>
                  <li>Edição do quadro de horas</li>
                  <li>Histórico de alterações</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Módulo de Escala Extra</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Gerenciamento de escalas extras</li>
                  <li>Aprovação de solicitações</li>
                  <li>Histórico de escalas</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Módulo de Recados</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Envio de recados</li>
                  <li>Gerenciamento de notificações</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Módulo de Configurações</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Configurações do sistema</li>
                  <li>Backup de dados</li>
                  <li>Logs do sistema</li>
                </ul>
              </section>
            </div>
          ) : (
            // Regular user view
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold mb-2">Funcionalidades Disponíveis</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Visualização do quadro de horas</li>
                  <li>Solicitação de escala extra</li>
                  <li>Visualização de recados</li>
                  <li>Atualização de dados cadastrais</li>
                  <li>Alteração de senha</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Notificações</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Recebimento de avisos</li>
                  <li>Alertas de escala</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InformationDialog;