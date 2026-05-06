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
    <div className="bg-white rounded-2xl shadow-md p-5 relative hover:shadow-xl transition-shadow">
      <span className="absolute top-4 right-4 text-xs bg-gray-200 px-3 py-1 rounded-full">
        {laureat.promo}
      </span>
      
      {laureat.photo ? (
        <img 
          src={laureat.photo} 
          alt="Profil"
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
        />
      ) : (
        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
          {getInitials(laureat.name || '')}
        </div>
      )}
      
      <h3 className="text-lg font-bold text-center">{laureat.name}</h3>

      <ul className="text-sm text-gray-600 mt-3 space-y-1">
        <li>{laureat.country}</li>
        <li>{laureat.speciality}</li>
        <li>{laureat.position}</li>
        <li>{laureat.company}</li>
        <li>{laureat.location}</li>
      </ul>
            
          <button 
        onClick={() => onViewProfile ? onViewProfile(laureat) : (window.location.href = `/laureat-details/${laureat.id}`)}
        className="mt-4 w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Voir Profil
      </button>
    </div>
  );
};

export default LaureatCard;