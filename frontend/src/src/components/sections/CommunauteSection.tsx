import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Country {
  name: string;
  flag: string;
  members: number;
  laureats: number;
}

const CommunauteSection = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const countries: Country[] = [
    { name: "BENIN", flag: "🇧🇯", members: 10, laureats: 10 },
    { name: "BENIN", flag: "🇧🇯", members: 10, laureats: 10 },
    { name: "TOGO", flag: "🇹🇬", members: 8, laureats: 5 },
    { name: "SENEGAL", flag: "🇸🇳", members: 12, laureats: 8 },
    { name: "COTE D'IVOIRE", flag: "🇨🇮", members: 6, laureats: 4 },
    { name: "MAROC", flag: "🇲🇦", members: 9, laureats: 6 },
  ];

  const itemsPerPage = 4;
  const totalPages = Math.ceil(countries.length / itemsPerPage);

  const currentCountries = countries.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <section className="bg-muted py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
            Notre Communauté Internationale
          </h2>
          <p className="text-black">
            60 étudiants de <span className="font-semibold">18 pays</span>
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {currentCountries.map((country, index) => (
            <div
              key={index}
              className="bg-navy-light rounded-xl p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-secondary-foreground text-lg">
                  {country.name}
                </h3>
                <span className="text-3xl">{country.flag}</span>
              </div>

              <div className="flex gap-4 text-sm text-secondary-foreground/80">
                <div>
                  <span className="font-medium">Membres:</span>
                  <span className="ml-1">{country.members}</span>
                </div>
                <div>
                  <span className="font-medium">Lauréats:</span>
                  <span className="ml-1">{country.laureats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-1 text-secondary-foreground/50 disabled:opacity-30 hover:text-secondary-foreground transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentPage
                  ? "bg-secondary-foreground"
                  : "bg-secondary-foreground/30"
              }`}
            />
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1 text-secondary-foreground/50 disabled:opacity-30 hover:text-secondary-foreground transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunauteSection;
