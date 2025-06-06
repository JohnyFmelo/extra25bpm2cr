
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  duration?: number;
  className?: string;
  dangerouslySetInnerHTML?: boolean;
  icon?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
};

// Melhor sistema de toast com layout moderno e cores atualizadas
export const toast = ({ 
  title, 
  description, 
  variant = "default", 
  duration = 5000, 
  className,
  dangerouslySetInnerHTML = false,
  icon,
  position = "top-right"
}: ToastProps) => {
  
  const baseStyle = {
    width: "100%",
    maxWidth: "420px",
    minHeight: "72px",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    fontWeight: "500",
    backdropFilter: "blur(10px)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  const options = {
    description,
    duration,
    className: `toast-${variant} ${className || ""}`,
    dangerouslySetInnerHTML,
    position,
    icon,
  };

  // Variant: Destructive (Erro)
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      ...options,
      style: { 
        ...baseStyle,
        background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        borderColor: "#f87171",
        color: "#7f1d1d",
        boxShadow: "0 25px 50px -12px rgba(248, 113, 113, 0.25), 0 0 0 1px rgba(248, 113, 113, 0.1)",
      }
    });
  }
  
  // Variant: Warning (Aviso)
  if (variant === "warning") {
    return sonnerToast.warning(title, {
      ...options,
      style: { 
        ...baseStyle,
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        borderColor: "#fbbf24",
        color: "#92400e",
        boxShadow: "0 25px 50px -12px rgba(251, 191, 36, 0.25), 0 0 0 1px rgba(251, 191, 36, 0.1)",
      }
    });
  }

  // Variant: Success (Sucesso)
  if (variant === "success") {
    return sonnerToast.success(title, {
      ...options,
      style: { 
        ...baseStyle,
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        borderColor: "#4ade80",
        color: "#14532d",
        boxShadow: "0 25px 50px -12px rgba(74, 222, 128, 0.25), 0 0 0 1px rgba(74, 222, 128, 0.1)",
      }
    });
  }

  // Variant: Info (Informação)
  if (variant === "info") {
    return sonnerToast.info(title, {
      ...options,
      style: { 
        ...baseStyle,
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        borderColor: "#38bdf8",
        color: "#0c4a6e",
        boxShadow: "0 25px 50px -12px rgba(56, 189, 248, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.1)",
      }
    });
  }
  
  // Variant: Default (Padrão)
  return sonnerToast(title, {
    ...options,
    style: { 
      ...baseStyle,
      background: "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)",
      borderColor: "#a1a1aa",
      color: "#18181b",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(161, 161, 170, 0.1)",
    }
  });
};

// Hook personalizado para toasts
export const useToast = () => {
  const showToast = (props: ToastProps) => toast(props);
  
  const showSuccess = (title: string, description?: string) => 
    toast({ title, description, variant: "success" });
  
  const showError = (title: string, description?: string) => 
    toast({ title, description, variant: "destructive" });
  
  const showWarning = (title: string, description?: string) => 
    toast({ title, description, variant: "warning" });
  
  const showInfo = (title: string, description?: string) => 
    toast({ title, description, variant: "info" });

  return {
    toast: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    toasts: [] as any[] // Array vazio para satisfazer o componente toaster
  };
};

// Funções de conveniência para uso direto
export const showSuccessToast = (title: string, description?: string, duration?: number) => {
  toast({ title, description, variant: "success", duration });
};

export const showErrorToast = (title: string, description?: string, duration?: number) => {
  toast({ title, description, variant: "destructive", duration });
};

export const showWarningToast = (title: string, description?: string, duration?: number) => {
  toast({ title, description, variant: "warning", duration });
};

export const showInfoToast = (title: string, description?: string, duration?: number) => {
  toast({ title, description, variant: "info", duration });
};

// Configuração de CSS adicional para melhorar a aparência
export const toastStyles = `
  /* Animações personalizadas */
  @keyframes toast-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes toast-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  /* Estilos para os toasts */
  .toast-default,
  .toast-destructive,
  .toast-warning,
  .toast-success,
  .toast-info {
    animation: toast-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toast-default[data-state="closed"],
  .toast-destructive[data-state="closed"],
  .toast-warning[data-state="closed"],
  .toast-success[data-state="closed"],
  .toast-info[data-state="closed"] {
    animation: toast-slide-out 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Hover effects */
  .toast-default:hover,
  .toast-destructive:hover,
  .toast-warning:hover,
  .toast-success:hover,
  .toast-info:hover {
    transform: translateY(-2px);
    box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.35);
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .toast-default {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
      border-color: #6b7280 !important;
      color: #f9fafb !important;
    }
    
    .toast-destructive {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%) !important;
      color: #fecaca !important;
    }
    
    .toast-warning {
      background: linear-gradient(135deg, #92400e 0%, #b45309 100%) !important;
      color: #fed7aa !important;
    }
    
    .toast-success {
      background: linear-gradient(135deg, #14532d 0%, #166534 100%) !important;
      color: #bbf7d0 !important;
    }
    
    .toast-info {
      background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%) !important;
      color: #bae6fd !important;
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .toast-default,
    .toast-destructive,
    .toast-warning,
    .toast-success,
    .toast-info {
      max-width: calc(100vw - 32px);
      margin: 0 16px;
    }
  }
`;

// Exemplo de uso
export const ToastExamples = {
  success: () => showSuccessToast("Sucesso!", "Operação realizada com sucesso."),
  error: () => showErrorToast("Erro!", "Algo deu errado. Tente novamente."),
  warning: () => showWarningToast("Atenção!", "Verifique os dados antes de continuar."),
  info: () => showInfoToast("Informação", "Nova atualização disponível."),
  default: () => toast({ title: "Notificação", description: "Esta é uma notificação padrão." })
};
