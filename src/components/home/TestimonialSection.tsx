
import { useState } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "John Smith",
    role: "Restaurant Owner",
    quote: "The quality of fish from Lake Victoria Aquaculture is exceptional. My customers can taste the difference, and it has become a signature ingredient in our most popular dishes.",
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Food Blogger",
    quote: "I've tried fish from many suppliers, but none compare to the freshness and flavor of Lake Victoria Aquaculture's products. Their commitment to sustainability is also commendable.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 3,
    name: "Michael Wong",
    role: "Home Chef",
    quote: "The chicken from Lake Victoria Aquaculture is simply the best I've ever cooked with. The meat is tender, flavorful, and you can really taste the quality in every bite.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  }
];

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-lake-50">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2 text-aqua-800">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from people who have experienced the quality of our products
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 md:p-10 relative">
            <div className="absolute top-6 left-6 text-aqua-400">
              <Quote size={40} />
            </div>
            <div className="text-center pt-10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={currentTestimonial.image} 
                  alt={currentTestimonial.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <blockquote className="text-xl text-gray-700 italic mb-6 relative">
                "{currentTestimonial.quote}"
              </blockquote>
              <div className="mt-4">
                <h4 className="font-bold text-aqua-800">{currentTestimonial.name}</h4>
                <p className="text-gray-500">{currentTestimonial.role}</p>
              </div>
              <div className="flex justify-center mt-8 gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={prevTestimonial}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextTestimonial}
                  className="rounded-full"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
