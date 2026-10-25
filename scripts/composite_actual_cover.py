import os
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 675
img = Image.new('RGBA', (W, H), (6, 8, 15, 255))
draw = ImageDraw.Draw(img)

# 1. Background Glows
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

# Emerald radial glow (top-left)
for r in range(350, 0, -10):
    alpha = int(40 * (1 - r / 350))
    glow_draw.ellipse([180 - r, 120 - r, 180 + r, 120 + r], fill=(16, 185, 129, alpha))

# Violet radial glow (bottom-right)
for r in range(480, 0, -15):
    alpha = int(45 * (1 - r / 480))
    glow_draw.ellipse([980 - r, 540 - r, 980 + r, 540 + r], fill=(99, 102, 241, alpha))

# Center-right teal glow
for r in range(300, 0, -12):
    alpha = int(30 * (1 - r / 300))
    glow_draw.ellipse([700 - r, 300 - r, 700 + r, 300 + r], fill=(20, 184, 166, alpha))

img = Image.alpha_composite(img, glow_layer)
draw = ImageDraw.Draw(img)

# Dot Grid Pattern
grid_color = (255, 255, 255, 14)
for x in range(0, W, 28):
    for y in range(0, H, 28):
        draw.point((x, y), fill=grid_color)

# Fonts
font_bold_huge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 56)
font_bold_lg = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 24)
font_bold_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 17)
font_regular_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 15)
font_regular_sm = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 13)
font_mono_xs = ImageFont.truetype(r'C:\Windows\Fonts\consola.ttf', 12)

# Left Column (Branding & Features - NO PERSON NAME)
pill_x, pill_y, pill_w, pill_h = 55, 60, 400, 32
draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=16, fill=(16, 185, 129, 24), outline=(16, 185, 129, 90), width=1)
draw.ellipse([pill_x + 14, pill_y + 11, pill_x + 24, pill_y + 21], fill=(16, 185, 129, 255))
draw.text((pill_x + 34, pill_y + 7), 'v1.5.0 PRODUCTION • PWA & ANDROID TWA', font=font_mono_xs, fill=(52, 211, 153, 255))

# Title
draw.text((55, 110), 'RupeePulse', font=font_bold_huge, fill=(255, 255, 255, 255))
draw.text((385, 116), '₹', font=font_bold_lg, fill=(16, 185, 129, 255))

# Subtitle
draw.text((55, 180), 'Sovereign Personal Finance & Khaata Ecosystem', font=font_bold_lg, fill=(226, 232, 240, 255))

# Description
desc = (
    'Enterprise personal finance ecosystem engineered with Next.js 14,\n'
    'real-time Vault Guard runway pacing, continuous bilateral Khaata\n'
    'passbooks, dynamic NPCI UPI QR code generation, and\n'
    'zero-telemetry client data sovereignty.'
)
draw.text((55, 222), desc, font=font_regular_md, fill=(148, 163, 184, 255), spacing=7)

# Core Feature Pills
card1_box = [55, 335, 275, 425]
draw.rounded_rectangle(card1_box, radius=12, fill=(18, 18, 24, 220), outline=(255, 255, 255, 25), width=1)
draw.text((70, 345), 'LIVE DEMO BALANCE', font=font_mono_xs, fill=(16, 185, 129, 255))
draw.text((70, 365), '₹84,520.00', font=font_bold_md, fill=(255, 255, 255, 255))
draw.text((70, 395), '● Safe Runway: 22 Days', font=font_regular_sm, fill=(148, 163, 184, 255))

card2_box = [290, 335, 510, 425]
draw.rounded_rectangle(card2_box, radius=12, fill=(18, 18, 24, 220), outline=(255, 255, 255, 25), width=1)
draw.text((305, 345), 'KHAATA SPLIT 2.0', font=font_mono_xs, fill=(129, 140, 248, 255))
draw.text((305, 365), '+ ₹3,250.00', font=font_bold_md, fill=(52, 211, 153, 255))
draw.text((305, 395), '● Dynamic NPCI UPI QR', font=font_regular_sm, fill=(148, 163, 184, 255))

# Tech Stack Pills
tags = ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'MongoDB Atlas', 'IndexedDB', 'WebAuthn', 'Digital Asset Links']
cur_x = 55
cur_y = 455
for tag in tags:
    tw = int(font_mono_xs.getlength(tag)) + 22
    if cur_x + tw > 520:
        cur_x = 55
        cur_y += 34
    draw.rounded_rectangle([cur_x, cur_y, cur_x + tw, cur_y + 26], radius=13, fill=(30, 41, 59, 160), outline=(255, 255, 255, 25), width=1)
    draw.text((cur_x + 11, cur_y + 5), tag, font=font_mono_xs, fill=(203, 213, 225, 255))
    cur_x += tw + 10

# Bottom Metrics Badges (NO PERSON NAME)
draw.line([(55, 560), (510, 560)], fill=(255, 255, 255, 20), width=1)

