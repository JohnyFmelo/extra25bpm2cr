
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  duration?: number;
  className?: string;
};

// Enhanced toast function with proper styling and variants
export const toast = ({ title, description, variant = "default", duration = 5000, className }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
      className: `bg-destructive text-white ${className || ''}`
    });
  } else if (variant === "warning") {
    return sonnerToast.warning(title, {
      description,
      duration,
      className: `bg-amber-500 text-white ${className || ''}`
    });
  } else if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      duration,
      className: `bg-green-500 text-white ${className || ''}`
    });
  }
  
  return sonnerToast(title, {
    description,
    duration,
    className
  });
};

// Updated to include a mock toasts array to satisfy the toaster.tsx component
export const useToast = () => {
  return {
    toast,
    toasts: [] as any[] // Empty array to satisfy the toaster component
  };
};
