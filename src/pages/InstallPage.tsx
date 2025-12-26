import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, PlusSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function InstallPage() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log("App installed successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">安装 WeiRuan News</CardTitle>
          <CardDescription>
            将应用安装到主屏幕，享受更快速、更流畅的阅读体验
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-muted-foreground">应用已安装到您的设备</p>
              <Button asChild className="w-full">
                <Link to="/">返回首页</Link>
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                在 iOS 设备上安装应用：
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Share className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">1. 点击分享按钮</p>
                    <p className="text-xs text-muted-foreground">在 Safari 浏览器底部找到分享图标</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">2. 添加到主屏幕</p>
                    <p className="text-xs text-muted-foreground">在分享菜单中选择"添加到主屏幕"</p>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">返回首页</Link>
              </Button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>离线阅读支持</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>更快的加载速度</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>主屏幕快捷访问</span>
                </div>
              </div>
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="mr-2 h-4 w-4" />
                安装应用
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">稍后再说</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                您的浏览器不支持应用安装，或应用已经安装。请使用 Chrome、Edge 或 Safari 浏览器访问。
              </p>
              <Button asChild className="w-full">
                <Link to="/">返回首页</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
