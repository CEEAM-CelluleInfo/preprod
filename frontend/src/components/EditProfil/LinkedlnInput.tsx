import InputField from "@/components/shared/InputField";
import { Linkedin } from "lucide-react";

const LinkedInInput = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">LinkedIn</h3>
      
      <div className="space-y-3">
        <InputField
          label="Profil LinkedIn"
          value={value}
          onChange={onChange}
          placeholder="linkedin.com/in/username"
          icon={Linkedin}
        />
        
        <p className="text-sm text-gray-500">
          Votre profil LinkedIn professionnel
        </p>
      </div>
    </div>
  );
};

export default LinkedInInput;