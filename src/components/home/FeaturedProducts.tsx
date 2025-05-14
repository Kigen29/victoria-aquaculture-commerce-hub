
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";

// Sample product data with updated fish and chicken images
const sampleProducts = [
  {
    id: "1",
    name: "Fresh Tilapia",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=500", // Fish
    category: "fish"
  },
  {
    id: "2",
    name: "Nile Perch Fillet",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=500", // Fish
    category: "fish"
  },
  {
    id: "3",
    name: "Free Range Chicken",
    price: 15.99,
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=500", // Chicken
    category: "chicken"
  },
  {
    id: "4",
    name: "Organic Chicken Wings",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500", // Chicken
    category: "chicken"
  }
];

const ProductCard = ({ product }: { product: any }) => {
  return (
    <div className="glass-card card-hover overflow-hidden flex flex-col h-full">
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-aqua-700 font-bold mt-2">${product.price.toFixed(2)}</p>
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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // Simulate loading products
  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(sampleProducts);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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
          {loading ? 
            Array(4).fill(0).map((_, index) => (
              <ProductSkeleton key={index} />
            )) : 
            products.map(product => (
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
