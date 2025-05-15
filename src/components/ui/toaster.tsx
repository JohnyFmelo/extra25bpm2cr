// components/ui/toast.tsx
import * as Toast from "@radix-ui/react-toast";

export const ToastProvider = Toast.Provider;
export const ToastViewport = Toast.Viewport;
export const Toast = ({ variant = "default", title, description }) => {
  const variantStyles = {
    default: "bg-white text-gray-900 border-gray-200",
    destructive: "bg-red-500 text-white border-red-600",
  };

  return (
    <Toast.Root
      className={`p-4 rounded-md shadow-lg border max-w-md ${variantStyles[variant]}`}
    >
      {title && <Toast.Title className="font-semibold">{title}</Toast.Title>}
      {description && <Toast.Description className="mt-1">{description}</Toast.Description>}
      <Toast.Close className="absolute top-2 right-2" aria-label="Fechar">
        <X className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  );
};

// No App.tsx ou main.tsx
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

function App() {
  return (
    <ToastProvider>
      <YourApp />
      <ToastViewport className="fixed top-4 right-4 space-y-2" />
    </ToastProvider>
  );
}
