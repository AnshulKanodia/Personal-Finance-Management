import os
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 675
img = Image.new('RGBA', (W, H), (7, 10, 19, 255))
draw = ImageDraw.Draw(img)

# 1. Subtle Background Radial Glows
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

# Emerald glow top-left
for r in range(350, 0, -10):
    alpha = int(45 * (1 - r / 350))
    glow_draw.ellipse([160 - r, 120 - r, 160 + r, 120 + r], fill=(16, 185, 129, alpha))

# Violet glow bottom-right
for r in range(450, 0, -15):
    alpha = int(50 * (1 - r / 450))
    glow_draw.ellipse([980 - r, 520 - r, 980 + r, 520 + r], fill=(99, 102, 241, alpha))

# Teal glow center
for r in range(320, 0, -12):
    alpha = int(35 * (1 - r / 320))
    glow_draw.ellipse([650 - r, 280 - r, 650 + r, 280 + r], fill=(20, 184, 166, alpha))

img = Image.alpha_composite(img, glow_layer)
draw = ImageDraw.Draw(img)

# 2. Tech Grid Pattern
grid_color = (255, 255, 255, 9)
grid_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid_layer)
step = 40
for x in range(0, W, step):
    grid_draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
for y in range(0, H, step):
    grid_draw.line([(0, y), (W, y)], fill=grid_color, width=1)
img = Image.alpha_composite(img, grid_layer)
draw = ImageDraw.Draw(img)

# Load fonts
font_bold_huge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 58)
font_bold_lg = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 24)
font_bold_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 18)
font_regular_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 16)
font_regular_sm = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 13)
font_mono_xs = ImageFont.truetype(r'C:\Windows\Fonts\consola.ttf', 12)

# 3. Left Column Content (Branding, Features, Metrics - NO PERSON NAME)
pill_x, pill_y, pill_w, pill_h = 60, 65, 410, 34
draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=17, fill=(16, 185, 129, 24), outline=(16, 185, 129, 90), width=1)
draw.ellipse([pill_x + 14, pill_y + 12, pill_x + 24, pill_y + 22], fill=(16, 185, 129, 255))
draw.text((pill_x + 34, pill_y + 8), 'v1.5.0 PRODUCTION • PWA & ANDROID TWA', font=font_mono_xs, fill=(52, 211, 153, 255))

# Project Title
draw.text((60, 118), 'RupeePulse', font=font_bold_huge, fill=(255, 255, 255, 255))
draw.text((400, 126), '₹', font=font_bold_lg, fill=(16, 185, 129, 255))

# Subtitle
draw.text((60, 190), 'Sovereign Personal Finance & Khaata Ecosystem', font=font_bold_lg, fill=(226, 232, 240, 255))

# Description Paragraph
desc = (
    'Enterprise-grade expense intelligence ecosystem engineered with\n'
    'Next.js 14, dynamic Vault Guard runway pacing, continuous bilateral\n'
    'Khaata passbooks, dynamic NPCI UPI QR code generation, and\n'
    'zero-telemetry client data sovereignty.'
)
draw.text((60, 232), desc, font=font_regular_md, fill=(148, 163, 184, 255), spacing=7)

# Live Random Demo Metrics Cards (NO PERSONAL DATA)
card1_box = [60, 345, 280, 435]
draw.rounded_rectangle(card1_box, radius=12, fill=(15, 23, 42, 200), outline=(255, 255, 255, 25), width=1)
draw.text((75, 355), 'DEMO NET BALANCE', font=font_mono_xs, fill=(16, 185, 129, 255))
draw.text((75, 375), '₹84,520.00', font=font_bold_md, fill=(255, 255, 255, 255))
draw.text((75, 405), '● Safe Runway: 22 Days', font=font_regular_sm, fill=(148, 163, 184, 255))

card2_box = [295, 345, 520, 435]
draw.rounded_rectangle(card2_box, radius=12, fill=(15, 23, 42, 200), outline=(255, 255, 255, 25), width=1)
draw.text((310, 355), 'KHAATA SPLIT 2.0', font=font_mono_xs, fill=(129, 140, 248, 255))
draw.text((310, 375), '+ ₹3,250.00', font=font_bold_md, fill=(52, 211, 153, 255))
draw.text((310, 405), '● Dynamic NPCI UPI QR', font=font_regular_sm, fill=(148, 163, 184, 255))

# Feature Tags
tags = ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'MongoDB Atlas', 'IndexedDB Offline', 'WebAuthn', 'Digital Asset Links']
cur_x = 60
cur_y = 465
for tag in tags:
    tw = int(font_mono_xs.getlength(tag)) + 22
    if cur_x + tw > 530:
        cur_x = 60
        cur_y += 34
    draw.rounded_rectangle([cur_x, cur_y, cur_x + tw, cur_y + 26], radius=13, fill=(30, 41, 59, 160), outline=(255, 255, 255, 25), width=1)
    draw.text((cur_x + 11, cur_y + 5), tag, font=font_mono_xs, fill=(203, 213, 225, 255))
    cur_x += tw + 10

