// --- START OF FILE Toaster.tsx (Modified) ---
import { useToast } from "@/hooks/use-toast" // Assumindo que useToast retorna a variante em props
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon, // Importando o ToastIcon
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) { // Adicionando 'variant' se vier do hook
        // Se 'variant' não vier diretamente de 'useToast', você pode precisar passá-lo
        // ao chamar a função toast() que adiciona o toast à lista.
        // Ex: toast({ title: "Sucesso!", variant: "success" })
        // Se props já contém variant, então `props.variant` pode ser usado.

        const currentVariant = variant || props.variant; // Garante que temos a variante

        return (
          <Toast key={id} variant={currentVariant} {...props}>
            {/* Adicionando o ícone aqui */}
            {currentVariant && <ToastIcon variant={currentVariant} />}
            <div className="grid flex-1 gap-1 py-1 overflow-hidden"> {/* Adicionado flex-1 e py-1 para melhor espaçamento com ícone */}
              {title && <ToastTitle>{title}</ToastTitle>} {/* Removido text-black */}
              {description && (
                <ToastDescription className="whitespace-pre-wrap break-words max-w-full font-medium"> {/* Removido text-black */}
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose /> {/* O X para fechar já estava aqui e deve funcionar */}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
// --- END OF FILE Toaster.tsx (Modified) ---