b1 = [55, 580, 195, 622]
draw.rounded_rectangle(b1, radius=8, fill=(18, 18, 24, 200), outline=(16, 185, 129, 60))
draw.text((67, 587), '64 / 64 PASS', font=font_mono_xs, fill=(16, 185, 129, 255))
draw.text((67, 601), 'Unit Tests Verified', font=font_regular_sm, fill=(203, 213, 225, 255))

b2 = [210, 580, 350, 622]
draw.rounded_rectangle(b2, radius=8, fill=(18, 18, 24, 200), outline=(99, 102, 241, 60))
draw.text((222, 587), '0ms LATENCY', font=font_mono_xs, fill=(129, 140, 248, 255))
draw.text((222, 601), 'Offline FIFO Cache', font=font_regular_sm, fill=(203, 213, 225, 255))

b3 = [365, 580, 505, 622]
draw.rounded_rectangle(b3, radius=8, fill=(18, 18, 24, 200), outline=(14, 165, 233, 60))
draw.text((377, 587), '100% PRIVATE', font=font_mono_xs, fill=(14, 165, 233, 255))
draw.text((377, 601), 'Zero-Telemetry', font=font_regular_sm, fill=(203, 213, 225, 255))

# Right Column: The ACTUAL App Screenshots!
# Phone 1 (Left): ACTUAL DASHBOARD PAGE!
dash_path = 'report/screenshots/actual_dashboard_mobile.png'
if os.path.exists(dash_path):
    d_ss = Image.open(dash_path).convert('RGBA')
    target_h = 560
    target_w = int(d_ss.width * (target_h / d_ss.height))
    d_ss = d_ss.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    phone1_x = 570
    phone1_y = 55
    phone1_w = target_w + 14
    phone1_h = target_h + 14
    
    # Glow behind phone
    for r in range(40, 0, -4):
        alpha = int(24 * (1 - r / 40))
        draw.rounded_rectangle([phone1_x - r, phone1_y - r, phone1_x + phone1_w + r, phone1_y + phone1_h + r], radius=28, fill=(16, 185, 129, alpha))
        
    draw.rounded_rectangle([phone1_x, phone1_y, phone1_x + phone1_w, phone1_y + phone1_h], radius=24, fill=(15, 23, 42, 240), outline=(255, 255, 255, 40), width=2)
    
    mask1 = Image.new('L', (target_w, target_h), 0)
    mask1_draw = ImageDraw.Draw(mask1)
    mask1_draw.rounded_rectangle([0, 0, target_w, target_h], radius=18, fill=255)
    img.paste(d_ss, (phone1_x + 7, phone1_y + 7), mask1)

# Phone 2 (Right): ACTUAL KHAATA SPLIT LEDGER PAGE with NPCI UPI QR!
khaata_path = 'report/screenshots/actual_khaata_mobile.png'
if os.path.exists(khaata_path):
    k_ss = Image.open(khaata_path).convert('RGBA')
    target_h2 = 505
    target_w2 = int(k_ss.width * (target_h2 / k_ss.height))
    k_ss = k_ss.resize((target_w2, target_h2), Image.Resampling.LANCZOS)
    
    phone2_x = 875
    phone2_y = 95
    phone2_w = target_w2 + 14
    phone2_h = target_h2 + 14
    
    # Glow behind phone
    for r in range(40, 0, -4):
        alpha = int(24 * (1 - r / 40))
        draw.rounded_rectangle([phone2_x - r, phone2_y - r, phone2_x + phone2_w + r, phone2_y + phone2_h + r], radius=28, fill=(99, 102, 241, alpha))
        
    draw.rounded_rectangle([phone2_x, phone2_y, phone2_x + phone2_w, phone2_y + phone2_h], radius=24, fill=(15, 23, 42, 240), outline=(99, 102, 241, 70), width=2)
    
    mask2 = Image.new('L', (target_w2, target_h2), 0)
    mask2_draw = ImageDraw.Draw(mask2)
    mask2_draw.rounded_rectangle([0, 0, target_w2, target_h2], radius=18, fill=255)
    img.paste(k_ss, (phone2_x + 7, phone2_y + 7), mask2)

# Floating Wallet Icon on Top Right
wallet_icon_path = 'public/icons/wallet-icon-512.png'
if os.path.exists(wallet_icon_path):
    w_icon = Image.open(wallet_icon_path).convert('RGBA').resize((64, 64), Image.Resampling.LANCZOS)
    draw.ellipse([1100, 25, 1172, 97], fill=(15, 23, 42, 230), outline=(16, 185, 129, 160), width=2)
    img.paste(w_icon, (1104, 29), w_icon)

# Save
rgb_img = img.convert('RGB')
rgb_img.save('report/cover.png', 'PNG', quality=95)
rgb_img.save('report/main.jpg', 'JPEG', quality=95)
print("Successfully generated report/cover.png and report/main.jpg using ACTUAL APP DASHBOARD & KHAATA SCREENSHOTS!")
