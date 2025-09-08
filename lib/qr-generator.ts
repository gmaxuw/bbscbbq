/**
 * QR Code and Reference Number Generator
 * Generates unique alphanumeric reference numbers and QR codes for orders
 */

// Generate unique alphanumeric reference number
export function generateReferenceNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // Generate 8-character reference number
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36).toUpperCase()
  return `BBQ${result}${timestamp.slice(-4)}`
}

// Generate secure order number with random components
export function generateSecureOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // Generate 6-character random string
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Add current time components for uniqueness
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  
  // Format: YYMMDD-HHMM-XXXXXX (e.g., 250905-1430-A7B2C9)
  return `${year}${month}${day}-${hour}${minute}-${result}`
}

// Generate order number with branch prefix for better organization
export function generateBranchOrderNumber(branchCode: string = 'MAIN'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // Generate 4-character random string
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Add current time components
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  
  // Format: BRANCH-YYMMDD-HHMMSS-XXXX (e.g., MAIN-250905-143025-A7B2)
  return `${branchCode}-${year}${month}${day}-${hour}${minute}${second}-${result}`
}

// Generate QR code data URL
export async function generateQRCode(referenceNumber: string): Promise<string> {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('QR code generation requires browser environment')
    }
    
    // Dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')).default
    
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
    // Fallback to text-based representation
    const qrText = `Order: ${referenceNumber}\nTime: ${new Date().toLocaleString()}`
    return `data:text/plain;base64,${btoa(qrText)}`
  }
}

// Generate QR code for order verification
export async function generateOrderQRCode(orderNumber: string, orderId: string): Promise<string> {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('QR code generation requires browser environment')
    }
    
    // Dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')).default
    
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
    // Fallback to a simple text-based QR representation
    const qrText = `Order: ${orderNumber}\nID: ${orderId}\nTime: ${new Date().toLocaleString()}`
    return `data:text/plain;base64,${btoa(qrText)}`
  }
}

// Validate reference number format
export function validateReferenceNumber(ref: string): boolean {
  const pattern = /^BBQ[A-Z0-9]{8}[A-Z0-9]{4}$/
  return pattern.test(ref)
}

// Extract reference number from QR code data
export function extractReferenceFromQR(qrData: string): string | null {
  try {
    const data = JSON.parse(qrData)
    return data.reference || null
  } catch {
    // If not JSON, try to extract from text
    const match = qrData.match(/BBQ[A-Z0-9]{12}/)
    return match ? match[0] : null
  }
}
