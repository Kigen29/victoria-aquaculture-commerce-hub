
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { validateEmail, validatePhoneNumber, sanitizeInput } from "@/lib/security-utils";

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Nairobi locations for address autocomplete
  const nairobiLocations = [
    "Westlands, Nairobi",
    "Kilimani, Nairobi",
    "Kileleshwa, Nairobi",
    "Lavington, Nairobi",
    "Karen, Nairobi",
    "Parklands, Nairobi",
    "Gigiri, Nairobi",
    "South B, Nairobi",
    "South C, Nairobi",
    "Eastleigh, Nairobi",
    "Umoja, Nairobi",
    "Kasarani, Nairobi",
    "Roysambu, Nairobi",
    "Kitisuru, Nairobi",
    "Runda, Nairobi",
    "Muthaiga, Nairobi",
    "Langata, Nairobi",
    "Embakasi, Nairobi",
    "Donholm, Nairobi",
    "Buruburu, Nairobi"
  ];

  // Filter address suggestions based on user input
  const handleAddressChange = (value: string) => {
    setAddress(value);
    
    if (value.trim()) {
      const filtered = nairobiLocations.filter(location => 
        location.toLowerCase().includes(value.toLowerCase())
      );
      setAddressSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectAddress = (location: string) => {
    setAddress(location);
    setShowSuggestions(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !phone || !address) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      toast.error("Please enter a valid phone number (e.g., +254 700 000 000)");
      return;
    }

    // Check password strength
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Sanitize inputs to prevent XSS
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedAddress = sanitizeInput(address);
    const sanitizedPhone = sanitizeInput(phone);
    
    try {
      const result = await signUp(email.toLowerCase().trim(), password, sanitizedFullName, sanitizedPhone, sanitizedAddress);
      
      if (result.success) {
        // Clear signup form and switch to sign in tab
        setFullName("");
        setPhone("");
        setAddress("");
        setActiveTab("signin");
        toast.info("Please check your email and click the verification link, then sign in here.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    }
  };

  // If user is already logged in, redirect to shop
  if (user) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <form
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  // Validate email format
                  if (!validateEmail(email)) {
                    toast.error("Please enter a valid email address");
                    return;
                  }
                  
                  signIn(email.toLowerCase().trim(), password);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="hello@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    placeholder="hello@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    placeholder="+254 700 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="signup-address">Address</Label>
                  <Input
                    id="signup-address"
                    placeholder="Enter your address in Nairobi"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    required
                    onFocus={() => address && setShowSuggestions(addressSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSelectAddress(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <FcGoogle size={20} />
            Google
          </Button>
        </CardContent>
        <CardFooter className="text-sm text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}
