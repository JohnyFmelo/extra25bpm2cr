
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "warning";
  duration?: number;
  className?: string;
};

// Updated toast function to use black text with blue/red backgrounds
export const toast = ({ title, description, variant = "default", duration = 5000, className }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
      className,
      style: { 
        color: "black",
        backgroundColor: "#ffd7d7", // Light red background
        borderColor: "#ef4444", // red-500
      }
    });
  }
  
  if (variant === "warning") {
    return sonnerToast.warning(title, {
      description,
      duration,
      className,
      style: { 
        color: "black",
        backgroundColor: "#fff3c4", // Yellow background
        borderColor: "#eab308", // yellow-500
      }
    });
  }
  
  return sonnerToast(title, {
    description,
    duration,
    className,
    style: { 
      color: "black", 
      backgroundColor: "#d8ebff", // Light blue background
      borderColor: "#2563eb", // blue-600
    }
  });
};

// Mock toasts array to satisfy the toaster component
export const useToast = () => {
  return {
    toast,
    toasts: [] as any[]
  };
};
