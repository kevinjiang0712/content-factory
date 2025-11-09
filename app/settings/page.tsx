"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Lock, Palette, Globe, Save } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              系统设置
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              个性化你的工作台
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <User className="h-4 w-4 mr-2" />
                个人资料
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Bell className="h-4 w-4 mr-2" />
                通知设置
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                安全隐私
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Palette className="h-4 w-4 mr-2" />
                外观
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-2 border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-2xl">
                        张三
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        上传新头像
                      </Button>
                      <p className="text-xs text-slate-500">
                        支持 JPG、PNG 格式，最大 2MB
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">用户名</label>
                      <Input
                        defaultValue="张三"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">邮箱</label>
                      <Input
                        type="email"
                        defaultValue="zhangsan@example.com"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">手机号</label>
                      <Input
                        type="tel"
                        defaultValue="138****5678"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">职位</label>
                      <Input
                        defaultValue="内容运营"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">个人简介</label>
                    <textarea
                      rows={4}
                      defaultValue="热爱内容创作，专注新媒体运营"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6">
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    通知偏好
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">内容发布成功</p>
                        <p className="text-sm text-slate-500">
                          当内容成功发布到社交媒体时通知我
                        </p>
                      </div>
                      <Checkbox
                        defaultChecked
                        className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                      />
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="flex items-start justify-between py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">数据报告</p>
                        <p className="text-sm text-slate-500">
                          每周发送内容表现数据报告
                        </p>
                      </div>
                      <Checkbox
                        defaultChecked
                        className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                      />
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="flex items-start justify-between py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">系统更新</p>
                        <p className="text-sm text-slate-500">
                          新功能和系统更新的通知
                        </p>
                      </div>
                      <Checkbox
                        className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                      />
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="flex items-start justify-between py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">营销推广</p>
                        <p className="text-sm text-slate-500">
                          接收产品优惠和营销活动信息
                        </p>
                      </div>
                      <Checkbox
                        className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6">
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    密码设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">当前密码</label>
                      <Input
                        type="password"
                        placeholder="输入当前密码"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">新密码</label>
                      <Input
                        type="password"
                        placeholder="输入新密码"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700">确认新密码</label>
                      <Input
                        type="password"
                        placeholder="再次输入新密码"
                        className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6">
                      更新密码
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    两步验证
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    为你的账号增加额外的安全保护
                  </p>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    启用两步验证
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    主题设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">主题模式</label>
                    <Select defaultValue="light">
                      <SelectTrigger className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">浅色模式</SelectItem>
                        <SelectItem value="dark">深色模式</SelectItem>
                        <SelectItem value="auto">跟随系统</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">语言</label>
                    <Select defaultValue="zh-CN">
                      <SelectTrigger className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="zh-TW">繁體中文</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">字体大小</label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">小</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="large">大</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6">
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
