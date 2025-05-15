
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AboutSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl font-bold mb-6 text-aqua-800">About Lake Victoria Aquaculture</h2>
            <p className="text-gray-600 mb-4">
              Lake Victoria Aquaculture is a leading provider of high-quality fish and chicken products sourced directly from the pristine waters of Lake Victoria and our sustainable farms.
            </p>
            <p className="text-gray-600 mb-6">
              Our mission is to deliver fresh, sustainable, and delicious products to your table while supporting local communities and practicing responsible farming methods that protect our environment.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-lake-50 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lake-700 text-2xl mb-1">10+</h3>
                <p className="text-sm text-gray-600">Years of Experience</p>
              </div>
              <div className="bg-lake-50 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lake-700 text-2xl mb-1">1000+</h3>
                <p className="text-sm text-gray-600">Happy Customers</p>
              </div>
              <div className="bg-lake-50 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lake-700 text-2xl mb-1">100%</h3>
                <p className="text-sm text-gray-600">Sustainable Sourcing</p>
              </div>
              <div className="bg-lake-50 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lake-700 text-2xl mb-1">24/7</h3>
                <p className="text-sm text-gray-600">Customer Support</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/about">Learn More About Us</Link>
            </Button>
          </div>
          
          <div className="order-1 lg:order-2 relative">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img 
                src="https://res.cloudinary.com/dq74qwvfm/image/upload/v1747223784/tilapia-raw_czind9.jpg" 
                alt="Lake Victoria" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 w-40 h-40 bg-aqua-600 rounded-lg hidden lg:flex items-center justify-center text-white text-center p-4">
              <div>
                <p className="font-bold">Sustainably Sourced</p>
                <p className="text-xs mt-1">From Lake Victoria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
