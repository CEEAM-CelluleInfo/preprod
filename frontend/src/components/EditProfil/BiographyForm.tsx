import { useState } from "react";

const BiographyForm = ({ value, onChange }) => {
  const maxChars = 500;
  const charCount = value.length;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Biographie</h3>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700 italic">{value || "Aucune biographie définie"}</p>
      </div>
      
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Décrivez-vous en quelques lignes (max 500 caractères)
        </label>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxChars}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Parlez de vous, de vos passions, de vos objectifs..."
        />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Appuyez sur Entrée pour aller à la ligne
          </span>
          <span className={`text-sm ${charCount >= maxChars ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BiographyForm;