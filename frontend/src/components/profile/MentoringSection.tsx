import { Users } from "lucide-react";

const MentoringSection = ({ isAvailable, onToggle }) => {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Mentorat
      </h3>
      <p className="text-muted-foreground mb-6">
        Je suis disponible pour aider les étudiants actuels
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isAvailable ? 'Disponible pour mentorat' : 'Non disponible'}
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {isAvailable ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  );
};

export default MentoringSection;