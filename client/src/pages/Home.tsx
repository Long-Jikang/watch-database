import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Database, TrendingUp, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: stats, isLoading } = trpc.stats.get.useQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Watch Database & Market Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            探索超过 {stats?.totalWatches.toLocaleString() || "40,000"} 款手表的详细规格数据，追踪市场行情，发现您的下一块腕表
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="w-full sm:w-auto">
                <Search className="mr-2 h-5 w-5" />
                开始搜索
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Database className="mr-2 h-5 w-5" />
                浏览数据库
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总手表数量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stats?.totalWatches.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                品牌数量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stats?.totalBrands.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                特征数据
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stats?.totalFeatures.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                价格记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stats?.totalPriceRecords.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>高级搜索</CardTitle>
              <CardDescription>
                多维度筛选功能，支持品牌、材质、机芯类型、表径范围等多种条件组合搜索
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>价格追踪</CardTitle>
              <CardDescription>
                实时市场价格数据，历史价格趋势图，帮助您了解手表的市场行情变化
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>个人收藏</CardTitle>
              <CardDescription>
                创建您的个人手表收藏清单，添加笔记，追踪您感兴趣的腕表
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">准备好探索了吗？</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg">
              立即开始搜索，发现您的理想腕表
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/search">
              <Button size="lg" variant="secondary">
                立即开始
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

