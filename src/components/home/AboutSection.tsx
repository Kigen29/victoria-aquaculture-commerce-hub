import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AboutSection = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["about-section-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("image_url, name")
        .not("image_url", "is", null);
      
      if (error) throw error;
      return data;
    }
  });

  // Monthly rotation: changes every month
  const currentMonth = new Date().getMonth(); // 0-11
  const selectedImage = products && products.length > 0 
    ? products[currentMonth % products.length] 
    : null;

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl font-bold mb-6 text-aqua-800">About Lake Victoria Aquaculture Limited</h2>
            <p className="text-gray-600 mb-4 text-justify">
              Lake Victoria Aquaculture Limited is dedicated to providing high-quality Sea food and Poultry products to consumers. Guided by a strong commitment to excellence and sustainability, we partner with suppliers who share our values to ensure that only the freshest and finest products reach the market.
            </p>
            <p className="text-gray-600 mb-6 text-justify">
              Our mission is to deliver fresh, sustainable, and delicious products to your table while supporting local communities and promoting responsible farming practices that protect our environment for future generations.
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
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <img 
                  src={selectedImage?.image_url || "/placeholder.svg"} 
                  alt={selectedImage?.name || "Lake Victoria Aquaculture"} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-5 -left-5 w-40 h-40 bg-aqua-600 rounded-lg hidden lg:flex items-center justify-center text-white text-center p-4">
              <div>
                <p className="font-bold">Sustainably Sourced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
