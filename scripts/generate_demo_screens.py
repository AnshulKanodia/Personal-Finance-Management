import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs('report/screenshots', exist_ok=True)

# Fonts
font_bold_lg = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 24)
font_bold_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 18)
font_bold_sm = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 14)
font_reg_md = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 14)
font_reg_sm = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 12)
font_mono_xs = ImageFont.truetype(r'C:\Windows\Fonts\consola.ttf', 11)

W, H = 450, 950

def draw_phone_frame(title):
    img = Image.new('RGBA', (W, H), (9, 13, 22, 255))
    draw = ImageDraw.Draw(img)
    
    # Status bar
    draw.text((24, 14), "09:41", font=font_mono_xs, fill=(203, 213, 225, 255))
    draw.text((370, 14), "5G  100%", font=font_mono_xs, fill=(203, 213, 225, 255))
    
    # Header bar
    draw.ellipse([24, 42, 54, 72], fill=(16, 185, 129, 40), outline=(16, 185, 129, 180), width=1)
    draw.text((33, 47), "₹", font=font_bold_md, fill=(16, 185, 129, 255))
    draw.text((64, 46), title, font=font_bold_md, fill=(255, 255, 255, 255))
    
    # Header right icons
    draw.ellipse([370, 44, 398, 72], fill=(255, 255, 255, 10))
    draw.text((379, 49), "⚡", font=font_mono_xs, fill=(16, 185, 129, 255))
    draw.ellipse([406, 44, 434, 72], fill=(255, 255, 255, 10))
    draw.text((415, 49), "🔒", font=font_mono_xs, fill=(148, 163, 184, 255))
    
    # Bottom Navigation bar
    draw.line([(0, 885), (W, 885)], fill=(255, 255, 255, 15), width=1)
    nav_items = ["Dashboard", "Khaata", "Vault", "Analytics", "Settings"]
    for i, item in enumerate(nav_items):
        nx = 24 + i * 82
        color = (16, 185, 129, 255) if item in title else (100, 116, 139, 255)
        draw.text((nx, 905), item, font=font_mono_xs, fill=color)
    
    return img, draw

# ==============================================================================
# SCREEN 1: DASHBOARD DEMO
# ==============================================================================
img1, d1 = draw_phone_frame("RupeePulse")

# Total Net Balance Glass Card
d1.rounded_rectangle([20, 88, 430, 240], radius=16, fill=(15, 23, 42, 220), outline=(255, 255, 255, 25), width=1)
d1.text((36, 104), "TOTAL NET SOVEREIGN BALANCE", font=font_mono_xs, fill=(148, 163, 184, 255))
d1.text((36, 126), "₹84,520.00", font=font_bold_lg, fill=(255, 255, 255, 255))

# Balance trend pill
d1.rounded_rectangle([36, 172, 175, 196], radius=12, fill=(16, 185, 129, 25), outline=(16, 185, 129, 80))
d1.text((46, 176), "▲ +14.2% this month", font=font_mono_xs, fill=(52, 211, 153, 255))

# Quick Action Pills
actions = [("+ Add", (16, 185, 129, 40)), ("Khaata", (99, 102, 241, 40)), ("Scan UPI", (14, 165, 233, 40)), ("Backup", (245, 158, 11, 40))]
for idx, (act, col) in enumerate(actions):
    bx = 36 + idx * 96
    d1.rounded_rectangle([bx, 206, bx + 84, 230], radius=8, fill=col, outline=(255, 255, 255, 20), width=1)
    d1.text((bx + 12, 210), act, font=font_mono_xs, fill=(255, 255, 255, 255))

# Vault Guard Mini Runway Card
d1.rounded_rectangle([20, 252, 430, 360], radius=14, fill=(15, 23, 42, 180), outline=(16, 185, 129, 60), width=1)
d1.text((36, 266), "VAULT GUARD RUNWAY PACING", font=font_mono_xs, fill=(16, 185, 129, 255))
d1.text((36, 286), "₹24,350 spent / ₹60,000 cap", font=font_bold_sm, fill=(255, 255, 255, 255))

# Progress bar
d1.rounded_rectangle([36, 314, 414, 324], radius=5, fill=(30, 41, 59, 255))
d1.rounded_rectangle([36, 314, 36 + int(378 * (24350/60000)), 324], radius=5, fill=(16, 185, 129, 255))
d1.text((36, 334), "● 0.78x Safe Burn Rate • 22 Days Remaining", font=font_mono_xs, fill=(148, 163, 184, 255))

# Recent Transactions Header
d1.text((24, 380), "Recent Transactions", font=font_bold_sm, fill=(255, 255, 255, 255))
d1.text((350, 382), "View All", font=font_mono_xs, fill=(16, 185, 129, 255))

