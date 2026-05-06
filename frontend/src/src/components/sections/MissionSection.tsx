import { Users, Heart, Award } from "lucide-react";

interface MissionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const MissionSection = () => {
  const missions: MissionCard[] = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Intégration",
      description: "Aider les nouveaux étudiants à s'adapter facilement.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Solidarité",
      description: "Créer une communauté forte et unie.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Excellence",
      description: "Valoriser les parcours académiques et professionnels.",
    },
  ];

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Notre Mission</h2>
          <button className="btn-outline text-sm hidden sm:block">
            En savoir plus sur la CEEAM
          </button>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mb-6">
          <button className="btn-outline text-sm w-full">
            En savoir plus sur la CEEAM
          </button>
        </div>

        {/* Mission Cards */}
        <div className="space-y-4 max-w-xl mx-auto">
          {missions.map((mission, index) => (
            <div
              key={index}
              className="card-ceeam p-6 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {mission.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {mission.title}
                  </h3>
                  <p className="text-muted-foreground">{mission.description}</p>
                </div>
              </div>

              {/* Dots decoration */}
              <div className="flex justify-end gap-1 mt-4">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
