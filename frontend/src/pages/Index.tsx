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

    const loadHomeData = async () => {
      const data = await HomeService.getHomePageData();
      if (mounted && data) {
        setHomeData(data);
      }
    };

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,_#fffaf2_0%,_#ffffff_18%,_#f7fafc_100%)] text-slate-950">
      <Header />
      
      <main className="flex-1">
        <HeroCarousel stats={homeData?.stats} upcomingActivities={homeData?.upcoming_activities} />
        <BureauExecutif members={homeData?.bureau_members} />
        <MissionSection content={homeData?.content} />
        <CommunauteSection community={homeData?.community} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
