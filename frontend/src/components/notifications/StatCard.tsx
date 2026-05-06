import React from 'react';

interface StatCardProps {
  value: number;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

/**
 * Composant carte de statistique
 * Affiche un nombre avec un label en dessous
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  variant = 'default',
}) => {
  // Styles selon la variante
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-[#172d45] to-[#1e3a5f] text-white';
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
      case 'warning':
        return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
      default:
        return 'bg-white text-[#172d45] border border-gray-200';
    }
  };

  return (
    <div
      className={`rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${getStyles()}`}
    >
      <div className="text-center">
        <div className="text-4xl font-bold mb-2">{value}</div>
        <div className={`text-sm font-medium ${variant === 'default' ? 'text-gray-600' : 'text-white/80'}`}>
          {label}
        </div>
      </div>
    </div>
  );
};