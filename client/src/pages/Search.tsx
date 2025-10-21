import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Search() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [caseMaterial, setCaseMaterial] = useState<string>("all");
  const [movementType, setMovementType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: brandsData } = trpc.filters.getBrands.useQuery();
  const { data: materialsData } = trpc.filters.getCaseMaterials.useQuery();
  const { data: movementTypesData } = trpc.filters.getMovementTypes.useQuery();

  const { data: searchResults, isLoading } = trpc.watches.search.useQuery({
    query: query || undefined,
    brand: brand && brand !== "all" ? brand : undefined,
    caseMaterial: caseMaterial && caseMaterial !== "all" ? caseMaterial : undefined,
    movementType: movementType && movementType !== "all" ? movementType : undefined,
    limit,
    offset: page * limit,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, brand, caseMaterial, movementType]);

  const clearFilters = () => {
    setQuery("");
    setBrand("all");
    setCaseMaterial("all");
    setMovementType("all");
    setPage(0);
  };

  const hasActiveFilters = query || (brand && brand !== "all") || (caseMaterial && caseMaterial !== "all") || (movementType && movementType !== "all");

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">搜索手表</h1>
          <p className="text-muted-foreground">
            在 {searchResults?.total.toLocaleString() || "40,000+"} 款手表中找到您的理想腕表
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    筛选条件
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      清除
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Query */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">关键词</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索名称、品牌、型号..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">品牌</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择品牌" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部品牌</SelectItem>
                      {brandsData?.slice(0, 50).map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Case Material Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">表壳材质</label>
                  <Select value={caseMaterial} onValueChange={setCaseMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择材质" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部材质</SelectItem>
                      {materialsData?.slice(0, 30).map((m) => m && (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Movement Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">机芯类型</label>
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择机芯" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      {movementTypesData?.map((t) => t && (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "搜索中..."
                ) : (
                  `找到 ${searchResults?.total.toLocaleString()} 个结果`
                )}
              </p>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults && searchResults.watches.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.watches.map((watch) => (
                    <Link key={watch.id} href={`/watch/${watch.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-2">
                            {watch.name || watch.referenceNumber || `手表 #${watch.id}`}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{watch.brand || '未知品牌'}</Badge>
                            {watch.referenceNumber && (
                              <Badge variant="outline">{watch.referenceNumber}</Badge>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {watch.caseMaterial && (
                              <div>
                                <span className="text-muted-foreground">材质: </span>
                                <span className="font-medium">{watch.caseMaterial}</span>
                              </div>
                            )}
                            {watch.caseDiameterMm && (
                              <div>
                                <span className="text-muted-foreground">直径: </span>
                                <span className="font-medium">{watch.caseDiameterMm.toString()}mm</span>
                              </div>
                            )}
                            {watch.movementType && (
                              <div>
                                <span className="text-muted-foreground">机芯: </span>
                                <span className="font-medium">{watch.movementType}</span>
                              </div>
                            )}
                            {watch.waterResistanceM && (
                              <div>
                                <span className="text-muted-foreground">防水: </span>
                                <span className="font-medium">{watch.waterResistanceM}m</span>
                              </div>
                            )}
                          </div>
                          {watch.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {watch.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {searchResults.total > limit && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      上一页
                    </Button>
                    <div className="flex items-center px-4">
                      第 {page + 1} 页 / 共 {Math.ceil(searchResults.total / limit)} 页
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= searchResults.total}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">未找到匹配的手表</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    清除筛选条件
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

