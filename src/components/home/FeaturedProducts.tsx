
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

const ProductCard = ({ product }: { product: Tables<"products"> }) => {
  return (
    <div className="glass-card card-hover overflow-hidden flex flex-col h-full">
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={product.image_url || "/placeholder.svg"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-aqua-700 font-bold mt-2">KES {product.price.toFixed(2)}</p>
        <div className="mt-auto pt-4">
          <Button className="w-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProductSkeleton = () => {
  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <Skeleton className="h-60 w-full" />
      <div className="p-4 flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full mt-auto" />
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data as Tables<"products">[];
    },
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  return (
    <section className="py-16 bg-gradient-to-b from-white to-lake-50">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2 text-aqua-800">Featured Products</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our selection of premium quality fish and chicken products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? 
            Array(4).fill(0).map((_, index) => (
              <ProductSkeleton key={index} />
            )) : 
            products?.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          }
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="px-8">
            <Link to="/shop">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
