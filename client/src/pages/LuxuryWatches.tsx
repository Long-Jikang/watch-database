import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp } from "lucide-react";

// 顶级品牌经典型号数据
const luxuryWatches = [
  {
    id: 1,
    brand: "Audemars Piguet",
    model: "Royal Oak 15400",
    referenceNumber: "15400ST.OO.1220ST.03",
    description: "爱彼皇家橡树系列的标志性表款，采用标志性的八角形表圈和八颗六角形螺丝，蓝色'Grande Tapisserie'大格纹表盘，不锈钢一体式表链。自1972年问世以来，Royal Oak一直是奢华运动手表的代表作。",
    price: "¥280,000 - ¥350,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/uESPTYJnFLNbokMq.png",
    salesVolume: "约 50,000 枚/年",
    marketShare: "4%"
  },
  {
    id: 2,
    brand: "Audemars Piguet",
    model: "Royal Oak Offshore",
    referenceNumber: "26470ST.OO.A101CR.01",
    description: "皇家橡树离岸型计时码表，44mm大尺寸运动表壳，黑色陶瓷表圈，黑色'Méga Tapisserie'超大格纹表盘，橙色点缀，橡胶表带。这是一款专为极限运动设计的豪华运动手表。",
    price: "¥320,000 - ¥450,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/wdvFkmxvXFcDeIZr.png",
    salesVolume: "约 50,000 枚/年",
    marketShare: "4%"
  },
  {
    id: 3,
    brand: "Patek Philippe",
    model: "Nautilus 5711",
    referenceNumber: "5711/1A-010",
    description: "百达翡丽鹦鹉螺系列的经典之作，优雅的圆角八角形表壳，蓝色水平压纹表盘，不锈钢一体式表链。这是世界上最受追捧的奢华运动手表之一，二级市场价格远超公价。",
    price: "¥450,000 - ¥800,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/qxZTSnTPnHtbtGLu.png",
    salesVolume: "约 72,000 枚/年",
    marketShare: "3.5%"
  },
  {
    id: 4,
    brand: "Patek Philippe",
    model: "Aquanaut 5167",
    referenceNumber: "5167A-001",
    description: "百达翡丽Aquanaut系列，圆角八角形表壳，黑色压纹表盘带棋盘格纹，黑色复合材料表带带压纹。这是一款年轻化的奢华运动手表，比Nautilus更具现代感。",
    price: "¥280,000 - ¥400,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/fawzFvmWqbVJfodK.png",
    salesVolume: "约 72,000 枚/年",
    marketShare: "3.5%"
  },
  {
    id: 5,
    brand: "Richard Mille",
    model: "RM 011 Felipe Massa",
    referenceNumber: "RM 011",
    description: "理查德·米勒RM 011 Felipe Massa，酒桶形镂空表壳，可见机芯和钛合金桥板，黑色橡胶表带。这是一款超高端技术运动手表，采用航空航天材料，极致轻量化设计。",
    price: "¥1,800,000 - ¥2,500,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/lUsFMoIcyfVTNldl.png",
    salesVolume: "约 5,000-6,000 枚/年",
    marketShare: "3%"
  },
  {
    id: 6,
    brand: "Rolex",
    model: "Submariner",
    referenceNumber: "126610LN",
    description: "劳力士潜航者型，标志性的潜水手表，黑色陶质表圈，Cerachrom字圈，Oyster表带。这是世界上最受欢迎的奢华运动手表，也是劳力士的标志性产品。",
    price: "¥90,000 - ¥120,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/hIVEsDMSrdILvLsA.png",
    salesVolume: "约 1,176,000 枚/年",
    marketShare: "32%"
  },
  {
    id: 7,
    brand: "Omega",
    model: "Speedmaster Professional",
    referenceNumber: "310.30.42.50.01.001",
    description: "欧米茄超霸专业计时表，'月球表'，黑色表盘，测速计表圈，不锈钢表链。这是唯一登上月球的手表，具有传奇历史。",
    price: "¥50,000 - ¥70,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/usaSCYkidUXpZaCo.png",
    salesVolume: "约 250 亿瑞郎/年",
    marketShare: "5%"
  },
  {
    id: 8,
    brand: "Cartier",
    model: "Santos",
    referenceNumber: "WSSA0029",
    description: "卡地亚山度士系列，方形表壳，罗马数字时标，蓝宝石表冠，不锈钢表链。这是世界上第一款现代腕表，由路易·卡地亚于1904年为飞行员Alberto Santos-Dumont设计。",
    price: "¥60,000 - ¥90,000",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/89369555/UseriqYGxDLOwjpB.png",
    salesVolume: "约 300 亿瑞郎/年",
    marketShare: "6%"
  }
];

