import Header from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import LaureatDetails from "@/components/laureatDetail/LaureatDetails";

const LaureatDetail = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <LaureatDetails />
      </main>
      
      <Footer />
    </div>
  );
};

export default LaureatDetail;
