# Complete BBQ Order Flow and UX Requirements

## Customer Flow
1. **Add to Cart** → **Checkout**
2. **Provide Information:**
   - Personal name and phone number
   - Pickup time and date selection
   - Payment method (GCash or Bank Transfer)
   - Upload payment screenshot
   - Input payment reference number
3. **Order submitted** → Admin receives notification

## Admin Flow
1. **Verify payment** and screenshots in admin dashboard
2. **Mark as paid** when verification complete
3. **Generate QR code** + reference number for customer
4. **Update customer app** with QR code and reference number

## Crew Flow
1. **Receive notification** that order is paid
2. **Mark as "preparing"** when starting to cook
3. **Press "ready for pickup"** when order is complete
4. **Notify admin and customer** when ready

## Status Tracking
- **pending** → **paid** → **preparing** → **ready** → **completed**
- All statuses visible to both customer and admin
- Real-time updates across all interfaces

## Payment Methods
- **GCash** (manual verification with screenshot + reference)
- **Bank Transfer** (manual verification with screenshot + reference)
- **Future:** GCash API integration for automatic verification

## Current Payment System
- ❌ **Cash payments** - Not accepted
- ❌ **Card payments** - Not accepted  
- ✅ **GCash** - Manual verification required
- ✅ **Bank Transfer** - Manual verification required

## Key Features
- Manual payment verification system
- QR code generation for pickup
- Reference number for manual verification
- Real-time status updates
- Multi-role notifications (admin, crew, customer)

## Database Requirements
- Order status tracking
- Payment verification fields
- QR code storage
- Reference number storage
- Screenshot upload capability
- Timestamp tracking for each status change

---
**Note:** This is the complete reference for the ordering system UX. Do not repeat this information in future conversations.
