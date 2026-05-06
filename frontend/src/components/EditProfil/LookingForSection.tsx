import { useState } from "react";
import { X, Plus } from "lucide-react";

const LookingForSection = ({ items, setItems }) => {
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Je recherche actuellement</h3>
      
      {/* Liste des items */}
      <div className="flex flex-wrap gap-2 mb-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full"
          >
            <span className="text-sm font-medium">{item}</span>
            <button
              onClick={() => handleRemoveItem(item)}
              className="text-green-800 hover:text-green-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Ajout d'un nouvel item */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Ajouter..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddItem}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500">
          Ex: logement, écologique, partenaire de sport, etc.
        </p>
      </div>
    </div>
  );
};

export default LookingForSection;