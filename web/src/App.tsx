import { Check, Copy, Hash, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

type Algorithm = 'argon2' | 'pbkdf2' | 'scrypt' | 'bcrypt'

interface AlgorithmInfo {
  name: string
  description: string
  color: string
}

const algorithms: Record<Algorithm, AlgorithmInfo> = {
  argon2: {
    name: 'Argon2',
    description: '2015年密码哈希竞赛冠军，抵抗GPU和ASIC攻击',
    color: 'bg-blue-500',
  },
  pbkdf2: {
    name: 'PBKDF2',
    description: '广泛支持的标准算法，适合兼容性要求高的场景',
    color: 'bg-emerald-500',
  },
  scrypt: {
    name: 'scrypt',
    description: '内存硬函数，对硬件攻击有良好抵抗力',
    color: 'bg-amber-500',
  },
  bcrypt: {
    name: 'bcrypt',
    description: '经典密码哈希算法，久经考验安全可靠',
    color: 'bg-rose-500',
  },
}

// 模拟哈希函数（浏览器端演示）
async function hashPassword(password: string, algorithm: Algorithm): Promise<string> {
  const response = await fetch('/api/v1/hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, algorithm })
        });
        
  const data = await response.json();
  return data.hashed
}

// 模拟验证函数
async function verifyPassword(password: string, hashed: string): Promise<{ valid: boolean; algorithm: Algorithm | null }> {
  const response = await fetch('/api/v1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, hashed })
        });
        
  const { valid } = await response.json();
  
  return { valid: valid, algorithm: null }
}

function App() {
  const [mode, setMode] = useState<'hash' | 'verify'>('hash')
  const [password, setPassword] = useState('')
  const [algorithm, setAlgorithm] = useState<Algorithm>('argon2')
  const [hashResult, setHashResult] = useState('')
  const [hashInput, setHashInput] = useState('')
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; algorithm: Algorithm | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleHash = async () => {
    if (!password) return
    setLoading(true)
    try {
      const result = await hashPassword(password, algorithm)
      setHashResult(result)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!password || !hashInput) return
    setLoading(true)
    try {
      const result = await verifyPassword(password, hashInput)
      setVerifyResult(result)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(hashResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">密码哈希工具</h1>
          <p className="text-muted-foreground">安全地哈希和验证密码</p>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-8">
          <button
            onClick={() => {
              setMode('hash')
              setVerifyResult(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'hash'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4" />
            生成哈希
          </button>
          <button
            onClick={() => {
              setMode('verify')
              setHashResult('')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'verify'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            验证密码
          </button>
        </div>

        {/* 主卡片 */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          {mode === 'hash' ? (
            <>
              {/* 算法选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  选择哈希算法
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(algorithms) as Algorithm[]).map((alg) => (
                    <button
                      key={alg}
                      onClick={() => setAlgorithm(alg)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        algorithm === alg
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${algorithms[alg].color}`} />
                        <span className="font-semibold text-foreground">{algorithms[alg].name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {algorithms[alg].description}
                      </p>
                      {algorithm === alg && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 密码输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  输入密码
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入要哈希的密码..."
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleHash}
                disabled={!password || loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    生成哈希
                  </>
                )}
              </button>

              {/* 结果显示 */}
              {hashResult && (
                <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">哈希结果</span>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block text-sm text-muted-foreground break-all font-mono bg-background p-3 rounded-lg">
                    {hashResult}
                  </code>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 密码输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  输入密码
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入要验证的密码..."
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 哈希输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  输入哈希值
                </label>
                <textarea
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="粘贴哈希值..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none font-mono text-sm"
                />
              </div>

              {/* 验证按钮 */}
              <button
                onClick={handleVerify}
                disabled={!password || !hashInput || loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    验证密码
                  </>
                )}
              </button>

              {/* 验证结果 */}
              {verifyResult && (
                <div
                  className={`mt-6 p-4 rounded-xl border ${
                    verifyResult.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {verifyResult.valid ? (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-medium">验证成功！</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">无法识别的哈希格式</span>
                      </>
                    )}
                  </div>
                  {verifyResult.valid && verifyResult.algorithm && (
                    <p className="mt-1 text-sm opacity-80">
                      检测到算法: {algorithms[verifyResult.algorithm].name}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部说明 */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          注意：这是一个前端演示工具，实际生产环境中应在服务端进行密码哈希处理
        </p>
      </div>
    </div>
  )
}

export default App
