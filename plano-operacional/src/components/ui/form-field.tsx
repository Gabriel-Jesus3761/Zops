import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { Input } from './input'

// Context for form field state
interface FormFieldContextValue {
  id: string
  error?: string
  disabled?: boolean
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function useFormField() {
  const context = React.useContext(FormFieldContext)
  if (!context) {
    throw new Error('useFormField must be used within a FormField')
  }
  return context
}

// Main FormField container
interface FormFieldProps {
  children: React.ReactNode
  className?: string
  error?: string
  disabled?: boolean
}

function FormField({ children, className, error, disabled }: FormFieldProps) {
  const id = React.useId()

  return (
    <FormFieldContext.Provider value={{ id, error, disabled }}>
      <div
        className={cn('space-y-2', className)}
        data-disabled={disabled}
        data-invalid={!!error}
      >
        {children}
      </div>
    </FormFieldContext.Provider>
  )
}

// FormField Label
interface FormLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean
}

function FormLabel({ className, required, children, ...props }: FormLabelProps) {
  const { id, disabled } = useFormField()

  return (
    <Label
      htmlFor={id}
      className={cn(disabled && 'opacity-50', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
  )
}

// FormField Input
interface FormInputProps extends React.ComponentProps<typeof Input> {}

function FormInput({ className, ...props }: FormInputProps) {
  const { id, error, disabled } = useFormField()

  return (
    <Input
      id={id}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(error && 'border-destructive focus-visible:ring-destructive/20', className)}
      {...props}
    />
  )
}

// FormField Textarea
interface FormTextareaProps extends React.ComponentProps<'textarea'> {}

function FormTextarea({ className, ...props }: FormTextareaProps) {
  const { id, error, disabled } = useFormField()

  return (
    <textarea
      id={id}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive/20',
        className
      )}
      {...props}
    />
  )
}

// FormField Description
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormDescription({ className, ...props }: FormDescriptionProps) {
  const { id } = useFormField()

  return (
    <p
      id={`${id}-description`}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

// FormField Error Message
interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormError({ className, children, ...props }: FormErrorProps) {
  const { id, error } = useFormField()

  if (!error && !children) return null

  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {children || error}
    </p>
  )
}

// Compound component exports
FormField.Label = FormLabel
FormField.Input = FormInput
FormField.Textarea = FormTextarea
FormField.Description = FormDescription
FormField.Error = FormError

export {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormDescription,
  FormError,
  useFormField,
}
