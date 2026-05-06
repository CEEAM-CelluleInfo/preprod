interface AcademicInfoProps {
  info: {
    promotion: string;
    field: string;
    linkedin: string;
  };
}

const AcademicInfo = ({ info }: AcademicInfoProps) => {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Informations académiques</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Promotion</span>
          <span className="text-sm font-medium">{info.promotion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Filière</span>
          <span className="text-sm font-medium">{info.field}</span>
        </div>
        {info.linkedin && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">LinkedIn</span>
            
              href={
                info.linkedin.startsWith("http")
                  ? info.linkedin
                  : `https://${info.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Profil
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicInfo;