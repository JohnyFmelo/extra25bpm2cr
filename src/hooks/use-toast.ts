
import { useToast as useShadcnToast } from "@/components/ui/use-toast";
import { toast as shadcnToast } from "@/components/ui/use-toast";

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

export function useToast() {
  const shadcnToastHook = useShadcnToast();
  
  // Wrapper para garantir que variantes inválidas não sejam usadas
  const toast = (props: ToastProps) => {
    shadcnToastHook.toast({
      ...props,
      // Certifique-se de que apenas variantes válidas são usadas
      variant: props.variant === "destructive" ? "destructive" : "default"
    });
  };
  
  return {
    ...shadcnToastHook,
    toast
  };
}

// Função toast global
export const toast = (props: ToastProps) => {
  shadcnToast({
    ...props,
    // Certifique-se de que apenas variantes válidas são usadas
    variant: props.variant === "destructive" ? "destructive" : "default"
  });
};
