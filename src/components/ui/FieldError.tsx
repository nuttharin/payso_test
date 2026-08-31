interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
      {message}
    </p>
  );
}
