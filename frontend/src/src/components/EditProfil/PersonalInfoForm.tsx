import InputField from "@/components/shared/InputField";
import SelectField from "@/components/shared/SelectField";
import { User, Mail, Phone, Globe } from "lucide-react";

const PersonalInfoForm = ({ data, onChange }) => {
  const handleFieldChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-6">
        Informations personnelles
      </h3>
      <p className="text-gray-600 mb-6">Vos informations de base</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Prénom"
          value={data.firstName}
          onChange={(value) => handleFieldChange("firstName", value)}
          icon={User}
        />
        
        <InputField
          label="Nom"
          value={data.lastName}
          onChange={(value) => handleFieldChange("lastName", value)}
          icon={User}
        />
        
        <InputField
          label="Email"
          value={data.email}
          onChange={(value) => handleFieldChange("email", value)}
          type="email"
          icon={Mail}
        />
        
        <InputField
          label="Téléphone"
          value={data.phone}
          onChange={(value) => handleFieldChange("phone", value)}
          type="tel"
          icon={Phone}
        />
        
        <SelectField
          label="Nationalité"
          value={data.nationality}
          onChange={(value) => handleFieldChange("nationality", value)}
          options={[
            "🇫🇷 Maroc",
            "🇫🇷 France",
            "🇩🇪 Allemagne",
            "🇪🇸 Espagne",
            "🇮🇹 Italie"
          ]}
        />
        
        <SelectField
          label="Langue préférée"
          value={data.language}
          onChange={(value) => handleFieldChange("language", value)}
          options={[
            "🇫🇷 Français",
            "🇬🇧 Anglais",
            "🇪🇸 Espagnol",
            "🇩🇪 Allemand"
          ]}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;