import AboutSection from "../components/landing/AboutSection";
import CreditsSection from "../components/landing/CreditsSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HeroSection from "../components/landing/HeroSection";
import LandingNav from "../components/landing/LandingNav";

// Public page rendered outside AppShell: no sidebar, one scrolling document.
export default function Landing() {
  return (
    <div>
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <CreditsSection />
    </div>
  );
}
