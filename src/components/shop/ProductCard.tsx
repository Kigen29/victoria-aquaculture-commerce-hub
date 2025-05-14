
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

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-muted">
              No image
            </div>
          )}
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
