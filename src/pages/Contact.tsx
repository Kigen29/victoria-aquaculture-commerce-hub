
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContactSection from "@/components/home/ContactSection";

const Contact = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-aqua-600 to-lake-600 text-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl md:text-2xl text-aqua-100">
              Get in touch with us for any questions or support
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </PageLayout>
  );
};

export default Contact;
