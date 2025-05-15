
import { PromoSignupForm } from "@/components/contact/PromoSignupForm";
import { Megaphone } from "lucide-react";

const PromoSection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-aqua-50 to-white">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="md:w-1/2">
            <div className="flex items-center mb-4">
              <Megaphone className="h-8 w-8 text-lake-600 mr-2" />
              <h2 className="text-3xl font-bold text-aqua-800">Never Miss a Deal</h2>
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Be the first to know about our special offers, new product arrivals, and seasonal discounts. 
              Sign up now to receive text alerts about our fresh fish and chicken promotions!
            </p>
            <div className="bg-aqua-100/50 p-4 rounded-lg">
              <h3 className="font-medium text-aqua-800 mb-2">What you'll receive:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Exclusive discount codes</li>
                <li>Flash sales notifications</li>
                <li>New product announcements</li>
                <li>Seasonal recipes and cooking tips</li>
                <li>Special event invitations</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                We respect your privacy. You can unsubscribe at any time.
              </p>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <PromoSignupForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
