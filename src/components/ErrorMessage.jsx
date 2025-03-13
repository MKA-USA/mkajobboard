const ErrorMessage = ({ message, className = "" }) => {
  return (
    <div className={`bg-destructive/10 text-destructive p-4 rounded-md ${className}`}>
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
