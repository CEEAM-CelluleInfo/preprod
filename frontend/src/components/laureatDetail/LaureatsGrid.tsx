import LaureatCard from './LaureatCard';

const LaureatsGrid = ({ laureats, onViewProfile }) => {
  return (
    <section className="bg-gray-100 container pb-16">
      {laureats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun lauréat trouvé</h3>
          <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {laureats.map((laureat) => (
            <LaureatCard 
              key={laureat.id} 
              laureat={laureat}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default LaureatsGrid;