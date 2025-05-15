
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
  <img
    src="/lovable-uploads/1157c102-a007-41ae-8fea-955280914e5c.png"
    alt="Lake Victoria Aquaculture Logo"
    className="
      h-24           /* base (mobile) */
      md:h-32        /* ≥768px (medium) */
      lg:h-40        /* ≥1024px (large) */
      xl:h-48        /* ≥1280px (extra‑large) */
    "
  />
</Link>
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Home
          </Link>
          <Link to="/shop" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Shop
          </Link>
          <Link to="/blog" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Blog
          </Link>
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-aqua-700">
            About Us
          </Link>
          <Link to="/contact" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="cursor-pointer">Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="container md:hidden py-4 animate-fade-in">
          <nav className="flex flex-col gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              Shop
            </Link>
            <Link 
              to="/blog" 
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/cart"
              className="text-sm font-medium transition-colors hover:text-aqua-700"
              onClick={() => setIsOpen(false)}
            >
              Cart ({cartCount})
            </Link>
            {!user && (
              <Link 
                to="/auth" 
                className="text-sm font-medium transition-colors hover:text-aqua-700"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
