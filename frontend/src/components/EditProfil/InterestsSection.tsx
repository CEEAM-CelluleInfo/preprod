import { useState } from "react";
import { X, Plus } from "lucide-react";

const InterestsSection = ({ interests, setInterests }) => {
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Centres d'intérêt</h3>
      <p className="text-gray-600 mb-6">
        Vous possédez des centres d'intérêt :
      </p>
      
      {/* Liste des intérêts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {interests.map((interest, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full"
          >
            <span className="text-sm font-medium">{interest}</span>
            <button
              onClick={() => handleRemoveInterest(interest)}
              className="text-blue-800 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Ajout d'un nouvel intérêt */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ajouter un intérêt..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddInterest}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          Appuyez sur Entrée pour ajouter un intérêt
        </p>
      </div>
    </div>
  );
};

export default InterestsSection;