# Transactions list (Synthetic / Dummy data)
txs = [
    ("Blue Bottle Coffee", "Food & Dining • Today", "₹240.00", (244, 63, 94, 255)),
    ("Metro Rail Recharge", "Transit • Today", "₹120.00", (244, 63, 94, 255)),
    ("Cloud Server Hosting", "Tech Services • Yesterday", "₹1,450.00", (244, 63, 94, 255)),
    ("Organic Supermarket", "Groceries • 24 Oct", "₹960.00", (244, 63, 94, 255)),
    ("Freelance Milestone", "Client Payout • 23 Oct", "+ ₹18,000.00", (16, 185, 129, 255)),
    ("Gym Membership", "Health • 22 Oct", "₹1,800.00", (244, 63, 94, 255)),
    ("Bookstore Order", "Education • 21 Oct", "₹450.00", (244, 63, 94, 255))
]

for idx, (title, sub, amt, col) in enumerate(txs):
    ty = 410 + idx * 64
    d1.rounded_rectangle([20, ty, 430, ty + 54], radius=10, fill=(15, 23, 42, 140), outline=(255, 255, 255, 12), width=1)
    d1.ellipse([32, ty + 12, 62, ty + 42], fill=(30, 41, 59, 255))
    d1.text((42, ty + 18), "₹", font=font_mono_xs, fill=(203, 213, 225, 255))
    d1.text((72, ty + 10), title, font=font_bold_sm, fill=(255, 255, 255, 255))
    d1.text((72, ty + 30), sub, font=font_mono_xs, fill=(100, 116, 139, 255))
    d1.text((310, ty + 16), amt, font=font_bold_sm, fill=col)

img1.save('report/screenshots/dashboard_demo.png', 'PNG')
print("Generated dashboard_demo.png")

# ==============================================================================
# SCREEN 2: KHAATA SPLIT LEDGER DEMO
# ==============================================================================
img2, d2 = draw_phone_frame("Khaata Split Ledger")

# Net Settlement Summary Card
d2.rounded_rectangle([20, 88, 430, 210], radius=16, fill=(15, 23, 42, 220), outline=(99, 102, 241, 80), width=1)
d2.text((36, 104), "BILATERAL CONTINUOUS PASSBOOK", font=font_mono_xs, fill=(129, 140, 248, 255))
d2.text((36, 126), "+ ₹3,250.00", font=font_bold_lg, fill=(16, 185, 129, 255))
d2.text((36, 162), "You are owed net across 2 active friends", font=font_reg_sm, fill=(148, 163, 184, 255))
d2.text((36, 182), "● 100% NPCI UPI Compatible", font=font_mono_xs, fill=(16, 185, 129, 255))

# Dynamic NPCI UPI QR Card Modal preview
d2.rounded_rectangle([20, 224, 430, 480], radius=16, fill=(15, 23, 42, 240), outline=(255, 255, 255, 30), width=1)
d2.text((36, 240), "DYNAMIC NPCI UPI QR SETTLEMENT", font=font_mono_xs, fill=(14, 165, 233, 255))
d2.text((36, 260), "Scan with GPay, PhonePe or Paytm", font=font_bold_sm, fill=(255, 255, 255, 255))

# Synthetic QR code box
qr_box = [135, 290, 315, 430]
d2.rounded_rectangle(qr_box, radius=10, fill=(255, 255, 255, 255))
# QR pattern mock
d2.rectangle([145, 300, 185, 340], fill=(0, 0, 0, 255))
d2.rectangle([153, 308, 177, 332], fill=(255, 255, 255, 255))
d2.rectangle([160, 315, 170, 325], fill=(0, 0, 0, 255))

d2.rectangle([265, 300, 305, 340], fill=(0, 0, 0, 255))
d2.rectangle([273, 308, 297, 332], fill=(255, 255, 255, 255))
d2.rectangle([280, 315, 290, 325], fill=(0, 0, 0, 255))

d2.rectangle([145, 380, 185, 420], fill=(0, 0, 0, 255))
d2.rectangle([153, 388, 177, 412], fill=(255, 255, 255, 255))
d2.rectangle([160, 395, 170, 405], fill=(0, 0, 0, 255))

# Central rupee logo in QR
d2.ellipse([215, 350, 235, 370], fill=(16, 185, 129, 255))
d2.text((221, 352), "₹", font=font_mono_xs, fill=(255, 255, 255, 255))

d2.text((64, 444), "upi://pay?pa=rupeepulse@upi&am=1800.00", font=font_mono_xs, fill=(148, 163, 184, 255))

# Friend Passbooks
d2.text((24, 498), "Active Friends (Generic Demo)", font=font_bold_sm, fill=(255, 255, 255, 255))

