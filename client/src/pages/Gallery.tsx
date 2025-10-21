import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface KaggleWatch {
  brand: string;
  name: string;
  price: string;
  image_name: string;
  imageUrl: string;
}

export default function Gallery() {
  const [watches, setWatches] = useState<KaggleWatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载 Kaggle 手表数据
    fetch('/kaggle_watches_with_urls.json')
      .then(res => res.json())
      .then(data => {
        setWatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载图片失败:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">手表图库</h1>
              <p className="text-sm text-muted-foreground mt-1">
                浏览 {watches.length} 款真实手表图片
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">返回首页</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watches.map((watch, idx) => (
            <Card key={idx} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
              {/* 手表图片 */}
              <div className="aspect-square bg-white relative overflow-hidden">
                <img
                  src={watch.imageUrl}
                  alt={`${watch.brand} - ${watch.name}`}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* 价格标签 */}
                {watch.price && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-600 text-white shadow-lg">
                      {watch.price}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardHeader className="space-y-2">
                <CardDescription>
                  <Badge variant="outline">{watch.brand}</Badge>
                </CardDescription>
                <CardTitle className="text-base line-clamp-2">
                  {watch.name}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {watches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无图片数据</p>
          </div>
        )}
      </main>
    </div>
  );
}

