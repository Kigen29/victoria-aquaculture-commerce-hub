
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
      <section className="bg-gradient-to-r from-aqua-800 to-lake-600 text-white py-24">
        <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-aqua-50">
              Get in touch with us for any questions or support
            </p>
          </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </PageLayout>
  );
};

export default Contact;
