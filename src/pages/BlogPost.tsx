
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  featured_image: string | null;
  created_at: string;
  updated_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .single();

        if (error) throw error;
        if (!data) {
          navigate("/blog", { replace: true });
          return;
        }
        
        setPost(data);
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setError("Failed to load blog post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-10">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-40 mb-8" />
            <Skeleton className="h-96 w-full mb-8 rounded-lg" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-5/6 mb-3" />
            <Skeleton className="h-4 w-3/4 mb-3" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !post) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "Blog post not found"}
          </h2>
          <p className="mb-8 text-gray-600">
            {error ? "An error occurred while loading this blog post." : "The blog post you're looking for doesn't exist."}
          </p>
          <Link 
            to="/blog" 
            className="inline-flex items-center bg-lake-600 text-white px-5 py-2 rounded-md hover:bg-lake-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>
        </div>
      </PageLayout>
    );
  }

  const formattedDate = format(new Date(post.created_at), "MMMM d, yyyy");
  
  // Paragraphs from content
  const paragraphs = post.content.split('\n\n');

  return (
    <PageLayout>
      <article className="container py-10">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link 
            to="/blog" 
            className="inline-flex items-center text-lake-600 hover:text-lake-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog
          </Link>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>
          
          {/* Meta */}
          <div className="flex items-center text-gray-500 mb-8">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formattedDate}</span>
            <button 
              onClick={handleShare}
              className="ml-auto flex items-center text-lake-600 hover:text-lake-800"
              aria-label="Share this article"
            >
              <Share2 className="w-4 h-4 mr-1" /> Share
            </button>
          </div>
          
          {/* Featured image */}
          {post.featured_image && (
            <div className="mb-8">
              <img 
                src={post.featured_image} 
                alt={post.title} 
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </PageLayout>
  );
};

export default BlogPost;
