import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PageContent {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  published: boolean;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      if (!slug) {
        setError("No page slug provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("page_content")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setError("Page not found");
          } else {
            setError("Failed to load page content");
          }
        } else {
          setPageContent(data);
          // Update page title and meta description
          document.title = `${data.title} | Lake Victoria Aquaculture`;
          
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute("content", data.meta_description || "");
          } else {
            const meta = document.createElement("meta");
            meta.name = "description";
            meta.content = data.meta_description || "";
            document.head.appendChild(meta);
          }
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Skeleton className="h-4 w-20" />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !pageContent) {
    return (
      <PageLayout>
        <div className="container py-8">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Error</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Page Not Found</AlertTitle>
            <AlertDescription>
              {error || "The page you are looking for could not be found."}
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageContent.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="prose prose-lg max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: pageContent.content,
            }}
            className="dynamic-content space-y-4"
          />
        </article>
      </div>
    </PageLayout>
  );
};

export default DynamicPage;