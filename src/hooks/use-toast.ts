
import { Toast, useToast as useToastOriginal } from "@/components/ui/toast";

// Re-export the useToast hook without modification
export const useToast = useToastOriginal;

// Define toast variants explicitly
export const toast = useToastOriginal().toast;

// Export the original types
export type { Toast };
