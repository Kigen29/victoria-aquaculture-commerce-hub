
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ProductSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Skeleton className="w-full aspect-[4/3]" />
      <CardContent className="pt-4 pb-0 flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/4 mb-2" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardContent>
      <CardFooter className="pt-4 pb-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
