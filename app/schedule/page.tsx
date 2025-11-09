"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react"

const mockScheduledContent = [
  {
    id: 1,
    title: "AI工具提升创作效率",
    platform: "微信公众号",
    date: "2025-01-20",
    time: "10:00",
  },
  {
    id: 2,
    title: "新媒体运营技巧分享",
    platform: "小红书",
    date: "2025-01-20",
    time: "14:00",
  },
  {
    id: 3,
    title: "内容创作实战案例",
    platform: "抖音",
    date: "2025-01-22",
    time: "18:00",
  },
  {
    id: 4,
    title: "如何打造爆款内容",
    platform: "知乎",
    date: "2025-01-25",
    time: "09:00",
  },
]

export default function SchedulePage() {
  const [currentMonth] = useState(new Date(2025, 0, 1)) // January 2025

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getContentForDate = (day: number) => {
    const dateStr = `2025-01-${String(day).padStart(2, "0")}`
    return mockScheduledContent.filter((content) => content.date === dateStr)
  }

  const days = getDaysInMonth(currentMonth)
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                发布日历
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                规划和管理你的内容发布计划
              </p>
            </div>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
              <Plus className="h-4 w-4 mr-2" />
              添加计划
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Calendar */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  2025年1月
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-slate-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }

                  const contentForDay = getContentForDate(day)
                  const isToday = day === 15 // Mock today as 15th
                  const hasContent = contentForDay.length > 0

                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square p-2 rounded-lg border transition-colors cursor-pointer
                        ${isToday ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:bg-slate-50"}
                        ${hasContent ? "bg-blue-50 border-blue-200" : ""}
                      `}
                    >
                      <div className="text-sm font-medium text-slate-900 mb-1">{day}</div>
                      {contentForDay.length > 0 && (
                        <div className="space-y-1">
                          {contentForDay.map((content) => (
                            <div
                              key={content.id}
                              className="text-xs bg-blue-600 text-white rounded px-1.5 py-0.5 truncate"
                            >
                              {content.time}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                即将发布
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockScheduledContent.map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">{content.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <Badge className="bg-slate-100 text-slate-700 border-0 rounded-full">
                        {content.platform}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{content.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{content.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
