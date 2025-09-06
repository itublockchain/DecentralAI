'use client'

import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { user } = useDynamicContext()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Giriş Yap
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Google hesabınızla veya cüzdanınızla giriş yapın
          </p>
        </div>
        
        <div className="mt-8">
          <DynamicWidget />
        </div>
      </div>
    </div>
  )
}