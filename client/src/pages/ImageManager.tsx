import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ImageManager() {
  const [, setLocation] = useLocation();
  const [watchId, setWatchId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();
  
  // 搜索手表
  const { data: searchResults } = trpc.watches.search.useQuery(
    {
      query: searchQuery,
      brand: "",
      caseMaterial: "",
      movementType: "",
      limit: 10,
    },
    { enabled: searchQuery.length > 2 }
  );

  // 更新图片的状态
  const [updateStatus, setUpdateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleUpdateImage = async () => {
    if (!watchId || !imageUrl) {
      toast.error("请填写手表ID和图片URL");
      return;
    }

    setUpdateStatus("loading");
    try {
      const response = await fetch("/api/update-watch-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchId: parseInt(watchId), imageUrl }),
      });

      if (!response.ok) throw new Error("更新失败");

      toast.success("图片已更新");
      setWatchId("");
      setImageUrl("");
      setUpdateStatus("success");
      utils.watches.search.invalidate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "更新失败";
      toast.error(message);
      setUpdateStatus("error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("上传失败");

      const data = await response.json();
      setImageUrl(data.url);
      toast.success("图片已上传");
    } catch (error) {
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">图片管理</h1>
          <p className="text-muted-foreground">
            为手表添加或更新图片
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 通过URL添加图片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                通过URL添加图片
              </CardTitle>
              <CardDescription>
                输入手表ID和图片URL来更新图片
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="watchId">手表ID</Label>
                <Input
                  id="watchId"
                  type="number"
                  placeholder="例如: 2818"
                  value={watchId}
                  onChange={(e) => setWatchId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">图片URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/watch.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              {imageUrl && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground mb-2">预览:</p>
                  <img
                    src={imageUrl}
                    alt="预览"
                    className="w-full h-48 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400?text=Invalid+URL";
                    }}
                  />
                </div>
              )}
              <Button
                onClick={handleUpdateImage}
                disabled={updateStatus === "loading" || !watchId || !imageUrl}
                className="w-full"
              >
                {updateStatus === "loading" ? "更新中..." : "更新图片"}
              </Button>
            </CardContent>
          </Card>

          {/* 上传本地图片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                上传本地图片
              </CardTitle>
              <CardDescription>
                从本地上传图片文件（最大5MB）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="watchIdUpload">手表ID</Label>
                <Input
                  id="watchIdUpload"
                  type="number"
                  placeholder="例如: 2818"
                  value={watchId}
                  onChange={(e) => setWatchId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fileUpload">选择图片</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground">上传中...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 搜索手表 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              搜索手表
            </CardTitle>
            <CardDescription>
              搜索手表以获取ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="搜索手表名称、品牌或型号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            {searchResults && searchResults.watches.length > 0 && (
              <div className="space-y-2">
                {searchResults.watches.map((watch) => (
                  <div
                    key={watch.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => setWatchId(watch.id.toString())}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {watch.brand} {watch.name || `手表 #${watch.id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {watch.id} | 型号: {watch.referenceNumber || "未知"}
                      </p>
                    </div>
                    {watch.imageUrl && (
                      <img
                        src={watch.imageUrl}
                        alt={watch.name || ""}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 批量导入说明 */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>批量导入图片</CardTitle>
            <CardDescription>
              如需批量导入大量图片，请使用以下脚本
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
              {`# 批量上传图片脚本
cd /home/ubuntu/watch-database
python3 scripts/upload_watch_images.py

# 或者使用 CSV 文件批量导入
# CSV 格式: watch_id,image_url
python3 scripts/import_images_csv.py images.csv`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

