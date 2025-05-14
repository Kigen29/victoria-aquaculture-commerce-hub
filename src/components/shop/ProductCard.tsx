
import { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/context/CartContext";

type ProductProps = {
  product: Tables<"products">;
};

// Fish and chicken images to use as fallbacks if image_url is missing or invalid
const fishImages = [
  "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=500", // Fish 1
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=500", // Fish 2
  "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&q=80&w=500", // Fish 3
];

const chickenImages = [
  "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=500", // Chicken 1
  "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500", // Chicken 2
  "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&q=80&w=500", // Chicken 3
];

export function ProductCard({ product }: ProductProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Add to cart
    addToCart(product);
    
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };

  // Function to get appropriate image based on product category
  const getProductImage = () => {
    if (product.image_url) return product.image_url;
    
    const category = product.category?.toLowerCase();
    
    // Select random image based on category
    if (category === 'fish') {
      const randomIndex = Math.floor(Math.random() * fishImages.length);
      return fishImages[randomIndex];
    } else if (category === 'chicken') {
      const randomIndex = Math.floor(Math.random() * chickenImages.length);
      return chickenImages[randomIndex];
    }
    
    // Default image if no category or unknown
    return fishImages[0];
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img
            src={getProductImage()}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
        </AspectRatio>
        
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
      </div>
      
      <CardContent className="pt-4 pb-0 flex-grow">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-aqua-700 font-bold">${Number(product.price).toFixed(2)}</p>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
        )}
      </CardContent>
      
      <CardFooter className="pt-4 pb-4">
        <Button 
          className="w-full gap-2"
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.stock <= 0}
        >
          <ShoppingCart className="h-4 w-4" />
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}
