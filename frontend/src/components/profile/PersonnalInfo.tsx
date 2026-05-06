import { ICONS } from "@/constants/icons.ts";

const PersonalInfo = ({ info }) => {
  const { Mail, Phone, Globe } = ICONS;
  
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{info.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{info.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{info.nationality}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">🌐</span>
          <span className="text-sm">{info.language}</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;