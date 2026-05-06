import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/sections/HeroCarousel";
import BureauExecutif from "@/components/sections/BureauExecutif";
import MissionSection from "@/components/sections/MissionSection";
import CommunauteSection from "@/components/sections/CommunauteSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <HeroCarousel />
        <BureauExecutif />
        <MissionSection />
        <CommunauteSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
