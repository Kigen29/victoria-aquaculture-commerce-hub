
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("contact_numbers")
        .insert([{ phone_number: phoneNumber, opt_in_reason: optInReason }]);

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast({
            title: "Already registered",
            description: "This phone number is already registered for promotions",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Thank you for signing up!",
          description: "You'll receive updates on our latest promotions and offers",
        });
        setPhoneNumber("");
      }
    } catch (error) {
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
