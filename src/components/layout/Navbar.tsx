
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Will be replaced with real cart state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl text-aqua-700">Lake<span className="text-forest-600">Victoria</span></span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Home
          </Link>
          <Link to="/shop" className="text-sm font-medium transition-colors hover:text-aqua-700">
            Shop
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/login">Login</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/register">Register</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
