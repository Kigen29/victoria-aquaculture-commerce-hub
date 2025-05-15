
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-lake-500 to-aqua-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      <div className="container relative py-20 md:py-32 flex flex-col items-center justify-center text-center">
        <div className="mb-8 flex justify-center">
          <img 
            src="/lovable-uploads/1157c102-a007-41ae-8fea-955280914e5c.png" 
            alt="Lake Victoria Aquaculture Logo" 
            className="h-28 md:h-36"
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl">
          Fresh Fish & Quality Chicken from Lake Victoria Aquaculture
        </h1>
        <p className="text-lg md:text-xl text-lake-100 max-w-2xl mb-10">
          Premium quality products sourced sustainably and delivered fresh to your doorstep
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="bg-lake-500 hover:bg-lake-600 text-white">
            <Link to="/shop">Shop Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
            <Link to="/about">Learn More</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
