import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

// --- CORREÇÃO APLICADA AQUI ---
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Esta combinação garante o alinhamento no TOPO e CENTRO
      "fixed top-4 left-1/2 z-[100] flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-4 p-4",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default:
          "border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
        destructive:
          "destructive group border-red-700 bg-red-600 text-white dark:border-red-800 dark:bg-red-700",
        success:
          "success group border-green-700 bg-green-600 text-white dark:border-green-800 dark:bg-green-700",
        warning:
          "warning group border-yellow-600 bg-yellow-500 text-black dark:border-yellow-700 dark:bg-yellow-600 dark:text-yellow-950",
        info:
          "info group border-blue-700 bg-blue-600 text-white dark:border-blue-800 dark:bg-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ToastIcon = ({ variant }: { variant?: VariantProps<typeof toastVariants>["variant"] }) => {
  const iconSize = "h-5 w-5"
  switch (variant) {
    case "success":
      return <CheckCircle className={cn(iconSize, "text-green-100")} />;
    case "warning":
      return <AlertTriangle className={cn(iconSize, "text-yellow-900 dark:text-yellow-100")} />;
    case "destructive":
      return <XCircle className={cn(iconSize, "text-red-100")} />;
    case "info":
      return <Info className={cn(iconSize, "text-blue-100")} />;
    default:
      return <Info className={cn(iconSize, "text-neutral-500 dark:text-neutral-400")} />;
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
      "group-[.default]:text-neutral-700 group-[.default]:hover:bg-neutral-200 dark:group-[.default]:text-neutral-300 dark:group-[.default]:hover:bg-neutral-700",
      "group-[.destructive]:text-red-100 group-[.destructive]:hover:border-transparent group-[.destructive]:hover:bg-red-700 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-500",
      "group-[.success]:text-green-100 group-[.success]:hover:border-transparent group-[.success]:hover:bg-green-700 group-[.success]:hover:text-green-50 group-[.success]:focus:ring-green-500",
      "group-[.warning]:text-yellow-900 group-[.warning]:hover:border-transparent group-[.warning]:hover:bg-yellow-600 group-[.warning]:hover:text-yellow-950 group-[.warning]:focus:ring-yellow-600 dark:group-[.warning]:text-yellow-100 dark:group-[.warning]:hover:bg-yellow-700 dark:group-[.warning]:hover:text-yellow-50",
      "group-[.info]:text-blue-100 group-[.info]:hover:border-transparent group-[.info]:hover:bg-blue-700 group-[.info]:hover:text-blue-50 group-[.info]:focus:ring-blue-500",
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
      "absolute right-2 top-1/2 -translate-y-1/2 transform rounded-md p-1 opacity-100 ring-offset-background transition-opacity hover:opacity-80 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 data-[state=open]:opacity-70 data-[state=open]:hover:opacity-100",
      "group-[.default]:text-neutral-500 hover:text-neutral-700 dark:group-[.default]:text-neutral-400 dark:hover:text-neutral-200",
      "group-[.destructive]:text-red-200 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-700",
      "group-[.success]:text-green-200 group-[.success]:hover:text-green-50 group-[.success]:focus:ring-green-400 group-[.success]:focus:ring-offset-green-700",
      "group-[.warning]:text-yellow-800 group-[.warning]:hover:text-black group-[.warning]:focus:ring-yellow-500 group-[.warning]:focus:ring-offset-yellow-600 dark:group-[.warning]:text-yellow-200 dark:group-[.warning]:hover:text-yellow-50",
      "group-[.info]:text-blue-200 group-[.info]:hover:text-blue-50 group-[.info]:focus:ring-blue-400 group-[.info]:focus:ring-offset-blue-700",
      className
    )}
    toast-close=""
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
    className={cn("text-sm font-semibold", className)}
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
    className={cn("text-sm opacity-90", className)}
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
  ToastIcon,
}
