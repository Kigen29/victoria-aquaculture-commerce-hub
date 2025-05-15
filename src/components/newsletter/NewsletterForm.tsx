
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert([{ email }]);

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Thank you for subscribing!",
          description: "You'll receive our latest updates and offers",
        });
        setEmail("");
      }
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: "Subscription failed",
        description: "There was an error subscribing to the newsletter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-semibold mb-2">Subscribe to our Newsletter</h3>
      <p className="text-sm text-gray-300 mb-2">
        Get the latest updates on new products, special offers, and more.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          required
        />
        <Button 
          type="submit" 
          disabled={isLoading || !email}
          className="whitespace-nowrap"
        >
          {isLoading ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
};
