import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/home/HeroSection';
import TeamsShowcase from '@/components/home/TeamsShowcase';
import UpcomingMatches from '@/components/home/UpcomingMatches';
import NewsSection from '@/components/home/NewsSection';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <AuroraBackground />
      <Navbar />
      <main>
        <HeroSection />
        <TeamsShowcase />
        <UpcomingMatches />
        <NewsSection />
      </main>
      <Footer />
    </div>
  );
}
