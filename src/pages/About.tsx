import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Fish, Users, Shield, Target, Award, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const About = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["about-page-images"],
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

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-aqua-800 to-lake-600 text-white py-24">
        <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-aqua-50">
              Dedicated to providing high-quality fish and chicken products.
            </p>
          </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-aqua-800">Lake Victoria Aquaculture Limited</h2>
              <p className="text-gray-600 mb-4 text-justify" >
                Lake Victoria Aquaculture Limited is dedicated to providing high-quality fish and chicken products to consumers. With a commitment to excellence and sustainability, the company partners with suppliers who align with their values to ensure only the freshest and highest quality products reach the market. We serve customers locally and potentially on a broader scale, aiming to meet the needs of seafood and poultry enthusiasts who prioritize quality and affordability.
              </p>
              <p className="text-gray-600 mb-6 text-justify">
                Additionally, we maintain stringent quality assurance processes to uphold the highest standards of product quality and safety, providing consumers with peace of mind.The company's commitment to quality, affordability, and exceptional customer service sets it apart in the seafood and poultry market, providing a competitive edge. Lake Victoria Aquaculture Limited aims to expand its market reach while continuing to prioritize product quality, sustainability, and customer satisfaction.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lake-50 p-4 rounded-lg text-center">
                  <Fish className="h-8 w-8 text-lake-600 mx-auto mb-2" />
                  <h3 className="font-bold text-lake-700">Premium Sea Food</h3>
                </div>
                <div className="bg-lake-50 p-4 rounded-lg text-center">
                  <Users className="h-8 w-8 text-lake-600 mx-auto mb-2" />
                  <h3 className="font-bold text-lake-700">Quality Poultry</h3>
                </div>
              </div>
            </div>
            
            <div className="relative">
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
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-aqua-800">Our Mission & Vision</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We are committed to expanding our market reach while continuing to prioritize product quality, sustainability, and customer satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="h-full">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-aqua-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4 text-aqua-800">Our Mission</h3>
                <p className="text-gray-600">
                  To provide high-quality, sustainable fish and chicken products while maintaining excellence in customer service and building lasting partnerships with suppliers who share our values.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-aqua-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4 text-aqua-800">Our Vision</h3>
                <p className="text-gray-600">
                  To be the leading provider of premium aquaculture and poultry products, expanding our market reach while setting the standard for quality, sustainability, and customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-aqua-800">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do and set us apart in the seafood and poultry market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-aqua-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3 text-aqua-800">Quality Assurance</h3>
                <p className="text-gray-600">
                  We maintain stringent quality assurance processes to uphold the highest standards of product quality and safety, providing consumers with peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Leaf className="h-12 w-12 text-aqua-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3 text-aqua-800">Sustainability</h3>
                <p className="text-gray-600">
                  Our commitment to sustainable practices ensures we protect the environment while delivering premium products for future generations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-aqua-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3 text-aqua-800">Customer Service</h3>
                <p className="text-gray-600">
                  Exceptional customer service is at the heart of what we do, ensuring every interaction exceeds expectations and builds lasting relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Competitive Edge */}
      <section className="py-16 bg-lake-50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-aqua-800">Our Competitive Edge</h2>
            <p className="text-lg text-gray-600 mb-8">
              The company's commitment to quality, affordability, and exceptional customer service sets it apart in the seafood and poultry market, providing a competitive edge.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-aqua-700 text-2xl mb-2">Quality</h3>
                <p className="text-gray-600">Premium products sourced from trusted suppliers</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-aqua-700 text-2xl mb-2">Affordability</h3>
                <p className="text-gray-600">Competitive pricing without compromising quality</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-aqua-700 text-2xl mb-2">Service</h3>
                <p className="text-gray-600">Exceptional customer experience every time</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
