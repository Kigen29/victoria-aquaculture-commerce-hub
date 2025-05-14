
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout>
      <div className="container flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </PageLayout>
  );
}
