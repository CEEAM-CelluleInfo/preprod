import Header from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import VotePage from "@/components/vote/vote";

const VotePageWrapper = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <VotePage />
      </main>
      
      <Footer />
    </div>
  );
};

export default VotePageWrapper;
