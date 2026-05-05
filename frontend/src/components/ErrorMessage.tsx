interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="error">
      <div className="error-title">Error</div>
      <div>{message}</div>
    </div>
  );
}

export default ErrorMessage;