friends = [
    ("Rohan K.", "You lent for Dinner split", "₹1,800.00", (16, 185, 129, 255), "UPI Pay"),
    ("Priya S.", "You lent for Travel cabs", "₹1,450.00", (16, 185, 129, 255), "WhatsApp"),
    ("Amit T.", "All settled up", "₹0.00", (148, 163, 184, 255), "History"),
    ("Sneha D.", "You borrowed for Lunch", "- ₹350.00", (244, 63, 94, 255), "Settle Now"),
    ("Karan V.", "All settled up", "₹0.00", (148, 163, 184, 255), "History")
]

for idx, (name, note, amt, col, btn) in enumerate(friends):
    fy = 526 + idx * 68
    d2.rounded_rectangle([20, fy, 430, fy + 58], radius=10, fill=(15, 23, 42, 140), outline=(255, 255, 255, 12), width=1)
    d2.ellipse([32, fy + 12, 62, fy + 42], fill=(99, 102, 241, 40))
    d2.text((40, fy + 18), name[:2], font=font_mono_xs, fill=(129, 140, 248, 255))
    d2.text((72, fy + 10), name, font=font_bold_sm, fill=(255, 255, 255, 255))
    d2.text((72, fy + 30), note, font=font_mono_xs, fill=(100, 116, 139, 255))
    d2.text((260, fy + 18), amt, font=font_bold_sm, fill=col)
    
    d2.rounded_rectangle([345, fy + 14, 415, fy + 44], radius=6, fill=(30, 41, 59, 255))
    d2.text((353, fy + 22), btn, font=font_mono_xs, fill=(203, 213, 225, 255))

img2.save('report/screenshots/khaata_demo.png', 'PNG')
print("Generated khaata_demo.png")

# ==============================================================================
# SCREEN 3: VAULT GUARD BUDGET DEMO
# ==============================================================================
img3, d3 = draw_phone_frame("Vault Guard Budget")

# Circular Burn-Rate Gauge Card
d3.rounded_rectangle([20, 88, 430, 310], radius=16, fill=(15, 23, 42, 220), outline=(16, 185, 129, 70), width=1)
d3.text((36, 104), "DYNAMIC MONTHLY BURNING RUNWAY", font=font_mono_xs, fill=(16, 185, 129, 255))
d3.text((36, 124), "Safe Runway: 22 Days Left", font=font_bold_lg, fill=(255, 255, 255, 255))

# Mock Circular Gauge Center
gauge_cx, gauge_cy = 225, 210
d3.ellipse([gauge_cx - 55, gauge_cy - 55, gauge_cx + 55, gauge_cy + 55], outline=(30, 41, 59, 255), width=8)
d3.arc([gauge_cx - 55, gauge_cy - 55, gauge_cx + 55, gauge_cy + 55], start=-90, end=70, fill=(16, 185, 129, 255), width=8)
d3.text((gauge_cx - 24, gauge_cy - 16), "41%", font=font_bold_lg, fill=(255, 255, 255, 255))
d3.text((gauge_cx - 28, gauge_cy + 10), "Spent", font=font_mono_xs, fill=(148, 163, 184, 255))

d3.text((36, 276), "Burn Pacing: 0.78x (Safe)", font=font_mono_xs, fill=(52, 211, 153, 255))
d3.text((250, 276), "Headroom: ₹14,500", font=font_mono_xs, fill=(148, 163, 184, 255))

# Categories
d3.text((24, 330), "Category Threshold Interceptor", font=font_bold_sm, fill=(255, 255, 255, 255))

cats = [
    ("Food & Dining", "₹8,400 / ₹15,000", 0.56, (16, 185, 129, 255), "Safe"),
    ("Apartment & Rent", "₹18,000 / ₹20,000", 0.90, (245, 158, 11, 255), "Caution"),
    ("Travel & Transit", "₹2,100 / ₹5,000", 0.42, (16, 185, 129, 255), "Safe"),
    ("Subscriptions & OTT", "₹1,200 / ₹3,000", 0.40, (16, 185, 129, 255), "Safe"),
    ("Shopping & Lifestyle", "₹4,200 / ₹6,000", 0.70, (16, 185, 129, 255), "Safe"),
    ("Healthcare & Fitness", "₹950 / ₹3,000", 0.31, (16, 185, 129, 255), "Safe"),
    ("Utilities & Bills", "₹2,400 / ₹4,000", 0.60, (16, 185, 129, 255), "Safe")
]

