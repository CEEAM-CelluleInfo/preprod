import { Briefcase, Globe2, GraduationCap, MapPin, ArrowRight } from "lucide-react";

const LaureatCard = ({ laureat, onViewProfile }) => {
  // Générer les initiales si pas de photo
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#172d45] via-[#2a6ca8] to-[#f59f24]" />

      <span className="absolute right-5 top-5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        {laureat.promo}
      </span>
      
      {laureat.photo ? (
        <img 
          src={laureat.photo} 
          alt="Profil"
          className="mx-auto mb-4 h-24 w-24 rounded-full object-cover ring-4 ring-slate-100"
        />
      ) : (
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#172d45] via-[#2a6ca8] to-[#f59f24] text-xl font-bold text-white ring-4 ring-slate-100">
          {getInitials(laureat.name || '')}
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-950">{laureat.name}</h3>
        {laureat.position && (
          <p className="mt-1 text-sm font-medium text-[#2a6ca8]">{laureat.position}</p>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-sm text-slate-600">
        {laureat.country && (
          <li className="flex items-start gap-2">
            <Globe2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2a6ca8]" />
            <span className="break-words">{laureat.country}</span>
          </li>
        )}
        {laureat.speciality && (
          <li className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2a6ca8]" />
            <span className="break-words">{laureat.speciality}</span>
          </li>
        )}
        {laureat.company && (
          <li className="flex items-start gap-2">
            <Briefcase className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2a6ca8]" />
            <span className="break-words">{laureat.company}</span>
          </li>
        )}
        {laureat.location && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2a6ca8]" />
            <span className="break-words">{laureat.location}</span>
          </li>
        )}
      </ul>

      <button 
        onClick={() => onViewProfile ? onViewProfile(laureat) : (window.location.href = `/laureat-details/${laureat.id}`)}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#172d45] py-3 font-semibold text-white transition hover:bg-[#203c5a]"
      >
        Voir Profil
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};

export default LaureatCard;