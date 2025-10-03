
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PromoSignupForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [optInReason, setOptInReason] = useState("sales");
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all spaces, dashes, parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Must start with + or digit, and contain only digits after cleaning
    // Length should be between 8-15 digits (international standard)
    const phoneRegex = /^(\+\d{1,4})?\d{7,14}$/;
    
    return phoneRegex.test(cleanPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber.trim())) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number (e.g., +254123456789 or 0123456789)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const trimmedPhone = phoneNumber.trim();
      
      // Use edge function with rate limiting and security
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: { 
          phone_number: trimmedPhone, 
          opt_in_reason: optInReason 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Thank you for signing up!",
          description: "You'll receive updates on our latest promotions and offers",
        });
        setPhoneNumber("");
      } else if (data?.code === 'RATE_LIMIT_EXCEEDED') {
        toast({
          title: "Too many attempts",
          description: data.error || "Please try again in 15 minutes",
          variant: "destructive",
        });
      } else if (data?.code === 'DUPLICATE_PHONE') {
        toast({
          title: "Already registered",
          description: "This phone number is already registered for promotions",
          variant: "default",
        });
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error("Error registering phone number:", error);
      toast({
        title: "Registration failed",
        description: "There was an error registering your phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 border shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-aqua-800">Get Notifications About Promotions</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">I'm interested in</label>
            <Select value={optInReason} onValueChange={setOptInReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select what you're interested in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales & Discounts</SelectItem>
                <SelectItem value="new_products">New Product Arrivals</SelectItem>
                <SelectItem value="recipes">Recipe Ideas</SelectItem>
                <SelectItem value="all">All Promotions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-lake-600 hover:bg-lake-700"
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? "Signing Up..." : "Sign Up for Alerts"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
