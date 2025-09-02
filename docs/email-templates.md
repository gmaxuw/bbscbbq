# Enhanced Email Templates for Supabase Auth

## Password Reset Email Template

To enhance your password reset emails, update the **Recovery** template in your Supabase Dashboard:

### Go to: Authentication → Email Templates → Recovery

Replace the default template with this enhanced version:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - BBQ Surigao City</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .tagline {
            color: #f59e0b;
            font-size: 14px;
            font-weight: 500;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        .button:hover {
            background: linear-gradient(135deg, #b91c1c, #991b1b);
            transform: translateY(-2px);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 BBQ Surigao City</div>
            <div class="tagline">Authentic BBQ • Premium Quality • Local Taste</div>
        </div>
        
        <div class="content">
            <h2 style="color: #dc2626; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p>Hello!</p>
            
            <p>We received a request to reset your password for your BBQ Surigao City account. If you made this request, click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    🔐 Reset My Password
                </a>
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                {{ .ConfirmationURL }}
            </p>
        </div>
        
        <div class="footer">
            <p><strong>BBQ Surigao City</strong></p>
            <p>Experience the authentic taste of slow-smoked BBQ perfection</p>
            <p style="font-size: 12px; margin-top: 15px;">
                This email was sent to {{ .Email }}. If you have any questions, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>
```

## Signup Confirmation Email Template

### Go to: Authentication → Email Templates → Confirm signup

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to BBQ Surigao City!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .tagline {
            color: #f59e0b;
            font-size: 14px;
            font-weight: 500;
        }
        .welcome-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 BBQ Surigao City</div>
            <div class="tagline">Authentic BBQ • Premium Quality • Local Taste</div>
        </div>
        
        <div style="text-align: center;">
            <div class="welcome-badge">🎉 WELCOME TO THE FAMILY!</div>
        </div>
        
        <h2 style="color: #dc2626; margin-bottom: 20px;">Confirm Your Email Address</h2>
        
        <p>Welcome to BBQ Surigao City! We're excited to have you join our community of BBQ lovers.</p>
        
        <p>To complete your registration and start ordering our delicious BBQ, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">
                ✅ Confirm My Email
            </a>
        </div>
        
        <p>Once confirmed, you'll be able to:</p>
        <ul>
            <li>🍖 Browse our full menu of authentic BBQ</li>
            <li>📱 Place orders from any device</li>
            <li>📍 Choose from 4 convenient locations</li>
            <li>💳 Enjoy secure payment options</li>
            <li>📊 Track your order history</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">
                🚀 Get Started Now
            </a>
        </div>
        
        <div class="footer">
            <p><strong>BBQ Surigao City</strong></p>
            <p>Experience the authentic taste of slow-smoked BBQ perfection</p>
            <p style="font-size: 12px; margin-top: 15px;">
                This email was sent to {{ .Email }}. If you didn't create an account, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
```

## How to Apply These Templates

1. **Go to your Supabase Dashboard**
2. **Navigate to:** Authentication → Email Templates
3. **Select the template** (Recovery or Confirm signup)
4. **Replace the content** with the enhanced HTML above
5. **Save the changes**

## Benefits of Enhanced Templates

- ✅ **Professional branding** with your BBQ theme
- ✅ **Better user experience** with clear instructions
- ✅ **Security information** to build trust
- ✅ **Mobile-friendly** responsive design
- ✅ **Clear call-to-action** buttons
- ✅ **Brand consistency** with your website
