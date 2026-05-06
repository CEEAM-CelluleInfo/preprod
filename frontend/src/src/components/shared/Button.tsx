const Button = ({ 
  children, 
  variant = "primary", 
  onClick,
  disabled = false,
  className = "",
  type = "button" as const,
  icon: Icon
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "orange";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  icon?: React.ComponentType<{ className: string }> | null;
}) => {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center gap-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    orange: "bg-orange text-white hover:bg-orange/90 focus:ring-orange"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;