// --- START OF FILE toast.tsx (Modified) ---

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react" // Adicionando mais ícones

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", // Diminuí um pouco o max-w
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  // Base styles for all toasts
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground", // Usando cores semânticas do Tailwind (assumindo que estão configuradas)
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground", // Shadcn/ui padrão
        success:
          "success group border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
        warning:
          "warning group border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
        info: // Adicionando uma variante 'info' que pode ser o novo 'default'
          "info group border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Componente para ícones, para ser usado no toaster.tsx
// Esta é uma sugestão, você pode integrar ícones de outra forma
export const ToastIcon = ({ variant }: { variant?: VariantProps<typeof toastVariants>["variant"] }) => {
  const iconSize = "h-5 w-5"
  switch (variant) {
    case "success":
      return <CheckCircle className={cn(iconSize, "text-green-500")} />;
    case "warning":
      return <AlertTriangle className={cn(iconSize, "text-yellow-500")} />;
    case "destructive":
      return <XCircle className={cn(iconSize, "text-red-500")} />; // text-destructive-foreground pode ser branco
    case "info":
      return <Info className={cn(iconSize, "text-blue-500")} />;
    default:
      return null; // Ou um ícone padrão
  }
};


const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-destructive/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      "group-[.success]:border-green-500/40 group-[.success]:hover:text-green-700 group-[.success]:hover:bg-green-100 dark:group-[.success]:hover:bg-green-800 dark:group-[.success]:hover:text-green-200",
      "group-[.warning]:border-yellow-500/40 group-[.warning]:hover:text-yellow-700 group-[.warning]:hover:bg-yellow-100 dark:group-[.warning]:hover:bg-yellow-800 dark:group-[.warning]:hover:text-yellow-200",
      "group-[.info]:border-blue-500/40 group-[.info]:hover:text-blue-700 group-[.info]:hover:bg-blue-100 dark:group-[.info]:hover:bg-blue-800 dark:group-[.info]:hover:text-blue-200",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 transform rounded-md p-1 text-foreground/70 opacity-100 ring-offset-background transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 data-[state=open]:opacity-70 data-[state=open]:hover:opacity-100", // Sempre visível, mais opaco no hover/focus
      // Estilos específicos para variantes no botão de fechar
      "group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      "group-[.success]:text-green-600 group-[.success]:hover:text-green-800 dark:group-[.success]:text-green-300 dark:group-[.success]:hover:text-green-100",
      "group-[.warning]:text-yellow-600 group-[.warning]:hover:text-yellow-800 dark:group-[.warning]:text-yellow-300 dark:group-[.warning]:hover:text-yellow-100",
      "group-[.info]:text-blue-600 group-[.info]:hover:text-blue-800 dark:group-[.info]:text-blue-300 dark:group-[.info]:hover:text-blue-100",
      className
    )}
    toast-close="" // Atributo para o Radix identificar
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)} // Removido text-black, cor herdada da variante
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)} // Removido text-black, cor herdada, opacidade leve
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  // ToastIcon // Exporte se quiser usar no toaster.tsx
}

// --- END OF FILE toast.tsx (Modified) ---
