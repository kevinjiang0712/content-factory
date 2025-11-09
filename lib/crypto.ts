import crypto from "crypto"

/**
 * API Key 加密/解密模块
 * 使用 AES-256-CBC 算法
 */

// 从环境变量获取加密密钥，如果没有则生成一个默认的（不安全，仅用于开发）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-for-development-only-32"
const IV_LENGTH = 16 // AES block size

// 确保密钥长度为 32 字节（256位）
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0")
  return Buffer.from(key)
}

/**
 * 加密 API Key
 * @param apiKey 原始 API Key
 * @returns 加密后的字符串（格式：iv:encryptedData）
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv)

    let encrypted = cipher.update(apiKey, "utf8", "hex")
    encrypted += cipher.final("hex")

    // 返回 iv 和加密数据的组合，用冒号分隔
    return `${iv.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("加密失败:", error)
    throw new Error("API Key 加密失败")
  }
}

/**
 * 解密 API Key
 * @param encrypted 加密后的字符串（格式：iv:encryptedData）
 * @returns 原始 API Key
 */
export function decryptApiKey(encrypted: string): string {
  try {
    const parts = encrypted.split(":")
    if (parts.length !== 2) {
      throw new Error("加密数据格式错误")
    }

    const iv = Buffer.from(parts[0], "hex")
    const encryptedData = parts[1]

    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv)

    let decrypted = decipher.update(encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("解密失败:", error)
    throw new Error("API Key 解密失败")
  }
}

/**
 * 遮罩 API Key（用于前端显示）
 * @param apiKey API Key
 * @returns 遮罩后的字符串（如：sk-or-v1-abc...xyz）
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return "****"
  }

  const start = apiKey.slice(0, 10)
  const end = apiKey.slice(-4)
  return `${start}...${end}`
}

/**
 * 生成随机加密密钥（用于初始化）
 * @returns 32字节的随机字符串
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex").slice(0, 32)
}
