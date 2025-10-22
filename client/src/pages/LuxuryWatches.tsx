import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const luxuryWatches = [
  {
    brand: "Rolex",
    model: "Submariner",
    description: "标志性的潜水腕表，黑色表盘配备夜光刻度，旋转表圈，不锈钢表壳和表链。",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/hIVEsDMSrdILvLsA.png",
    priceRange: "¥60,000 - ¥90,000"
  },
  {
    brand: "Audemars Piguet",
    model: "Royal Oak",
    description: "标志性的八角形表圈，蓝色 Tapisserie 格纹表盘，一体式不锈钢表链。",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/vRhLRvGTLIpAshXY.png",
    priceRange: "¥150,000 - ¥300,000"
  },
  {
    brand: "Patek Philippe",
    model: "Nautilus",
    description: "蓝色横向浮雕图案表盘，舷窗造型不锈钢表壳，一体式表链。",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/OrULfRpBNwdOOQTK.png",
    priceRange: "¥200,000 - ¥500,000"
  },
  {
    brand: "Omega",
    model: "Speedmaster",
    description: "登月表，黑色表盘配备三个计时小表盘，测速表圈，不锈钢表壳和表链。",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/usaSCYkidUXpZaCo.png",
    priceRange: "¥40,000 - ¥70,000"
  },
  {
    brand: "Cartier",
    model: "Santos",
    description: "方形表壳配备外露螺丝，白色表盘配罗马数字，蓝钢剑形指针，精钢与黄金表链。",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/UseriqYGxDLOwjpB.png",
    priceRange: "¥50,000 - ¥100,000"
  }
];

export default function LuxuryWatches() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
        <div className="container">
          <h1 className="text-5xl font-bold mb-4">顶级奢华腕表</h1>
          <p className="text-xl text-slate-300">探索世界顶级制表品牌的经典之作</p>
        </div>
      </div>

      {/* Watches Grid */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {luxuryWatches.map((watch, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-white p-8 flex items-center justify-center">
                <img 
                  src={watch.imageUrl} 
                  alt={`${watch.brand} ${watch.model}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                    {watch.brand}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    奢侈品
                  </span>
                </div>
                <CardTitle className="text-2xl">{watch.model}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {watch.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-slate-500">参考价格</span>
                  <span className="text-lg font-bold text-slate-900">{watch.priceRange}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">关于顶级腕表</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5</div>
              <div className="text-slate-600">顶级品牌</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">8,000+</div>
              <div className="text-slate-600">数据库中的奢侈品型号</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">实时</div>
              <div className="text-slate-600">市场价格追踪</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

