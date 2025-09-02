# 🚀 DEVELOPMENT GUIDELINES - LOCKED DESIGN SYSTEM

## 🎯 **PURPOSE**
This document explains how to develop new functionality while maintaining the completely locked design system.

---

## 🔒 **DESIGN SYSTEM STATUS: COMPLETELY LOCKED**

**⚠️  CRITICAL: The design system is FINAL and cannot be modified**
- Colors are locked
- Typography is locked  
- Spacing is locked
- Component styles are locked
- Layout structure is locked

---

## ✅ **WHAT YOU CAN DO (FUNCTIONALITY ONLY)**

### 1. **Add New Pages**
```tsx
// ✅ CORRECT: Use PageTemplate
import PageTemplate, { PageHeading, PageSection } from '@/components/templates/PageTemplate'

export default function NewPage() {
  return (
    <PageTemplate pageName="New Page">
      <PageHeading 
        title="Page Title" 
        subtitle="Page description"
      />
      <PageSection>
        {/* Your content here */}
      </PageSection>
    </PageTemplate>
  )
}
```

### 2. **Add New Components**
```tsx
// ✅ CORRECT: Use locked design classes
export default function NewComponent() {
  return (
    <div className="bbq-card p-6">
      <h3 className="font-bbq-display text-2xl font-bold text-gray-900">
        Component Title
      </h3>
      <button className="bbq-button-primary">
        Action Button
      </button>
    </div>
  )
}
```

### 3. **Add Business Logic**
- Forms and validation
- API integrations
- Database operations
- User authentication
- Order management
- Payment processing

### 4. **Add New Content**
- Text content
- Images and media
- Data and information
- Interactive elements

---

## ❌ **WHAT YOU CANNOT DO (DESIGN CHANGES)**

### 1. **Colors**
```tsx
// ❌ FORBIDDEN: Custom colors
<div style={{ color: '#FF0000' }}>  // NO!
<div className="text-red-500">      // NO!
<div className="bg-blue-600">       // NO!

// ✅ REQUIRED: Locked colors only
<div className="text-lays-dark-red">  // YES!
<div className="bg-lays-orange-gold"> // YES!
```

### 2. **Typography**
```tsx
// ❌ FORBIDDEN: Custom fonts
<h1 style={{ fontFamily: 'Arial' }}>  // NO!
<h1 className="font-sans">            // NO!

// ✅ REQUIRED: Locked fonts only
<h1 className="font-bbq-display">     // YES!
<p className="font-bbq-body">         // YES!
```

### 3. **Spacing & Layout**
```tsx
// ❌ FORBIDDEN: Custom spacing
<div className="p-12 m-8">           // NO!
<div style={{ padding: '2rem' }}>    // NO!

// ✅ REQUIRED: Locked spacing only
<div className="bbq-section">         // YES!
<div className="bbq-container">       // YES!
```

### 4. **Component Styles**
```tsx
// ❌ FORBIDDEN: Custom component styles
<div className="custom-card">         // NO!
<button className="custom-button">    // NO!

// ✅ REQUIRED: Locked component classes only
<div className="bbq-card">            // YES!
<button className="bbq-button-primary"> // YES!
```

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### 1. **Before Starting**
```bash
# Check design system compliance
npm run design:check
```

### 2. **During Development**
- Use only locked design classes
- Follow PageTemplate structure
- Test responsive behavior
- Validate against design system

### 3. **Before Committing**
```bash
# Validate design compliance
npm run design:validate
```

### 4. **If You Need Design Changes**
1. **STOP** - Do not make changes
2. **ASK** - Get explicit user approval
3. **DOCUMENT** - Update design system docs
4. **TEST** - Ensure consistency across all pages

---

## 📋 **DESIGN SYSTEM REFERENCE**

### **Available Colors**
```css
text-lays-dark-red      /* #AB0E14 */
text-lays-bright-red    /* #EF1C24 */
text-lays-orange-gold   /* #F1B11B */
text-lays-light-yellow  /* #FDF597 */
text-lays-brown-gold    /* #957531 */
text-bbq-secondary      /* #64748b */
```

### **Available Typography**
```css
font-bbq-display        /* Playfair Display */
font-bbq-body          /* Inter */
font-bbq-fredoka       /* Fredoka */
```

### **Available Components**
```css
bbq-button-primary      /* Primary buttons */
bbq-button-secondary    /* Secondary buttons */
bbq-card               /* Card containers */
bbq-input              /* Form inputs */
bbq-section            /* Page sections */
bbq-container          /* Content containers */
```

### **Available Layout**
```css
bbq-section            /* Section spacing */
bbq-container          /* Max width container */
pt-24                 /* Top padding for pages */
min-h-screen          /* Full height pages */
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **If Design System is Broken**
1. **IMMEDIATELY STOP** development
2. **REVERT** to last working commit
3. **IDENTIFY** what caused the break
4. **FIX** using only locked design system
5. **VALIDATE** with `npm run design:check`

### **If You Accidentally Modified Design**
1. **DO NOT COMMIT** the changes
2. **REVERT** the specific changes
3. **USE** only locked design classes
4. **TEST** the component thoroughly
5. **VALIDATE** design compliance

---

## 📚 **RESOURCES**

- **Design System**: `docs/DESIGN-SYSTEM.md`
- **Page Template**: `components/templates/PageTemplate.tsx`
- **Design Lock**: `components/layout/DesignLock.tsx`
- **Validation Script**: `scripts/design-lock-checker.js`

---

## 🎯 **REMEMBER**

**The goal is to add functionality while preserving the perfect design you already have.**

**Design changes = ❌ Forbidden**
**Functionality additions = ✅ Encouraged**

**When in doubt, use the locked design system classes and ask for guidance.**
