import { cn } from "@/lib/utils"

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'card' | 'table' | 'text' | 'image' | 'button'
  count?: number
}

export function Shimmer({ 
  className, 
  type = 'text',
  count = 1,
  ...props 
}: ShimmerProps) {
  const renderShimmer = () => {
    switch (type) {
      case 'card':
        return (
          <div className="space-y-3">
            <div className="h-4 w-2/3 bg-primary/10 rounded animate-pulse" />
            <div className="h-32 bg-primary/10 rounded animate-pulse" />
          </div>
        )
      case 'table':
        return (
          <div className="space-y-2">
            <div className="h-8 bg-primary/10 rounded animate-pulse" />
            <div className="h-8 bg-primary/10 rounded animate-pulse" />
            <div className="h-8 bg-primary/10 rounded animate-pulse" />
          </div>
        )
      case 'image':
        return (
          <div className="aspect-video bg-primary/10 rounded animate-pulse" />
        )
      case 'button':
        return (
          <div className="h-9 w-24 bg-primary/10 rounded animate-pulse" />
        )
      default:
        return (
          <div className="h-4 w-full bg-primary/10 rounded animate-pulse" />
        )
    }
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderShimmer()}
        </div>
      ))}
    </div>
  )
} 