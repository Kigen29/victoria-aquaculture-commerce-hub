
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  createdAt: string;
}

export const BlogCard = ({ slug, title, content, featuredImage, createdAt }: BlogCardProps) => {
  // Format date as "x days ago" or similar
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Create excerpt from content (first 150 characters)
  const excerpt = content.length > 150 
    ? content.substring(0, 150) + "..." 
    : content;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {featuredImage && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img 
            src={featuredImage} 
            alt={title} 
            className="w-full h-full object-contain transition-transform hover:scale-105 duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-aqua-800 line-clamp-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {excerpt}
        </p>
        <Link 
          to={`/blog/${slug}`} 
          className="inline-flex items-center text-lake-600 font-medium hover:text-lake-800"
        >
          Read More
          <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
