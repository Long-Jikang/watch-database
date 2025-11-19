import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function WatchDetail() {
  const [, params] = useRoute("/watch/:id");
  const watchId = params?.id ? parseInt(params.id) : 0;
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.watches.getWithFeatures.useQuery({
    id: watchId,
  });

  // 获取手表图片URL
  const { data: imageData, isLoading: imageLoading } = trpc.watches.getImageUrl.useQuery({
    watchId: watchId,
  }, {
    enabled: !!watchId, // 只有当watchId存在时才执行查询
  });

  const addToWatchlistMutation = trpc.watchlist.add.useMutation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToWatchlist = () => {
    if (!isAuthenticated) {
      alert("请先登录");
      return;
    }
    addToWatchlistMutation.mutate(
      { watchId },
      {
        onSuccess: () => {
          alert("已添加到收藏");
        },
        onError: (error) => {
          alert(`添加失败: ${error.message}`);
        },
      }
    );
  };

  // Group features by key
  const groupedFeatures = data?.features.reduce((acc, feature) => {
    if (!acc[feature.featureKey]) {
      acc[feature.featureKey] = [];
    }
    acc[feature.featureKey].push(feature.featureValue);
    return acc;
  }, {} as Record<string, string[]>);

  const featureLabels: Record<string, string> = {
    dial_color: "表盘颜色",
    case_shape: "表壳形状",
    indexes: "时标类型",
    hands: "指针类型",
    complication: "复杂功能",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.watch) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">未找到该手表</p>
              <Link href="/search">
                <Button variant="outline">返回搜索</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { watch } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Back Button */}
        <Link href="/search">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回搜索
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 手表图片 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="aspect-[4/5] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                {imageLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">
                        加载中...
                      </div>
                    </div>
                  </div>
                ) : imageData?.imageUrl ? (
                  <img
                    src={imageData.imageUrl}
                    alt={`${watch.brand} ${watch.name || watch.reference}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时显示品牌首字母
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="image-fallback w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="text-6xl font-bold text-slate-200 dark:text-slate-700">
                        {watch.brand?.charAt(0) || 'W'}
                      </div>
                      <div className="text-lg font-semibold text-slate-400 dark:text-slate-500">
                        {watch.brand || 'Watch'}
                      </div>
                      {watch.reference && (
                        <div className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                          {watch.reference}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{watch.name || watch.referenceNumber || `手表 #${watch.id}`}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="text-base">
                      {watch.brand}
                    </Badge>
                    {watch.referenceNumber && (
                      <Badge variant="outline" className="text-base">
                        {watch.referenceNumber}
                      </Badge>
                    )}
                    {watch.isLimited && (
                      <Badge variant="destructive" className="text-base">
                        限量版
                        {watch.limitedEditionSize && ` (${watch.limitedEditionSize})`}
                      </Badge>
                    )}
                  </div>
                </div>
                {isAuthenticated && (
                  <Button
                    onClick={handleAddToWatchlist}
                    variant="outline"
                    disabled={addToWatchlistMutation.isPending}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    收藏
                  </Button>
                )}
              </div>

              {watch.family && (
                <p className="text-lg text-muted-foreground">系列: {watch.family}</p>
              )}
            </div>

            {/* 手表规格信息 */}
            <Card>
              <CardHeader>
                <CardTitle>手表规格</CardTitle>
                <CardDescription>详细技术参数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 基础信息 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">基础信息</h4>
                    {watch.brand && (
                      <div className="flex justify-between">
                        <span className="text-sm">品牌</span>
                        <span className="font-medium">{watch.brand}</span>
                      </div>
                    )}
                    {watch.family && (
                      <div className="flex justify-between">
                        <span className="text-sm">系列</span>
                        <span className="font-medium">{watch.family}</span>
                      </div>
                    )}
                    {watch.name && (
                      <div className="flex justify-between">
                        <span className="text-sm">名称</span>
                        <span className="font-medium">{watch.name}</span>
                      </div>
                    )}
                    {watch.reference && (
                      <div className="flex justify-between">
                        <span className="text-sm">型号</span>
                        <span className="font-medium font-mono">{watch.reference}</span>
                      </div>
                    )}
                    {watch.limited && (
                      <div className="flex justify-between">
                        <span className="text-sm">限量版</span>
                        <span className="font-medium">{watch.limited === 'Yes' ? '是' : watch.limited}</span>
                      </div>
                    )}
                  </div>

                  {/* 机芯信息 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">机芯</h4>
                    {watch.movement_caliber && (
                      <div className="flex justify-between">
                        <span className="text-sm">机芯型号</span>
                        <span className="font-medium">{watch.movement_caliber}</span>
                      </div>
                    )}
                    {watch.movement_functions && (
                      <div className="flex justify-between">
                        <span className="text-sm">功能</span>
                        <span className="font-medium text-right">{watch.movement_functions}</span>
                      </div>
                    )}
                  </div>

                  {/* 表壳信息 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">表壳</h4>
                    {watch.case_material && (
                      <div className="flex justify-between">
                        <span className="text-sm">材质</span>
                        <span className="font-medium">{watch.case_material}</span>
                      </div>
                    )}
                    {watch.shape && (
                      <div className="flex justify-between">
                        <span className="text-sm">形状</span>
                        <span className="font-medium">{watch.shape}</span>
                      </div>
                    )}
                    {watch.diameter && (
                      <div className="flex justify-between">
                        <span className="text-sm">直径</span>
                        <span className="font-medium">{watch.diameter}</span>
                      </div>
                    )}
                    {watch.height && watch.height !== 'Bilgi Yok' && (
                      <div className="flex justify-between">
                        <span className="text-sm">高度</span>
                        <span className="font-medium">{watch.height}</span>
                      </div>
                    )}
                    {watch.wr && (
                      <div className="flex justify-between">
                        <span className="text-sm">防水深度</span>
                        <span className="font-medium">{watch.wr}</span>
                      </div>
                    )}
                  </div>

                  {/* 其他规格 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">其他规格</h4>
                    {watch.glass && (
                      <div className="flex justify-between">
                        <span className="text-sm">表镜</span>
                        <span className="font-medium">{watch.glass}</span>
                      </div>
                    )}
                    {watch.back && (
                      <div className="flex justify-between">
                        <span className="text-sm">表背</span>
                        <span className="font-medium">{watch.back}</span>
                      </div>
                    )}
                    {watch.dial_color && (
                      <div className="flex justify-between">
                        <span className="text-sm">表盘颜色</span>
                        <span className="font-medium">{watch.dial_color}</span>
                      </div>
                    )}
                    {watch.indexes && (
                      <div className="flex justify-between">
                        <span className="text-sm">时标</span>
                        <span className="font-medium">{watch.indexes}</span>
                      </div>
                    )}
                    {watch.hands && (
                      <div className="flex justify-between">
                        <span className="text-sm">指针</span>
                        <span className="font-medium">{watch.hands}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 价格信息 */}
            {(watch.price_cny || watch.price_usd || watch.price_hkd || watch.price_sgd) && (
              <Card>
                <CardHeader>
                  <CardTitle>价格信息</CardTitle>
                  <CardDescription>市场参考价格</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {watch.price_cny && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">¥{watch.price_cny.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">人民币</div>
                      </div>
                    )}
                    {watch.price_hkd && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">HK${watch.price_hkd.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">港币</div>
                      </div>
                    )}
                    {watch.price_usd && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">${watch.price_usd.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">美元</div>
                      </div>
                    )}
                    {watch.price_sgd && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">S${watch.price_sgd.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">新加坡元</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {watch.description && (
              <Card>
                <CardHeader>
                  <CardTitle>产品描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {watch.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {groupedFeatures && Object.keys(groupedFeatures).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>特征与功能</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(groupedFeatures).map(([key, values]) => (
                    <div key={key}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {featureLabels[key] || key}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value, index) => (
                          <Badge key={index} variant="secondary">
                            {value}
                          </Badge>
                        ))}
                      </div>
                      {key !== Object.keys(groupedFeatures)[Object.keys(groupedFeatures).length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>技术规格</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {watch.movementType && (
                  <div>
                    <p className="text-sm text-muted-foreground">机芯类型</p>
                    <p className="font-medium">{watch.movementType}</p>
                  </div>
                )}

                {watch.movementCaliber && (
                  <div>
                    <p className="text-sm text-muted-foreground">机芯型号</p>
                    <p className="font-medium">{watch.movementCaliber}</p>
                  </div>
                )}

                <Separator />

                {watch.caseMaterial && (
                  <div>
                    <p className="text-sm text-muted-foreground">表壳材质</p>
                    <p className="font-medium">{watch.caseMaterial}</p>
                  </div>
                )}

                {watch.caseDiameterMm && (
                  <div>
                    <p className="text-sm text-muted-foreground">表壳直径</p>
                    <p className="font-medium">{watch.caseDiameterMm} mm</p>
                  </div>
                )}

                {watch.caseThicknessMm && (
                  <div>
                    <p className="text-sm text-muted-foreground">表壳厚度</p>
                    <p className="font-medium">{watch.caseThicknessMm} mm</p>
                  </div>
                )}

                {watch.glass && (
                  <div>
                    <p className="text-sm text-muted-foreground">表镜材质</p>
                    <p className="font-medium">{watch.glass}</p>
                  </div>
                )}

                {watch.back && (
                  <div>
                    <p className="text-sm text-muted-foreground">底盖类型</p>
                    <p className="font-medium">{watch.back}</p>
                  </div>
                )}

                {watch.waterResistanceM && (
                  <div>
                    <p className="text-sm text-muted-foreground">防水深度</p>
                    <p className="font-medium">{watch.waterResistanceM} 米</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>其他信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {watch.yearOfProduction && (
                  <div>
                    <p className="text-sm text-muted-foreground">生产年份</p>
                    <p className="font-medium">{watch.yearOfProduction}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">数据来源</p>
                  <p className="font-medium capitalize">{watch.dataSource || "Unknown"}</p>
                </div>

                {watch.updatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">最后更新</p>
                    <p className="font-medium">
                      {new Date(watch.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

