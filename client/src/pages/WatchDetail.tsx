import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Watch, Settings, Diamond, Palette, DollarSign, Calendar, Shield, Zap, Eye, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// 参数分类配置
const parameterCategories = [
  {
    key: "basic",
    title: "基础信息",
    icon: Watch,
    fields: ["brand", "family", "name", "referenceNumber", "yearOfProduction", "isLimited", "limitedEditionSize"],
    fieldLabels: {
      brand: "品牌",
      family: "系列",
      name: "名称",
      referenceNumber: "型号",
      yearOfProduction: "生产年份",
      isLimited: "限量版",
      limitedEditionSize: "限量数量"
    }
  },
  {
    key: "movement",
    title: "机芯规格",
    icon: Settings,
    fields: ["movementType", "movementCaliber", "movementFunctions"],
    fieldLabels: {
      movementType: "机芯类型",
      movementCaliber: "机芯型号",
      movementFunctions: "机芯功能"
    }
  },
  {
    key: "case",
    title: "表壳规格",
    icon: Diamond,
    fields: ["caseMaterial", "caseDiameterMm", "caseThicknessMm", "waterResistanceM"],
    fieldLabels: {
      caseMaterial: "表壳材质",
      caseDiameterMm: "表壳直径",
      caseThicknessMm: "表壳厚度",
      waterResistanceM: "防水深度"
    }
  },
  {
    key: "dial",
    title: "表盘特征",
    icon: Palette,
    fields: ["dial_color", "indexes", "hands"],
    fieldLabels: {
      dial_color: "表盘颜色",
      indexes: "时标类型",
      hands: "指针类型"
    }
  },
  {
    key: "other",
    title: "其他规格",
    icon: Eye,
    fields: ["glass", "back"],
    fieldLabels: {
      glass: "表镜材质",
      back: "底盖类型"
    }
  }
];

// 价格信息配置
const priceConfig = {
  cny: { label: "人民币", symbol: "¥" },
  hkd: { label: "港币", symbol: "HK$" },
  usd: { label: "美元", symbol: "$" },
  sgd: { label: "新加坡元", symbol: "S$" }
};

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

  // 检查参数是否有值
  const hasValue = (field: string) => {
    const value = watch[field as keyof typeof watch];
    return value !== null && value !== undefined && value !== "" && value !== 0;
  };

  // 格式化参数值
  const formatValue = (field: string, value: any) => {
    if (field === "caseDiameterMm" || field === "caseThicknessMm") {
      return `${value} mm`;
    }
    if (field === "waterResistanceM") {
      return `${value} 米`;
    }
    if (field === "isLimited") {
      return value ? "是" : "否";
    }
    if (field === "limitedEditionSize") {
      return `${value} 枚`;
    }
    return value;
  };

  // 渲染参数卡片
  const renderParameterCard = (category: typeof parameterCategories[0]) => {
    const hasData = category.fields.some(field => hasValue(field));
    if (!hasData) return null;

    const IconComponent = category.icon;

    return (
      <Card key={category.key} className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <IconComponent className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{category.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {category.fields.map((field) => {
              if (!hasValue(field)) return null;
              
              const value = watch[field as keyof typeof watch];
              const label = category.fieldLabels[field as keyof typeof category.fieldLabels] || field;
              
              return (
                <div key={field} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-right">
                    {formatValue(field, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 渲染价格卡片
  const renderPriceCard = () => {
    const hasPriceData = Object.keys(priceConfig).some(key => hasValue(key));
    if (!hasPriceData) return null;

    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <CardTitle className="text-lg">价格信息</CardTitle>
          </div>
          <CardDescription>市场参考价格</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priceConfig).map(([key, config]) => {
              if (!hasValue(key)) return null;
              const value = watch[key as keyof typeof watch];
              
              return (
                <div 
                  key={key} 
                  className="text-center p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-600 backdrop-blur-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-white/95 dark:hover:bg-slate-800/95 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-slate-200/50 dark:hover:shadow-slate-700/50 transform-gpu cursor-pointer"
                >
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-200 transition-colors duration-200 hover:text-slate-900 dark:hover:text-slate-100">
                    {config.symbol}{typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-200 hover:text-slate-700 dark:hover:text-slate-300">{config.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

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
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
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

            {/* 优化后的参数展示区域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parameterCategories.map(renderParameterCard)}
            </div>

            {/* 价格信息 */}
            {renderPriceCard()}

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
        </div>
      </div>
    </div>
  );
}

