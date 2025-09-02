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

// Generate QR code data URL
export async function generateQRCode(referenceNumber: string): Promise<string> {
  try {
    // For now, we'll create a simple text-based QR code
    // In production, you'd use a QR code library like 'qrcode'
    const qrData = {
      type: 'order',
      reference: referenceNumber,
      timestamp: new Date().toISOString(),
      url: `${window.location.origin}/verify-order?ref=${referenceNumber}`
    }
    
    // Create a simple QR code representation (you can replace this with actual QR library)
    const qrText = `QR Code for: ${referenceNumber}\nOrder Reference: ${referenceNumber}\nTimestamp: ${qrData.timestamp}`
    
    // For now, return a data URL with the reference number
    // In production, use: import QRCode from 'qrcode'
    // return await QRCode.toDataURL(JSON.stringify(qrData))
    
    return `data:text/plain;base64,${btoa(qrText)}`
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
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
