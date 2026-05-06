import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    "Carousel défilement Infini",
    "Bienvenue à la CEEAM",
    "Ensemble pour réussir",
    "Arts & Métiers International",
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
    <section className="navy-section">
      <div className="relative">
        {/* Carousel Content */}
        <div className="flex items-center justify-between px-4 py-16 md:py-24">
          <button
            onClick={prevSlide}
            className="p-2 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            aria-label="Slide précédente"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-secondary-foreground animate-fade-in">
              {slides[currentSlide]}
            </h1>
          </div>

          <button
            onClick={nextSlide}
            className="p-2 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
            aria-label="Slide suivante"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 pb-8">
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
    </section>
  );
};

export default HeroCarousel;
