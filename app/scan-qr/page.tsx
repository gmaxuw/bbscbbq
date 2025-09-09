/**
 * 📱 QR CODE SCANNER PAGE
 * 
 * This page provides QR code scanning functionality for customers
 * to scan order verification QR codes using their phone camera.
 * 
 * Features:
 * - Camera access for QR code scanning
 * - Real-time QR code detection
 * - Automatic navigation to verify-order page
 * - Fallback manual input option
 * - Mobile-optimized interface
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Camera, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scannedData, setScannedData] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  useEffect(() => {
    startScanning()
    return () => stopScanning()
  }, [])

  const startScanning = async () => {
    try {
      setError('')
      setIsScanning(true)

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start QR code detection
      startQRDetection()
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please allow camera access to scan QR codes.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const startQRDetection = async () => {
    // Import jsQR dynamically to avoid SSR issues
    let jsQR
    try {
      jsQR = (await import('jsqr')).default
    } catch (err) {
      console.error('Failed to load jsQR library:', err)
      setError('QR code detection library not available. Please use manual input.')
      return
    }

    const detectQR = () => {
      if (!videoRef.current || !isScanning || !jsQR) return

      const video = videoRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Use jsQR for proper QR code detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        console.log('QR Code detected:', code.data)
        handleQRCodeDetected(code.data)
        return
      }
      
      // Continue scanning
      setTimeout(detectQR, 100)
    }

    detectQR()
  }

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return

    // Extract order ID or reference from manual input
    const orderId = manualInput.trim()
    setScannedData(orderId)
    
    // Navigate to verify-order page
    router.push(`/verify-order?ref=${orderId}`)
  }

  const handleQRCodeDetected = (data: string) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(data)
      
      if (qrData.type === 'order_verification' && qrData.order_id) {
        setScannedData(qrData.order_id)
        router.push(`/verify-order?order=${qrData.order_id}`)
      } else if (qrData.type === 'order' && qrData.reference) {
        setScannedData(qrData.reference)
        router.push(`/verify-order?ref=${qrData.reference}`)
      }
    } catch (err) {
      // If not JSON, treat as direct reference
      setScannedData(data)
      router.push(`/verify-order?ref=${data}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="QR Scanner" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <QrCode className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setShowManualInput(true)}
                className="bbq-button-primary"
              >
                Enter Order Reference Manually
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Camera Preview */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-lays-dark-red border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <QrCode className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Position QR code here</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Scan</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. Point your camera at the QR code on your order receipt</p>
                  <p>2. Make sure the QR code is clearly visible in the frame</p>
                  <p>3. Hold steady until the code is detected</p>
                </div>
                
                <button
                  onClick={() => setShowManualInput(true)}
                  className="mt-4 text-sm text-lays-dark-red hover:underline"
                >
                  Can't scan? Enter manually
                </button>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Enter Order Reference</h4>
              <p className="text-sm text-gray-600 mb-3">
                Enter your order number or reference code from your receipt
              </p>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter order number or reference"
                className="bbq-input w-full mb-3"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="bbq-button-primary flex-1"
                >
                  Verify Order
                </button>
                <button
                  onClick={() => setShowManualInput(false)}
                  className="bbq-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {scannedData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800">
                  QR code scanned successfully! Redirecting to order verification...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
