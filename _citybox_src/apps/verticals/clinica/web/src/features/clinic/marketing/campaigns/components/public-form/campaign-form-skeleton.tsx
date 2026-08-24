import { Skeleton } from '@citybox/ui/atoms';

export function CampaignFormSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-8 px-4 md:py-12 md:px-6 lg:py-16">
      {/* Header Skeleton */}
      <div className="text-center space-y-4">
        {/* Logo Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-16 w-16 rounded-lg" />
        </div>
        
        {/* Title Skeleton */}
        <Skeleton className="h-10 w-3/4 mx-auto" />
        
        {/* Description Skeleton */}
        <Skeleton className="h-6 w-full max-w-md mx-auto" />
        <Skeleton className="h-6 w-2/3 mx-auto" />
      </div>

      {/* Intro Text Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Fields Skeleton */}
      <div className="space-y-6">
        {/* Field 1 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Field 2 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Radio Group Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>

        {/* Field 3 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>

      {/* LGPD Consent Skeleton */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-5 w-5 rounded mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="pt-4">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
