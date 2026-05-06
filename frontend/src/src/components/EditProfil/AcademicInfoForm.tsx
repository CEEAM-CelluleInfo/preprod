import InputField from "@/components/shared/InputField";
import SelectField from "@/components/shared/SelectField";
import { GraduationCap, BookOpen } from "lucide-react";

const AcademicInfoForm = ({ data, onChange }) => {
  const handleFieldChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-6">
        Informations académiques
      </h3>
      <p className="text-gray-600 mb-6">Votre parcours à l'ENSAM</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Promotion"
          value={data.promotion}
          onChange={(value) => handleFieldChange("promotion", value)}
          icon={GraduationCap}
        />
        
        <SelectField
          label="Filière"
          value={data.field}
          onChange={(value) => handleFieldChange("field", value)}
          options={[
            "Génie Industriel et Mécanique",
            "Génie Civil",
            "Génie Électrique",
            "Génie Informatique"
          ]}
        />
      </div>
    </div>
  );
};

export default AcademicInfoForm;