import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, LogOut, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { PaymentStatusIndicator } from "@/components/payment/PaymentStatusIndicator";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-auto items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 h-12 lg:h-40">
          <img
            src="/lovable-uploads/Lake_Victoria_Aquaculture_Logo-removebg-preview.png"
            alt="Lake Victoria Aquaculture Logo"
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {['Home', 'Shop', 'Blog', 'About Us', 'Contact'].map((label) => (
            <Link
              key={label}
              to={label === 'Home' ? '/' : `/${label.toLowerCase().replace(/ /g, '')}`}
              className="text-sm font-medium transition-colors hover:text-aqua-700"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right-hand icons & mobile menu button */}
        <div className="flex items-center gap-4">
          <PaymentStatusIndicator />
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
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
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

      {/* Mobile nav */}
      {isOpen && (
        <div className="container mx-auto md:hidden py-4 px-4 animate-fade-in">
          <nav className="flex flex-col gap-4">
            {['Home', 'Shop', 'Blog', 'About Us', 'Contact'].map((label) => (
              <Link
                key={label}
                to={label === 'Home' ? '/' : `/${label.toLowerCase().replace(/ /g, '')}`}
                className="text-sm font-medium transition-colors hover:text-aqua-700"
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            ))}
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
