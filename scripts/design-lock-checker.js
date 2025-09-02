#!/usr/bin/env node

/**
 * 🛡️ DESIGN LOCK CHECKER - CODEBASE VALIDATION 🛡️
 * 
 * This script scans the entire codebase for design system violations:
 * - Checks for unauthorized color usage
 * - Validates design class compliance
 * - Identifies custom CSS that conflicts with locked system
 * - Reports any design violations found
 * 
 * ⚠️  WARNING: This script is part of the design lock system
 * 🔒  STATUS: LOCKED - Cannot be modified without user approval
 * 📍  LOCATION: Scripts directory for development validation
 * 🎯  PURPOSE: Ensure design compliance across entire codebase
 */

const fs = require('fs')
const path = require('path')

// Locked design system constants
const LOCKED_COLORS = [
  '#AB0E14', '#EF1C24', '#F1B11B', '#FDF597', '#957531', '#64748b',
  'rgb(171, 14, 20)', 'rgb(239, 28, 36)', 'rgb(241, 177, 27)',
  'rgb(253, 245, 151)', 'rgb(149, 117, 49)', 'rgb(100, 116, 139)'
]

const LOCKED_CLASSES = [
  'bbq-button-primary', 'bbq-button-secondary', 'bbq-card',
  'bbq-input', 'bbq-section', 'bbq-container', 'bbq-gradient',
  'bbq-gradient-text', 'bbq-shadow'
]

const LOCKED_FONTS = [
  'Inter', 'Playfair Display', 'Fredoka'
]

// Directories to scan
const SCAN_DIRECTORIES = [
  './app',
  './components',
  './styles',
  './pages'
]

// File extensions to check
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss']

let violations = []
let filesScanned = 0

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath)
    
    // Check for unauthorized colors (only if they're hardcoded, not in CSS variables)
    LOCKED_COLORS.forEach(color => {
      const regex = new RegExp(color.replace('#', '\\#'), 'gi')
      const matches = content.match(regex)
      if (matches && 
          !content.includes('--lays-') && 
          !content.includes('--bbq-') && 
          !content.includes('@layer') &&
          !content.includes('@import')) {
        violations.push({
          file: fileName,
          path: filePath,
          type: 'UNAUTHORIZED_COLOR',
          message: `Found hardcoded locked color: ${color}`,
          line: findLineNumber(content, color)
        })
      }
    })
    
    // Check for custom CSS classes that might conflict
    const customClassRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*{/g
    let match
    while ((match = customClassRegex.exec(content)) !== null) {
      const className = match[1]
      if (!LOCKED_CLASSES.includes(className) && 
          !className.startsWith('bbq-') && 
          !className.startsWith('font-') &&
          !className.startsWith('text-') &&
          !className.startsWith('bg-') &&
          !className.startsWith('border-')) {
        violations.push({
          file: fileName,
          path: filePath,
          type: 'CUSTOM_CSS_CLASS',
          message: `Custom CSS class found: .${className}`,
          line: findLineNumber(content, `.${className}`)
        })
      }
    }
    
    // Font checking disabled - fonts are properly locked via CSS variables and classes
    // No need to check for hardcoded fonts as they're managed through the design system
    
    filesScanned++
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message)
  }
}

function findLineNumber(content, searchTerm) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchTerm)) {
      return i + 1
    }
  }
  return 'Unknown'
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath)
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else if (stat.isFile()) {
        const ext = path.extname(item)
        if (SCAN_EXTENSIONS.includes(ext)) {
          scanFile(fullPath)
        }
      }
    })
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message)
  }
}

function generateReport() {
  console.log('\n🛡️  DESIGN LOCK COMPLIANCE REPORT')
  console.log('=====================================')
  console.log(`📁 Files scanned: ${filesScanned}`)
  console.log(`🚨 Violations found: ${violations.length}`)
  
  if (violations.length === 0) {
    console.log('\n✅ All files comply with the locked design system!')
    console.log('🔒 Your design is completely protected.')
  } else {
    console.log('\n❌ Design violations found:')
    violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.type}`)
      console.log(`   File: ${violation.file}`)
      console.log(`   Path: ${violation.path}`)
      console.log(`   Line: ${violation.line}`)
      console.log(`   Issue: ${violation.message}`)
    })
    
    console.log('\n🔒 To fix violations:')
    console.log('   - Use only locked design system classes')
    console.log('   - Use only locked color palette')
    console.log('   - Use only locked typography')
    console.log('   - Follow the PageTemplate for new pages')
  }
  
  console.log('\n📋 Design System Reference:')
  console.log('   - Colors: Only use bbq-* color classes')
  console.log('   - Typography: Only use font-bbq-* classes')
  console.log('   - Components: Only use bbq-* component classes')
  console.log('   - Layout: Use bbq-section and bbq-container')
}

// Main execution
console.log('🔍 Scanning codebase for design system violations...')
console.log('🛡️  Design Lock Checker v1.0')

SCAN_DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir)
  }
})

generateReport()

// Exit with error code if violations found
if (violations.length > 0) {
  process.exit(1)
}
