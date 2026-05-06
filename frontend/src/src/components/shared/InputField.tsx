import { LucideIcon } from "lucide-react";

const InputField = ({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  icon: Icon,
  className = ""
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            Icon ? 'pl-10' : ''
          } ${className}`}
        />
      </div>
    </div>
  );
};

export default InputField;