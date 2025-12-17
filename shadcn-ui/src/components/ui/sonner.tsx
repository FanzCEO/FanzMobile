import type { ComponentProps } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

// Helper to ensure message is always a string
const ensureString = (message: unknown): string => {
  if (typeof message === 'string') return message;
  if (message === null || message === undefined) return '';
  if (message instanceof Error) return message.message;
  if (typeof message === 'object') {
    // Handle FastAPI/Pydantic validation errors
    const obj = message as Record<string, unknown>;
    if ('msg' in obj && typeof obj.msg === 'string') return obj.msg;
    if ('message' in obj && typeof obj.message === 'string') return obj.message;
    if ('detail' in obj && typeof obj.detail === 'string') return obj.detail;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
  return String(message);
};

// Wrapped toast functions that ensure messages are always strings
const toast = Object.assign(
  (message: unknown) => sonnerToast(ensureString(message)),
  {
    success: (message: unknown) => sonnerToast.success(ensureString(message)),
    error: (message: unknown) => sonnerToast.error(ensureString(message)),
    info: (message: unknown) => sonnerToast.info(ensureString(message)),
    warning: (message: unknown) => sonnerToast.warning(ensureString(message)),
    loading: (message: unknown) => sonnerToast.loading(ensureString(message)),
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    custom: sonnerToast.custom,
  }
);

export { Toaster, toast };
