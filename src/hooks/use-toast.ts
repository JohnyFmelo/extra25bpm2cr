
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
        width: "100%", 
        maxWidth: "500px",
        color: "black",
        backgroundColor: "#ffd7d7", // Light red background
        borderColor: "#ef4444", // red-500
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }
    });
  }
  
  if (variant === "warning") {
    return sonnerToast.warning(title, {
      description,
      duration,
      className,
      style: { 
        width: "100%", 
        maxWidth: "500px",
        color: "black",
        backgroundColor: "#ff0000", // Red background for warnings
        borderColor: "#dc2626", // darker red
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }
    });
  }
  
  return sonnerToast(title, {
    description,
    duration,
    className,
    style: { 
      width: "100%", 
      maxWidth: "500px",
      color: "black", 
      backgroundColor: "#1B98E0", // Blue background for default
      borderColor: "#006494", // darker blue
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    }
  });
};

// Updated to include a mock toasts array to satisfy the toaster.tsx component
export const useToast = () => {
  return {
    toast,
    toasts: [] as any[] // Empty array to satisfy the toaster component
  };
};
