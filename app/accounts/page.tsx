"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Check, Settings, RefreshCw, Unlink, AlertCircle } from "lucide-react"

// Mock data
const connectedAccounts = [
  {
    id: 1,
    platform: "微信公众号",
    accountName: "AI超级内容工厂",
    accountId: "@ai_content_factory",
    status: "active",
    followers: 15678,
    lastSync: "5分钟前",
    avatar: "",
  },
  {
    id: 2,
    platform: "小红书",
    accountName: "内容创作者",
    accountId: "@content_creator_123",
    status: "active",
    followers: 23456,
    lastSync: "10分钟前",
    avatar: "",
  },
  {
    id: 3,
    platform: "抖音",
    accountName: "AI创作小助手",
    accountId: "@ai_helper",
    status: "warning",
    followers: 89012,
    lastSync: "2小时前",
    avatar: "",
  },
  {
    id: 4,
    platform: "知乎",
    accountName: "内容创作专家",
    accountId: "@expert_writer",
    status: "active",
    followers: 12345,
    lastSync: "15分钟前",
    avatar: "",
  },
]

const availablePlatforms = [
  {
    name: "微博",
    description: "连接你的微博账号，发布和管理内容",
    icon: "🔵",
  },
  {
    name: "B站",
    description: "连接你的B站账号，管理视频内容",
    icon: "🎬",
  },
  {
    name: "头条号",
    description: "连接你的头条号，发布图文和视频",
    icon: "📰",
  },
]

const statusConfig = {
  active: {
    label: "正常",
    color: "bg-emerald-100 text-emerald-700",
    icon: Check,
  },
  warning: {
    label: "需要重新授权",
    color: "bg-amber-100 text-amber-700",
    icon: AlertCircle,
  },
}

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                社媒账号
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                管理你的社交媒体账号连接
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Connected Accounts */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">已连接账号</h2>
              <p className="text-sm text-slate-500 mt-1">
                {connectedAccounts.length} 个平台已连接
              </p>
            </div>

            <div className="grid gap-6">
              {connectedAccounts.map((account) => {
                const statusInfo = statusConfig[account.status as keyof typeof statusConfig]
                const StatusIcon = statusInfo.icon

                return (
                  <Card
                    key={account.id}
                    className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-14 w-14 border-2 border-slate-200">
                            <AvatarImage src={account.avatar} />
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-lg">
                              {account.platform.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {account.accountName}
                                </h3>
                                <Badge className={`${statusInfo.color} border-0 rounded-full px-3 py-0.5`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                {account.platform} · {account.accountId}
                              </p>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-slate-600">粉丝数：</span>
                                <span className="font-medium text-slate-900">
                                  {account.followers.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-600">最后同步：</span>
                                <span className="text-slate-500">{account.lastSync}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            同步
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            设置
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            解绑
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Available Platforms */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">添加更多平台</h2>
              <p className="text-sm text-slate-500 mt-1">连接更多社交媒体账号</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlatforms.map((platform, index) => (
                <Card
                  key={index}
                  className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{platform.icon}</div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {platform.name}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {platform.description}
                      </p>
                      <Link href="/accounts/connect">
                        <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm group-hover:shadow transition-shadow">
                          <Plus className="h-4 w-4 mr-2" />
                          连接账号
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Usage Tips */}
          <Card className="bg-blue-50 border-blue-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <span className="text-lg">💡</span>
                使用提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>连接账号后，可以直接从平台发布内容到各个社交媒体</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>定期同步账号数据，确保粉丝数和互动数据准确</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>如果账号状态异常，请重新授权以恢复正常使用</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
