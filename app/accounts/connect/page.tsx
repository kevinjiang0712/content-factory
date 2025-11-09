"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Loader2 } from "lucide-react"

const platforms = [
  {
    id: "wechat",
    name: "微信公众号",
    icon: "📱",
    description: "连接你的微信公众号，一键发布图文内容",
    steps: [
      "扫描二维码登录微信公众平台",
      "授权 AI内容工厂 访问你的公众号",
      "确认授权信息并完成连接",
    ],
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    icon: "📕",
    description: "连接你的小红书账号，发布笔记和图文",
    steps: [
      "使用小红书APP扫描二维码",
      "在APP中确认授权请求",
      "完成账号连接",
    ],
  },
  {
    id: "douyin",
    name: "抖音",
    icon: "🎵",
    description: "连接抖音账号，管理和发布短视频内容",
    steps: [
      "登录抖音开放平台",
      "授权应用访问你的抖音账号",
      "同步账号信息",
    ],
  },
  {
    id: "zhihu",
    name: "知乎",
    icon: "📘",
    description: "连接知乎账号，发布文章和回答问题",
    steps: [
      "登录知乎账号",
      "授权应用访问权限",
      "完成连接配置",
    ],
  },
]

export default function ConnectAccountPage({ searchParams }: { searchParams: { platform?: string } }) {
  const [connecting, setConnecting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const platformId = searchParams.platform || "wechat"
  const platform = platforms.find((p) => p.id === platformId) || platforms[0]

  const handleConnect = () => {
    setConnecting(true)
    // Simulate connection process
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= platform.steps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            window.location.href = "/accounts"
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/accounts">
            <Button variant="ghost" className="mb-4 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回账号列表
            </Button>
          </Link>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              连接账号
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              连接你的社交媒体账号，开始发布内容
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Platform Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">选择平台</h3>
            {platforms.map((p) => (
              <Link key={p.id} href={`/accounts/connect?platform=${p.id}`}>
                <Card
                  className={`cursor-pointer transition-all ${
                    p.id === platformId
                      ? "bg-rose-50 border-rose-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{p.icon}</span>
                      <span
                        className={`font-medium ${
                          p.id === platformId ? "text-rose-900" : "text-slate-700"
                        }`}
                      >
                        {p.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Connection Process */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{platform.icon}</span>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {platform.name}
                  </CardTitle>
                </div>
                <p className="text-sm text-slate-600">{platform.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!connecting ? (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">连接步骤：</h4>
                      <ol className="space-y-3">
                        {platform.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-sm text-slate-600 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {platform.id === "wechat" && (
                      <div className="p-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-slate-200">
                          <span className="text-slate-400">二维码</span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleConnect}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm h-11"
                    >
                      开始连接
                    </Button>
                  </>
                ) : (
                  <div className="py-8 space-y-6">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 text-rose-600 animate-spin mx-auto mb-4" />
                      <p className="text-slate-700 font-medium">正在连接中...</p>
                    </div>

                    <div className="space-y-3">
                      {platform.steps.map((step, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            index <= currentStep
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-slate-50 border border-slate-200"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                              index < currentStep
                                ? "bg-emerald-600 text-white"
                                : index === currentStep
                                ? "bg-rose-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {index < currentStep ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-sm pt-0.5 ${
                              index <= currentStep ? "text-slate-900 font-medium" : "text-slate-500"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>

                    {currentStep >= platform.steps.length - 1 && (
                      <div className="text-center pt-4">
                        <div className="inline-flex items-center gap-2 text-emerald-600">
                          <Check className="h-5 w-5" />
                          <span className="font-medium">连接成功！正在跳转...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-blue-600">ℹ️</span>
                    <p>
                      我们会安全地保存你的授权信息，不会泄露任何账号隐私。你可以随时在账号管理页面解除授权。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
