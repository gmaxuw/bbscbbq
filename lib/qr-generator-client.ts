/**
 * QR Code Generator - Client Side Only
 * This file handles QR code generation only in the browser environment
 */

// Generate QR code data URL (client-side only)
export async function generateQRCodeClient(referenceNumber: string): Promise<string> {
  try {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('QR code generation requires browser environment')
    }
    
    // Try to import qrcode dynamically
    let QRCode
    try {
      QRCode = (await import('qrcode')).default
    } catch (importError) {
      console.warn('QRCode library not available, using fallback:', importError)
      throw new Error('QRCode library not available')
    }
    
    const qrData = {
      type: 'order',
      reference: referenceNumber,
      timestamp: new Date().toISOString(),
      url: `${window.location.origin}/verify-order?ref=${referenceNumber}`
    }
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 200,
      margin: 2,
      color: {
        dark: '#1F2937', // Dark gray
        light: '#FFFFFF'  // White background
      }
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Fallback to a simple visual representation
    return generateFallbackQRCode(referenceNumber, 'Order Reference')
  }
}

// Generate QR code for order verification (client-side only)
export async function generateOrderQRCodeClient(orderNumber: string, orderId: string): Promise<string> {
  try {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('QR code generation requires browser environment')
    }
    
    // Try to import qrcode dynamically
    let QRCode
    try {
      QRCode = (await import('qrcode')).default
    } catch (importError) {
      console.warn('QRCode library not available, using fallback:', importError)
      throw new Error('QRCode library not available')
    }
    
    const qrData = {
      type: 'order_verification',
      order_number: orderNumber,
      order_id: orderId,
      timestamp: new Date().toISOString(),
      verification_url: `${window.location.origin}/verify-order?order=${orderId}`
    }
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 150,
      margin: 1,
      color: {
        dark: '#DC2626', // Red color for BBQ theme
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating order QR code:', error)
    // Fallback to a simple visual representation
    return generateFallbackQRCode(orderNumber, 'Order Verification')
  }
}

// Generate a fallback visual representation when QR library is not available
function generateFallbackQRCode(identifier: string, type: string): string {
  // Create a simple visual QR-like representation using canvas
  const canvas = document.createElement('canvas')
  canvas.width = 150
  canvas.height = 150
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    // If canvas is not available, return a data URL with text
    const text = `${type}\n${identifier}\n${new Date().toLocaleString()}`
    return `data:text/plain;base64,${btoa(text)}`
  }
  
  // Create a simple pattern that looks like a QR code
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 150, 150)
  
  ctx.fillStyle = '#DC2626'
  const cellSize = 5
  const cells = 30
  
  // Create a pattern based on the identifier
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const hash = (identifier.charCodeAt(i % identifier.length) + j) % 2
      if (hash === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }
  
  // Add corner markers like a real QR code
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(0, 0, cellSize * 7, cellSize * 7)
  ctx.fillRect(0, 0, cellSize * 5, cellSize * 5)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(cellSize, cellSize, cellSize * 3, cellSize * 3)
  
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(canvas.width - cellSize * 7, 0, cellSize * 7, cellSize * 7)
  ctx.fillRect(canvas.width - cellSize * 5, 0, cellSize * 5, cellSize * 5)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(canvas.width - cellSize * 6, cellSize, cellSize * 3, cellSize * 3)
  
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(0, canvas.height - cellSize * 7, cellSize * 7, cellSize * 7)
  ctx.fillRect(0, canvas.height - cellSize * 5, cellSize * 5, cellSize * 5)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(cellSize, canvas.height - cellSize * 6, cellSize * 3, cellSize * 3)
  
  return canvas.toDataURL()
}
