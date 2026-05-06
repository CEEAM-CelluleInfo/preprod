import { ArrowRight, Award, Heart, ShieldCheck, Users } from "lucide-react";
import { HomeContent } from "@/types/home";

interface MissionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface MissionSectionProps {
  content?: HomeContent;
}

const MissionSection = ({ content }: MissionSectionProps) => {
  const fallbackMissions: MissionCard[] = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Intégration",
      description: "Créer des repères concrets pour que chaque nouvel étudiant trouve rapidement sa place.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Solidarité",
      description: "Faire vivre une entraide réelle entre promotions, nationalités et parcours différents.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Excellence",
      description: "Mettre en lumière les parcours inspirants et encourager l'ambition collective.",
    },
  ];

  const missions: MissionCard[] = content?.valeurs_list?.length
    ? content.valeurs_list.slice(0, 3).map((value, index) => ({
        icon: [<Users className="w-6 h-6" />, <Heart className="w-6 h-6" />, <Award className="w-6 h-6" />][index] || <ShieldCheck className="w-6 h-6" />,
        title: value.title,
        description: value.desc,
      }))
    : fallbackMissions;

  const missionIntro = content?.mission_paragraphs?.[0]
    || "La CEEAM ne se limite pas à organiser des moments conviviaux. Elle structure une expérience étudiante plus lisible, plus solidaire et plus ambitieuse.";

  const missionPromise = content?.mission_paragraphs?.[1]
    || "Offrir à chaque étudiant étranger un cadre d'intégration rassurant, une communauté visible et des opportunités utiles pendant tout son parcours.";

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] lg:items-start">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1e40af]">
                <ShieldCheck className="h-4 w-4" />
                Ce qui nous guide
              </div>
              <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl">Une mission simple: accueillir, relier et faire grandir.</h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                {missionIntro}
              </p>
              <a
                href="/a-propos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e40af] transition-colors hover:text-[#10263d]"
              >
                En savoir plus sur la CEEAM
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {missions.map((mission, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3df] text-[#b45309]">
                    {mission.icon}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-lg font-bold text-slate-950">
                      {mission.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{mission.description}</p>
                  </div>

                  <div className="mt-6 h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,_#f59f24_0%,_#1e40af_100%)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[30px] bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_100%)] p-6 text-white sm:p-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Promesse communautaire</p>
                <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-white/85">
                  {missionPromise}
                </p>
              </div>
              <a
                href="/laureats"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#10263d] transition-all hover:-translate-y-0.5"
              >
                Voir les lauréats
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
