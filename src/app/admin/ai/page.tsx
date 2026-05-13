'use client'

import { useState, useRef, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Bot, Send, Loader2, Sparkles, TrendingUp, Users } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { label: 'Business Insights', icon: TrendingUp, action: 'insights', prompt: 'Give me insights on my current business performance.' },
  { label: 'Product Recommendations', icon: Sparkles, action: 'recommendations', prompt: 'What products should I recommend to my top customers?' },
  { label: 'Customer Summary', icon: Users, action: 'chat', prompt: 'Summarise my customer base and any trends you can see.' },
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. Ask me about orders, products, customers, or anything about your store.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string, action = 'chat') {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, message: text }),
      })
      const data = await res.json()
      const reply = data.message || data.insights || data.recommendations || data.error || 'No response'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Check that ANTHROPIC_API_KEY is set.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="AI Assistant">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.label}
              onClick={() => sendMessage(qa.prompt, qa.action)}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <qa.icon className="h-5 w-5 text-blue-500" />
              {qa.label}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: '60vh' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Bot className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-800">AI Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input) }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about your store…"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
