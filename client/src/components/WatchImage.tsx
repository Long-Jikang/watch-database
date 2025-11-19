import { trpc } from "@/lib/trpc";

interface WatchImageProps {
  watchId: number;
  brand?: string;
  name?: string;
  referenceNumber?: string;
  className?: string;
}

export default function WatchImage({ 
  watchId, 
  brand, 
  name, 
  referenceNumber, 
  className = "w-full h-auto max-h-64 object-contain" 
}: WatchImageProps) {
  const { data: imageData } = trpc.watches.getImageUrl.useQuery(
    { watchId },
    { enabled: !!watchId }
  );

  const imageUrl = imageData?.imageUrl || null;
  const altText = `${brand || ''} ${name || referenceNumber || `手表 #${watchId}`}`.trim();

  return (
    <div className="min-h-48 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden flex items-center justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className={className}
          onError={(e) => {
            // 图片加载失败时显示品牌首字母
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : (
        <div className="image-fallback w-full h-48 flex items-center justify-center">
          <div className="text-center space-y-3 p-6">
            <div className="text-4xl font-bold text-slate-300 dark:text-slate-600">
              {brand?.charAt(0) || 'W'}
            </div>
            <div className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {brand || 'Watch'}
            </div>
          </div>
        </div>
      )}
      {/* 悬停效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}