# Architecture / Reliability Badges at Bottom Left (Pure System Badges, NO PERSON NAME)
draw.line([(60, 565), (520, 565)], fill=(255, 255, 255, 20), width=1)

b1 = [60, 585, 200, 625]
draw.rounded_rectangle(b1, radius=8, fill=(15, 23, 42, 180), outline=(16, 185, 129, 60))
draw.text((72, 592), '64 / 64 PASS', font=font_mono_xs, fill=(16, 185, 129, 255))
draw.text((72, 606), 'Unit Tests Verified', font=font_regular_sm, fill=(203, 213, 225, 255))

b2 = [215, 585, 355, 625]
draw.rounded_rectangle(b2, radius=8, fill=(15, 23, 42, 180), outline=(99, 102, 241, 60))
draw.text((227, 592), '0ms LATENCY', font=font_mono_xs, fill=(129, 140, 248, 255))
draw.text((227, 606), 'Offline FIFO Cache', font=font_regular_sm, fill=(203, 213, 225, 255))

b3 = [370, 585, 510, 625]
draw.rounded_rectangle(b3, radius=8, fill=(15, 23, 42, 180), outline=(14, 165, 233, 60))
draw.text((382, 592), '100% PRIVATE', font=font_mono_xs, fill=(14, 165, 233, 255))
draw.text((382, 606), 'Zero-Telemetry', font=font_regular_sm, fill=(203, 213, 225, 255))

# 4. Right Column: TWO DISTINCT REAL UI SCREENS (NO PERSONAL DATA)
# SCREEN 1: Dashboard Demo (Left Phone)
dash_path = 'report/screenshots/dashboard_demo.png'
if os.path.exists(dash_path):
    d_ss = Image.open(dash_path).convert('RGBA')
    target_h = 540
    target_w = int(d_ss.width * (target_h / d_ss.height))
    d_ss = d_ss.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    phone1_x = 590
    phone1_y = 65
    phone1_w = target_w + 14
    phone1_h = target_h + 14
    
    # Glow
    for r in range(35, 0, -4):
        alpha = int(22 * (1 - r / 35))
        draw.rounded_rectangle([phone1_x - r, phone1_y - r, phone1_x + phone1_w + r, phone1_y + phone1_h + r], radius=26, fill=(16, 185, 129, alpha))
        
    draw.rounded_rectangle([phone1_x, phone1_y, phone1_x + phone1_w, phone1_y + phone1_h], radius=22, fill=(15, 23, 42, 240), outline=(255, 255, 255, 40), width=2)
    
    mask1 = Image.new('L', (target_w, target_h), 0)
    mask1_draw = ImageDraw.Draw(mask1)
    mask1_draw.rounded_rectangle([0, 0, target_w, target_h], radius=16, fill=255)
    img.paste(d_ss, (phone1_x + 7, phone1_y + 7), mask1)

# SCREEN 2: Khaata Split Ledger Demo with UPI QR (Right Phone - DISTINCT!)
khaata_path = 'report/screenshots/khaata_demo.png'
if os.path.exists(khaata_path):
    k_ss = Image.open(khaata_path).convert('RGBA')
    target_h2 = 490
    target_w2 = int(k_ss.width * (target_h2 / k_ss.height))
    k_ss = k_ss.resize((target_w2, target_h2), Image.Resampling.LANCZOS)
    
    phone2_x = 880
    phone2_y = 105
    phone2_w = target_w2 + 14
    phone2_h = target_h2 + 14
    
    # Glow
    for r in range(35, 0, -4):
        alpha = int(22 * (1 - r / 35))
        draw.rounded_rectangle([phone2_x - r, phone2_y - r, phone2_x + phone2_w + r, phone2_y + phone2_h + r], radius=26, fill=(99, 102, 241, alpha))
        
    draw.rounded_rectangle([phone2_x, phone2_y, phone2_x + phone2_w, phone2_y + phone2_h], radius=22, fill=(15, 23, 42, 240), outline=(99, 102, 241, 70), width=2)
    
    mask2 = Image.new('L', (target_w2, target_h2), 0)
    mask2_draw = ImageDraw.Draw(mask2)
    mask2_draw.rounded_rectangle([0, 0, target_w2, target_h2], radius=16, fill=255)
    img.paste(k_ss, (phone2_x + 7, phone2_y + 7), mask2)

# Floating Wallet Emblem (Top right)
wallet_icon_path = 'public/icons/wallet-icon-512.png'
if os.path.exists(wallet_icon_path):
    w_icon = Image.open(wallet_icon_path).convert('RGBA').resize((64, 64), Image.Resampling.LANCZOS)
    draw.ellipse([1100, 35, 1172, 107], fill=(15, 23, 42, 230), outline=(16, 185, 129, 160), width=2)
    img.paste(w_icon, (1104, 39), w_icon)

# Save output
rgb_img = img.convert('RGB')
rgb_img.save('report/cover.png', 'PNG', quality=95)
rgb_img.save('report/main.jpg', 'JPEG', quality=95)
print("Successfully generated clean synthetic cover.png and main.jpg (NO personal data)")
