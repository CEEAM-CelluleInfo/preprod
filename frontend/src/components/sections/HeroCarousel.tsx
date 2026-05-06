import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { HomeStat, HomeUpcomingActivity } from "@/types/home";

interface HeroCarouselProps {
  stats?: HomeStat[];
  upcomingActivities?: HomeUpcomingActivity[];
}

const HeroCarousel = ({ stats, upcomingActivities }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultSlides = [
    {
      eyebrow: "Communauté active",
      title: "Un accueil pensé pour les étudiants internationaux des Arts & Métiers.",
      description:
        "CEEAM accompagne l'intégration, crée des liens durables et transforme chaque mandat en dynamique collective.",
      badge: "18 pays représentés",
    },
    {
      eyebrow: "Vie associative",
      title: "Des activités utiles, visibles et vraiment fédératrices.",
      description:
        "Rencontres, accompagnement, mise en réseau et initiatives étudiantes: la communauté reste vivante toute l'année.",
      badge: "Agenda communautaire",
    },
    {
      eyebrow: "Réseau laureats",
      title: "Une passerelle entre parcours étudiants et trajectoires d'excellence.",
      description:
        "Le réseau des lauréats valorise les réussites, inspire les nouvelles promotions et renforce l'entraide.",
      badge: "Réseau intergénérationnel",
    },
  ];

  const slides = upcomingActivities && upcomingActivities.length > 0
    ? upcomingActivities.map((activity) => ({
        eyebrow: activity.category || "Activité",
        title: activity.title,
        description: activity.description || "Découvrez les prochains temps forts de la communauté CEEAM.",
        badge: activity.location || "À venir",
      }))
    : defaultSlides;

  const quickStats = stats && stats.length > 0
    ? stats.slice(0, 3)
    : [
        { value: "18", label: "pays" },
        { value: "60+", label: "membres actifs" },
        { value: "12", label: "temps forts/an" },
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative overflow-hidden bg-[#10263d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,159,36,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_32%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(135deg,_rgba(255,255,255,0.08)_0%,_rgba(255,255,255,0.02)_100%)] lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              <Sparkles className="h-4 w-4 text-[#f59f24]" />
              {slides[currentSlide].eyebrow}
            </div>

            <div className="space-y-5">
              <div className="inline-flex rounded-full bg-[#fff3df] px-4 py-2 text-sm font-semibold text-[#b45309]">
                {slides[currentSlide].badge}
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                {slides[currentSlide].title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                {slides[currentSlide].description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/activites"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f59f24] px-6 py-3 text-sm font-semibold text-[#10263d] transition-all hover:-translate-y-0.5 hover:bg-[#ffb347]"
              >
                Explorer les activités
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/a-propos"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10"
              >
                Découvrir la CEEAM
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-white/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
            <div className="rounded-[28px] bg-white p-5 text-slate-950 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Focus du moment</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Accueil des nouvelles promotions</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-[#f59f24] hover:text-[#f59f24]"
                    aria-label="Slide précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-[#f59f24] hover:text-[#f59f24]"
                    aria-label="Slide suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {slides.map((slide, index) => {
                  const active = index === currentSlide;

                  return (
                    <button
                      key={slide.title}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-full rounded-[24px] border p-5 text-left transition-all ${
                        active
                          ? "border-[#f59f24] bg-[#fff8eb] shadow-[0_15px_35px_rgba(245,159,36,0.16)]"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{slide.eyebrow}</p>
                          <h3 className="mt-2 text-lg font-bold leading-6 text-slate-950">{slide.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{slide.description}</p>
                        </div>
                        <span className={`mt-1 h-3 w-3 rounded-full ${active ? "bg-[#f59f24]" : "bg-slate-300"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={index === currentSlide ? "dot-indicator-active" : "dot-indicator"}
                    aria-label={`Aller à la slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
