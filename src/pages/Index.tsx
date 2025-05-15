
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import AboutSection from "@/components/home/AboutSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import ContactSection from "@/components/home/ContactSection";
import PromoSection from "@/components/home/PromoSection";

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      <HeroSection />
      <FeaturedProducts />
      <AboutSection />
      <TestimonialSection />
      <PromoSection />
      <ContactSection />
    </PageLayout>
  );
};

export default Index;
