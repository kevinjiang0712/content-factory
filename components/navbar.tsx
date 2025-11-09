"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { CyberLogo } from "@/components/cyber-logo"

const navItems = [
  { name: "工作台", href: "/dashboard" },
  { name: "选题分析", href: "/" },
  { name: "内容管理", href: "/content" },
  { name: "发布管理", href: "/publish" },
  { name: "数据洞察", href: "/analytics" },
  { name: "发布日历", href: "/schedule" },
  { name: "模型管理", href: "/settings/ai-config" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <CyberLogo />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                      pathname === item.href && "bg-slate-100 text-slate-900 font-medium"
                    )}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-slate-100">
                    <Avatar className="h-9 w-9 border border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-sm">张三</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-slate-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900">张三</p>
                    <p className="text-xs leading-none text-slate-500">
                      zhangsan@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem asChild className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  <Link href="/templates">模板库</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  <Link href="/library">素材库</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  <Link href="/publish">发布管理</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem asChild className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  <Link href="/settings">系统设置</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