// 品牌销量排名
const brandRankings = [
  { rank: 1, brand: "Rolex", sales: "105.83 亿瑞郎", marketShare: "32%", growth: "+4.8%" },
  { rank: 2, brand: "Cartier", sales: "约 30 亿瑞郎", marketShare: "6%", growth: "+3.2%" },
  { rank: 3, brand: "Omega", sales: "约 25 亿瑞郎", marketShare: "5%", growth: "+2.1%" },
  { rank: 4, brand: "Audemars Piguet", sales: "约 20 亿瑞郎", marketShare: "4%", growth: "+5.5%" },
  { rank: 5, brand: "Patek Philippe", sales: "约 18 亿瑞郎", marketShare: "3.5%", growth: "+4.2%" },
  { rank: 6, brand: "Richard Mille", sales: "约 15 亿瑞郎", marketShare: "3%", growth: "+8.1%" },
  { rank: 7, brand: "Longines", sales: "约 20 亿瑞郎", marketShare: "4%", growth: "+1.5%" },
  { rank: 8, brand: "Vacheron Constantin", sales: "约 10 亿瑞郎", marketShare: "2%", growth: "+3.8%" },
  { rank: 9, brand: "Breitling", sales: "约 8 亿瑞郎", marketShare: "1.5%", growth: "+2.3%" },
  { rank: 10, brand: "Tissot", sales: "约 8 亿瑞郎", marketShare: "1.5%", growth: "+1.2%" }
];

export default function LuxuryWatches() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">顶级奢华腕表</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            瑞士顶级手表品牌
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            探索世界顶级制表品牌的经典之作，感受瑞士制表工艺的极致魅力
          </p>
        </div>
      </section>

      {/* Brand Rankings */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-8">2024 年瑞士手表品牌销量排名</h2>
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">排名</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">品牌</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">年销售额</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">市场份额</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">同比增长</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {brandRankings.map((brand) => (
                      <tr key={brand.rank} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <Badge variant={brand.rank <= 3 ? "default" : "secondary"}>
                            #{brand.rank}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium">{brand.brand}</td>
                        <td className="px-6 py-4 text-right">{brand.sales}</td>
                        <td className="px-6 py-4 text-right">{brand.marketShare}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            {brand.growth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Luxury Watches Grid */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-8">经典表款</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {luxuryWatches.map((watch) => (
            <Card key={watch.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
                <img
                  src={watch.imageUrl}
                  alt={`${watch.brand} ${watch.model}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline">{watch.brand}</Badge>
                  <Badge variant="secondary">{watch.marketShare} 市场份额</Badge>
                </div>
                <CardTitle className="text-xl">{watch.model}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {watch.referenceNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {watch.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">参考价格</span>
                    <span className="font-semibold text-primary">{watch.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">年销量</span>
                    <span className="text-sm font-medium">{watch.salesVolume}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Market Insights */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">市场洞察</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">四大巨头主导市场</h3>
                  <p className="text-sm text-muted-foreground">
                    Rolex、Patek Philippe、Audemars Piguet 和 Richard Mille 四大品牌控制了 47% 的市场份额，其中劳力士单独占据 32%。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">高端市场持续增长</h3>
                  <p className="text-sm text-muted-foreground">
                    AP、PP、RM 等超高端品牌增长强劲，Richard Mille 同比增长 8.1%，显示出高净值人群对超奢侈品的持续需求。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">运动手表成为主流</h3>
                  <p className="text-sm text-muted-foreground">
                    Royal Oak、Nautilus、Submariner 等奢华运动手表成为市场热点，二级市场价格持续走高。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">独立制表商崛起</h3>
                  <p className="text-sm text-muted-foreground">
                    AP、PP、RM 等独立制表商凭借独特设计和限量生产策略，成功打造了稀缺性和收藏价值。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

