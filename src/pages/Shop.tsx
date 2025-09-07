
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductSkeleton } from "@/components/shop/ProductSkeleton";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import PageLayout from "@/components/layout/PageLayout";

export default function Shop() {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch products from Supabase
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      
      if (error) throw error;
      return data as Tables<"products">[];
    }
  });
  
  // Extract unique categories from products
  const categories = products 
    ? [...new Set(products.filter(p => p.category).map(p => p.category!))]
    : [];
  
  // Filter products by category and search term
  const filteredProducts = products?.filter(product => {
    const matchesCategory = activeCategory ? product.category === activeCategory : true;
    const matchesSearch = searchTerm.trim() === "" ? true : 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Handle category change
  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
  };

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <PageLayout>
      <div className="container py-12 animate-fade-in">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Our Products</h1>
            {profile && (
              <p className="text-muted-foreground">
                Welcome, {profile.full_name || 'Valued Customer'}!
              </p>
            )}
          </div>
        </div>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Category filter */}
        {categories.length > 0 && (
          <CategoryFilter 
            categories={categories} 
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        )}
        
        {error ? (
          <div className="text-center py-10">
            <p className="text-destructive">Error loading products. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              // Show skeleton cards while loading
              Array(8).fill(0).map((_, index) => (
                <div key={`skeleton-${index}`} className="animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <ProductSkeleton />
                </div>
              ))
            ) : filteredProducts?.length ? (
              // Show filtered products
              filteredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              // No products found for the selected filters
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">
                  {searchTerm.trim() !== "" || activeCategory 
                    ? `No products found${activeCategory ? ` in the "${activeCategory}" category` : ""}${searchTerm.trim() !== "" ? ` matching "${searchTerm}"` : ""}.`
                    : "No products available at the moment."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
