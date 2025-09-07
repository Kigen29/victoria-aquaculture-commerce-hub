
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { BlogList } from "@/components/blog/BlogList";

const Blog = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      {/* Hero section */}
      <div className="bg-gradient-to-r from-aqua-800 to-lake-600 text-white py-24">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-aqua-50">
            Discover delicious recipes, cooking tips and stories 
          </p>
        </div>
      </div>

      {/* Blog content */}
      <div className="container py-16">
        <BlogList />
      </div>
    </PageLayout>
  );
};

export default Blog;
