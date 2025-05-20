
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "warning";
  duration?: number;
  className?: string;
};

// Updated toast function with better visual styling
export const toast = ({ title, description, variant = "default", duration = 5000, className }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
      className,
      style: { 
        width: "100%", 
        maxWidth: "500px",
        color: "#000",
        backgroundColor: "#ffd7d7", // Light red background
        borderColor: "#ef4444", // red-500
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        fontWeight: "500",
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
        color: "#000",
        backgroundColor: "#fff0c2", // Light yellow background
        borderColor: "#f59e0b", // amber-500
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        fontWeight: "500",
      }
    });
  }
  
  return sonnerToast.success(title, {
    description,
    duration,
    className,
    style: { 
      width: "100%", 
      maxWidth: "500px",
      color: "#000", 
      backgroundColor: "#d1f5ea", // Light teal background
      borderColor: "#10b981", // emerald-500
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      fontWeight: "500",
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
