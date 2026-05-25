import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/sections/HeroCarousel";
import BureauExecutif from "@/components/sections/BureauExecutif";
import MissionSection from "@/components/sections/MissionSection";
import CommunauteSection from "@/components/sections/CommunauteSection";
import { HomeService } from "@/services/homeService";
import { HomePageData } from "@/types/home";

const Index = () => {
  const [homeData, setHomeData] = useState<HomePageData | null>(null);

  useEffect(() => {
    let mounted = true;
    HomeService.getHomePageData().then((data) => {
      if (mounted && data) setHomeData(data);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <HeroCarousel />
        <BureauExecutif members={homeData?.bureau_members} />
        <MissionSection />
        <CommunauteSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
