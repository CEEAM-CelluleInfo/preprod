import Button from "@/components/shared/Button";
import { Eye, Save } from "lucide-react";

const FormActions = ({ onCancel, onPreview, onSave, isSaving = false }) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          icon={null}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        
        <Button
          variant="secondary"
          onClick={onPreview}
          icon={Eye}
          className="w-full sm:w-auto"
        >
          Voir le profil
        </Button>
        
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          icon={Save}
          className="w-full sm:w-auto"
        >
          {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
};

export default FormActions;