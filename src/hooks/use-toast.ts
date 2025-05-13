
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  className?: string; // Added className property
};

// This update adds the "warning" variant mapping to "default"
export const toast = ({ title, description, variant = "default", duration, className }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
      className
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
