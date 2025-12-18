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

/**
 * Convert any error to a user-friendly toast string.
 * Handles FastAPI/Pydantic validation errors which have shape:
 * { type, loc, msg, input } or arrays of those under "detail"
 */
const toToastText = (err: unknown): string => {
  if (!err) return 'Something went wrong';

  // If it's already a string, return it
  if (typeof err === 'string') return err;

  // If it's a normal Error instance
  if (err instanceof Error) return err.message || 'Something went wrong';

  // Handle objects
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;

    // Check for "detail" property (common in FastAPI responses)
    const detail = obj.detail ?? obj;

    // If detail is a string, return it
    if (typeof detail === 'string') return detail;

    // If it's an array of validation errors (FastAPI/Pydantic style)
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((e) => {
          if (typeof e === 'string') return e;
          if (typeof e === 'object' && e !== null) {
            // Include field location for better context if available
            const loc = Array.isArray(e.loc) ? e.loc.filter((l: unknown) => l !== 'body').join('.') : '';
            const msg = e.msg || e.message || '';
            // Return location with message, or just location, or just message
            if (loc && msg) return `${loc}: ${msg}`;
            if (loc) return `${loc}: Invalid`;
            if (msg) return msg;
            return null;
          }
          return null;
        })
        .filter(Boolean);
      // De-duplicate identical messages
      const uniqueMsgs = [...new Set(msgs)];
      return uniqueMsgs.length ? uniqueMsgs.join('. ') : 'Validation failed';
    }

    // If it's a single validation error object with msg/message
    if (typeof detail === 'object' && detail !== null) {
      const detailObj = detail as Record<string, unknown>;
      if (detailObj.msg) return String(detailObj.msg);
      if (detailObj.message) return String(detailObj.message);
    }

    // Check top-level msg/message/detail
    if (obj.msg) return String(obj.msg);
    if (obj.message) return String(obj.message);

    // Last resort: stringify but keep it short
    try {
      const json = JSON.stringify(err);
      return json.length > 200 ? json.slice(0, 200) + '...' : json;
    } catch {
      return 'Something went wrong';
    }
  }

  return String(err);
};

// Wrapped toast functions that ensure messages are always strings
const toast = Object.assign(
  (message: unknown) => sonnerToast(toToastText(message)),
  {
    success: (message: unknown) => sonnerToast.success(toToastText(message)),
    error: (message: unknown) => sonnerToast.error(toToastText(message)),
    info: (message: unknown) => sonnerToast.info(toToastText(message)),
    warning: (message: unknown) => sonnerToast.warning(toToastText(message)),
    loading: (message: unknown) => sonnerToast.loading(toToastText(message)),
    message: (message: unknown) => sonnerToast(toToastText(message)),
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    custom: sonnerToast.custom,
  }
);


export { Toaster, toast, toToastText };
