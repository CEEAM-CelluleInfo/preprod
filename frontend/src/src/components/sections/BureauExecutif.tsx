import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Member {
  name: string;
  filiere: string;
  country: string;
  image: string;
}

const BureauExecutif = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const members: Member[] = [
    { name: "Nom&Prenom(s)", filiere: "Filière:", country: "🇹🇬", image: "" },
    { name: "Nom&Prenom(s)", filiere: "Filière:", country: "🇹🇬", image: "" },
    { name: "Nom&Prenom(s)", filiere: "Filière:", country: "🇧🇯", image: "" },
    { name: "Nom&Prenom(s)", filiere: "Filière:", country: "🇸🇳", image: "" },
  ];

  const itemsPerPage = 2;
  const totalPages = Math.ceil(members.length / itemsPerPage);

  const currentMembers = members.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <h2 className="section-title mb-8">Bureau Exécutif</h2>

        {/* Members Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {currentMembers.map((member, index) => (
            <div key={index} className="card-ceeam overflow-hidden">
              {/* Profile Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-muted-foreground/40"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
                {/* Country Flag */}
                <span className="absolute bottom-2 right-2 text-2xl">
                  {member.country}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 bg-secondary text-secondary-foreground">
                <h3 className="font-semibold text-sm md:text-base">{member.name}</h3>
                <p className="text-secondary-foreground/70 text-sm">{member.filiere}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-1 text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentPage ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1 text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BureauExecutif;
