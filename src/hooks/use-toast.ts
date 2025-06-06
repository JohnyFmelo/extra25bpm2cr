
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "warning";
  duration?: number;
  className?: string;
  dangerouslySetInnerHTML?: boolean;
};

// Updated toast function for improved styling and HTML support
export const toast = ({ 
  title, 
  description, 
  variant = "default", 
  duration = 5000, 
  className,
  dangerouslySetInnerHTML = false 
}: ToastProps) => {
  const options = {
    description,
    duration,
    className,
    dangerouslySetInnerHTML,
    style: { 
      width: "100%", 
      maxWidth: "500px",
      color: "black",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      fontWeight: "500"
    }
  };

  if (variant === "destructive") {
    return sonnerToast.error(title, {
      ...options,
      style: { 
        ...options.style,
        backgroundColor: "#ffd7d7", // Light red background
        borderColor: "#ef4444", // red-500
      }
    });
  }
  
  if (variant === "warning") {
    return sonnerToast.warning(title, {
      ...options,
      style: { 
        ...options.style,
        backgroundColor: "#ffedd5", // Light orange background
        borderColor: "#f97316", // orange-500
      }
    });
  }
  
  return sonnerToast(title, {
    ...options,
    style: { 
      ...options.style,
      backgroundColor: "#e0f2fe", // Light blue background
      borderColor: "#0ea5e9", // sky-500
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