for idx, (cname, clim, pct, pcol, stat) in enumerate(cats):
    cy = 360 + idx * 72
    d3.rounded_rectangle([20, cy, 430, cy + 62], radius=10, fill=(15, 23, 42, 140), outline=(255, 255, 255, 12), width=1)
    d3.text((36, cy + 10), cname, font=font_bold_sm, fill=(255, 255, 255, 255))
    d3.text((280, cy + 10), clim, font=font_mono_xs, fill=(203, 213, 225, 255))
    
    # bar
    d3.rounded_rectangle([36, cy + 34, 340, cy + 42], radius=4, fill=(30, 41, 59, 255))
    d3.rounded_rectangle([36, cy + 34, 36 + int(304 * pct), cy + 42], radius=4, fill=pcol)
    
    # stat
    d3.text((360, cy + 30), stat, font=font_mono_xs, fill=pcol)

img3.save('report/screenshots/vault_guard_demo.png', 'PNG')
print("Generated vault_guard_demo.png")

# ==============================================================================
# SCREEN 4: ANALYTICS DEMO
# ==============================================================================
img4, d4 = draw_phone_frame("Financial Analytics")

# Trajectory Curve Card
d4.rounded_rectangle([20, 88, 430, 290], radius=16, fill=(15, 23, 42, 220), outline=(99, 102, 241, 70), width=1)
d4.text((36, 104), "30-DAY MONTE CARLO TRAJECTORY", font=font_mono_xs, fill=(129, 140, 248, 255))
d4.text((36, 124), "Expected Reserve: ₹54,200", font=font_bold_lg, fill=(255, 255, 255, 255))

# Graph Mock
graph_x, graph_y, graph_w, graph_h = 36, 160, 378, 100
d4.rectangle([graph_x, graph_y, graph_x + graph_w, graph_y + graph_h], fill=(15, 23, 42, 100))

# Grid lines
for gy in range(graph_y, graph_y + graph_h, 25):
    d4.line([(graph_x, gy), (graph_x + graph_w, gy)], fill=(255, 255, 255, 10))

# Simulated curves
pts = [(graph_x + i * 37, graph_y + int(50 + 25 * math.sin(i * 0.7) - i * 2)) for i in range(11)]
d4.line(pts, fill=(16, 185, 129, 255), width=3)

# Upper bound
pts_upper = [(graph_x + i * 37, graph_y + int(30 + 20 * math.sin(i * 0.7) - i * 1.5)) for i in range(11)]
d4.line(pts_upper, fill=(99, 102, 241, 120), width=1)

d4.text((36, 268), "P90 Upper • P50 Median • P10 Conservative", font=font_mono_xs, fill=(148, 163, 184, 255))

# Shannon Entropy Card
d4.rounded_rectangle([20, 306, 430, 430], radius=16, fill=(15, 23, 42, 220), outline=(14, 165, 233, 70), width=1)
d4.text((36, 322), "SHANNON ENTROPY DIVERSIFICATION", font=font_mono_xs, fill=(14, 165, 233, 255))
d4.text((36, 342), "Score: 84% (Optimal Dispersion)", font=font_bold_md, fill=(255, 255, 255, 255))
d4.text((36, 374), "Low concentration risk across categories.", font=font_reg_sm, fill=(148, 163, 184, 255))
d4.text((36, 396), "No single discretionary category exceeds 35% cap.", font=font_mono_xs, fill=(52, 211, 153, 255))

# Outlier Detection Log
d4.text((24, 450), "Z-Score Statistical Anomaly Log", font=font_bold_sm, fill=(255, 255, 255, 255))

anomalies = [
    ("Cloud Server Invoice", "Tech • Z-Score: +1.8", "Verified Normal", (16, 185, 129, 255)),
    ("Annual Insurance Debit", "Bills • Z-Score: +2.4", "User Confirmed", (245, 158, 11, 255)),
    ("Dining Splurge", "Food • Z-Score: +1.2", "Within Tolerance", (16, 185, 129, 255)),
    ("Flight Ticket Booking", "Travel • Z-Score: +2.8", "Pre-Commit Warning", (244, 63, 94, 255)),
    ("Book Store Purchase", "Edu • Z-Score: +0.4", "Baseline Normal", (16, 185, 129, 255))
]

for idx, (title, sub, stat, scol) in enumerate(anomalies):
    ay = 480 + idx * 68
    d4.rounded_rectangle([20, ay, 430, ay + 56], radius=10, fill=(15, 23, 42, 140), outline=(255, 255, 255, 12), width=1)
    d4.text((36, ay + 10), title, font=font_bold_sm, fill=(255, 255, 255, 255))
    d4.text((36, ay + 30), sub, font=font_mono_xs, fill=(100, 116, 139, 255))
    d4.text((280, ay + 18), stat, font=font_mono_xs, fill=scol)

img4.save('report/screenshots/analytics_demo.png', 'PNG')
print("Generated analytics_demo.png")
