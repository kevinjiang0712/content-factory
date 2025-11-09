'use client'

import { useState } from 'react'

export default function InitDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const initializeDatabase = async () => {
    setIsLoading(true)
    setMessage('正在初始化数据库...')

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ 初始化失败: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ 初始化失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          数据库初始化
        </h1>

        <div className="mb-6">
          <p className="text-gray-600 text-center mb-4">
            如果您的应用显示"获取配置失败"错误，可能是 Supabase 数据库还没有初始化数据。
          </p>
          <p className="text-gray-600 text-center">
            点击下面的按钮来初始化数据库，添加默认的 AI 配置。
          </p>
        </div>

        <button
          onClick={initializeDatabase}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '初始化中...' : '初始化数据库'}
        </button>

        {message && (
          <div className="mt-4 p-3 rounded-md bg-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {message}
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            返回控制台
          </a>
        </div>
      </div>
    </div>
  )
}