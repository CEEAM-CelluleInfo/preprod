import { ICONS } from "@/constants/icons.ts";

const JobInfo = ({ job }) => {
  const { Briefcase, MapPin, Mail } = ICONS;
  
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        {job.title}
      </h3>
      <p className="text-muted-foreground mb-6">
        {job.company} • {job.location}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Entreprise</h4>
            <p className="font-medium">{job.company}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Localisation</h4>
            <p className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {job.location}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Email Professionnel</h4>
            <p className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {job.email}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Domaine d'expérience</h4>
            <p className="font-medium">{job.domain}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobInfo;