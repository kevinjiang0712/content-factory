"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"
import { Plus, Settings, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface PublishPlatform {
  id: number
  platform: 'wechat' | 'xiaohongshu'
  platform_name: string
  app_id?: string
  app_secret?: string
  is_active: number
  created_at: number
}

interface PublishRecord {
  id: number
  content_id: number
  platform: string
  platform_post_id?: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  error_message?: string
  published_url?: string
  content_title?: string
  created_at: number
}

export default function PublishSettingsPage() {
  const [platforms, setPlatforms] = useState<PublishPlatform[]>([])
  const [records, setRecords] = useState<PublishRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<PublishPlatform | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    platform: 'wechat' as 'wechat' | 'xiaohongshu',
    platform_name: '',
    app_id: '',
    app_secret: '',
  })

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 加载平台配置
      const platformsRes = await fetch("/api/publish/config")
      const platformsData = await platformsRes.json()
      if (platformsData.success) {
        setPlatforms(platformsData.data)
      }

      // 加载发布记录
      const recordsRes = await fetch("/api/publish/records")
      const recordsData = await recordsRes.json()
      if (recordsData.success) {
        setRecords(recordsData.data)
      }
    } catch (error) {
      console.error("加载数据失败:", error)
      toast.error("加载数据失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 保存平台配置
  const handleSavePlatform = async () => {
    if (!formData.platform_name || !formData.app_id || !formData.app_secret) {
      toast.error("请填写所有必填字段")
      return
    }

    try {
      const response = await fetch("/api/publish/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("平台配置保存成功")
        setShowConfigDialog(false)
        resetForm()
        loadData()
      } else {
        toast.error(data.error || "保存失败")
      }
    } catch (error) {
      console.error("保存平台配置失败:", error)
      toast.error("保存失败")
    }
  }

  // 更新平台状态
  const handleTogglePlatform = async (platform: PublishPlatform) => {
    try {
      const response = await fetch("/api/publish/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: platform.id,
          is_active: platform.is_active ? 0 : 1
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("平台状态更新成功")
        loadData()
      } else {
        toast.error(data.error || "更新失败")
      }
    } catch (error) {
      console.error("更新平台状态失败:", error)
      toast.error("更新失败")
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      platform: 'wechat',
      platform_name: '',
      app_id: '',
      app_secret: '',
    })
    setEditingPlatform(null)
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '发布成功'
      case 'failed':
        return '发布失败'
      case 'pending':
        return '发布中'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  // 获取平台标签
  const getPlatformBadge = (platform: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      wechat: { label: '微信公众号', color: 'bg-green-100 text-green-800' },
      xiaohongshu: { label: '小红书', color: 'bg-pink-100 text-pink-800' }
    }
    const style = styles[platform] || { label: platform, color: 'bg-gray-100 text-gray-800' }
    return <Badge className={style.color}>{style.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">发布管理</h1>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platforms">平台配置</TabsTrigger>
          <TabsTrigger value="records">发布记录</TabsTrigger>
          <TabsTrigger value="guide">使用指南</TabsTrigger>
        </TabsList>

        {/* 平台配置 */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">发布平台配置</h2>
            <Button onClick={() => setShowConfigDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加平台
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>已配置的平台</CardTitle>
            </CardHeader>
            <CardContent>
              {platforms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>平台</TableHead>
                      <TableHead>应用ID</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platforms.map((platform) => (
                      <TableRow key={platform.id}>
                        <TableCell>{getPlatformBadge(platform.platform)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {platform.app_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={platform.is_active === 1}
                              onCheckedChange={() => handleTogglePlatform(platform)}
                            />
                            <span className="text-sm">
                              {platform.is_active ? '启用' : '禁用'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(platform.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">尚未配置任何发布平台</p>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加第一个平台
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 发布记录 */}
        <TabsContent value="records" className="space-y-6">
          <h2 className="text-xl font-semibold">发布记录</h2>

          <Card>
            <CardHeader>
              <CardTitle>最近的发布记录</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>内容</TableHead>
                      <TableHead>平台</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="max-w-xs truncate">
                          {record.content_title || '无标题'}
                        </TableCell>
                        <TableCell>{getPlatformBadge(record.platform)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className="text-sm">
                              {getStatusText(record.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(record.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {record.published_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={record.published_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                查看
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无发布记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 使用指南 */}
        <TabsContent value="guide" className="space-y-6">
          <h2 className="text-xl font-semibold">使用指南</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">微信公众号配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>个人账号限制</AlertTitle>
                  <AlertDescription>
                    个人订阅号只能创建草稿，需要手动登录微信公众平台发布文章。
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">配置步骤：</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                    <li>登录微信公众平台 (mp.weixin.qq.com)</li>
                    <li>进入"开发" → "基本配置"</li>
                    <li>获取 AppID 和 AppSecret</li>
                    <li>在"IP白名单"中添加服务器IP：103.219.195.219</li>
                    <li>在本页面添加平台配置</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">使用流程：</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                    <li>在内容创建页面创作文章</li>
                    <li>点击"一键发布"按钮</li>
                    <li>选择"微信公众号"</li>
                    <li>系统自动创建草稿</li>
                    <li>登录微信公众平台手动发布</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-700">小红书发布</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>手动发布</AlertTitle>
                  <AlertDescription>
                    小红书暂未开放API，系统会格式化内容并生成发布指南。
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">内容格式化：</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                    <li>自动调整标题长度（最多20字）</li>
                    <li>添加小红书风格表情符号</li>
                    <li>生成相关话题标签</li>
                    <li>优化段落格式</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">发布步骤：</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                    <li>系统生成格式化内容</li>
                    <li>下载相关图片</li>
                    <li>打开小红书APP</li>
                    <li>复制格式化内容</li>
                    <li>上传图片并添加标签</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>定时发布</AlertTitle>
            <AlertDescription>
              系统支持定时发布功能。在内容创建页面可以设置发布时间，系统会在指定时间自动执行发布流程。
              微信个人账号仍需手动确认发布。
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* 配置对话框 */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加发布平台</DialogTitle>
            <DialogDescription>
              配置发布平台的基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">平台类型</Label>
              <Select
                value={formData.platform}
                onValueChange={(value: 'wechat' | 'xiaohongshu') =>
                  setFormData({ ...formData, platform: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择平台类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wechat">微信公众号</SelectItem>
                  <SelectItem value="xiaohongshu">小红书</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform_name">平台名称</Label>
              <Input
                id="platform_name"
                value={formData.platform_name}
                onChange={(e) =>
                  setFormData({ ...formData, platform_name: e.target.value })
                }
                placeholder="例如：我的公众号"
              />
            </div>

            <div>
              <Label htmlFor="app_id">App ID</Label>
              <Input
                id="app_id"
                value={formData.app_id}
                onChange={(e) =>
                  setFormData({ ...formData, app_id: e.target.value })
                }
                placeholder="平台应用ID"
              />
            </div>

            <div>
              <Label htmlFor="app_secret">App Secret</Label>
              <Input
                id="app_secret"
                type="password"
                value={formData.app_secret}
                onChange={(e) =>
                  setFormData({ ...formData, app_secret: e.target.value })
                }
                placeholder="平台应用密钥"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSavePlatform}>
              保存配置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
