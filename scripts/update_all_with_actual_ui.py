import os
import subprocess
import pymupdf
import base64

def get_base64_image(path):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            ext = path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg'
            return f"data:{mime};base64," + base64.b64encode(f.read()).decode('utf-8')
    return ''

print("Encoding actual app screenshots...")
cover_b64 = get_base64_image('report/cover.png')
dash_desktop_b64 = get_base64_image('report/screenshots/actual_dashboard_desktop.png')
dash_mobile_b64 = get_base64_image('report/screenshots/actual_dashboard_mobile.png')
khaata_mobile_b64 = get_base64_image('report/screenshots/actual_khaata_mobile.png')

print("Generating updated index.html with Actual Dashboard showcase...")

# Read current index.html
with open('report/index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

# Add the Actual App Dashboard showcase section before the Footer Action Buttons if not already present
actual_showcase_html = """
                <!-- 6. Actual Application Interface Showcase -->
                <section class="space-y-6">
                    <h3 class="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                        <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span> Actual RupeePulse Dashboard & Mobile Interface
                    </h3>
                    <p class="text-slate-300 text-sm md:text-base leading-relaxed">
                        Below is the authentic production interface of <strong>RupeePulse v1.5.0</strong>, showcasing the real Financial Overview dashboard, 4 core stat cards, dynamic Vault Guard burn-rate pacing, and bilateral Khaata split ledger with NPCI UPI QR integration (loaded with random synthetic demo data for privacy):
                    </p>

                    <!-- Actual Desktop Dashboard Screenshot -->
                    <div class="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 group">
                        <div class="px-4 py-2.5 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between text-xs text-zinc-400">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                                <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                                <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                                <span class="ml-2 font-mono text-[11px] text-zinc-300">RupeePulse — Financial Overview (Desktop View)</span>
                            </div>
                            <span class="font-mono text-[11px] text-emerald-400">v1.5.0 Production Ready</span>
                        </div>
                        <img src="./screenshots/actual_dashboard_desktop.png" alt="Actual RupeePulse Desktop Dashboard" class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]">
                    </div>

                    <!-- Dual Mobile Screens (Actual Dashboard + Actual Khaata) -->
                    <div class="grid md:grid-cols-2 gap-6 pt-2">
                        <div class="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-950 p-3">
                            <div class="text-xs font-semibold text-emerald-400 mb-2 font-mono">Mobile View: Actual Dashboard Page</div>
                            <div class="rounded-xl overflow-hidden border border-white/5 bg-black">
                                <img src="./screenshots/actual_dashboard_mobile.png" alt="Actual Mobile Dashboard Screen" class="w-full h-auto object-cover">
                            </div>
                            <p class="text-[11px] text-zinc-400 mt-2 text-center">4 StatCards, Vault Guard Runway Pacing & Recent Transactions</p>
                        </div>
                        
                        <div class="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-950 p-3">
                            <div class="text-xs font-semibold text-indigo-400 mb-2 font-mono">Mobile View: Actual Khaata Split Ledger</div>
                            <div class="rounded-xl overflow-hidden border border-white/5 bg-black">
                                <img src="./screenshots/actual_khaata_mobile.png" alt="Actual Mobile Khaata Ledger Screen" class="w-full h-auto object-cover">
                            </div>
                            <p class="text-[11px] text-zinc-400 mt-2 text-center">Bilateral Passbooks & Dynamic NPCI UPI QR Code Settlement</p>
                        </div>
                    </div>
                </section>
"""

if "Actual RupeePulse Dashboard & Mobile Interface" not in idx_content:
    # Insert right before "<!-- 6. Quantitative Verification & Metrics -->"
    target = "<!-- 6. Quantitative Verification & Metrics -->"
    idx_content = idx_content.replace(target, actual_showcase_html + "\n                " + target)
    with open('report/index.html', 'w', encoding='utf-8') as f:
        f.write(idx_content)
    print("Updated report/index.html successfully with actual dashboard images.")

# Rebuild PDF Report with Actual Screenshots in Chapter 8
print("Recompiling PDF Report with actual app screenshots...")

with open('scripts/generate_pdf_report.py', 'r', encoding='utf-8') as f:
    pdf_script_content = f.read()

# Update images in pdf generator
updated_pdf_script = pdf_script_content.replace(
    "dash_b64 = get_base64_image('report/screenshots/dashboard_demo.png')",
    "dash_b64 = get_base64_image('report/screenshots/actual_dashboard_mobile.png')\n"
    "dash_desk_b64 = get_base64_image('report/screenshots/actual_dashboard_desktop.png')"
).replace(
    "khaata_b64 = get_base64_image('report/screenshots/khaata_demo.png')",
    "khaata_b64 = get_base64_image('report/screenshots/actual_khaata_mobile.png')"
)

# In Chapter 8, add the actual desktop dashboard image as Figure 8.1
old_ch8_target = """  <div class="screenshot-grid">
    <div class="screenshot-card">
      <img src="REPLACE_DASH_B64" alt="Dashboard Screen">
      <div class="screenshot-label">Figure 8.1: Executive Financial Dashboard & Live Overview</div>
    </div>"""

new_ch8_content = """  <!-- Actual Desktop Dashboard -->
  <div class="figure-container">
    <img src="REPLACE_DASH_DESK_B64" class="figure-img" alt="Actual Desktop Dashboard Screen">
    <div class="figure-caption">Figure 8.1: RupeePulse Actual Financial Overview Dashboard (Desktop View)</div>
  </div>

  <h2>8.2 Native Mobile App Interface (Actual Screens)</h2>
  <div class="screenshot-grid">
    <div class="screenshot-card">
      <img src="REPLACE_DASH_B64" alt="Actual Dashboard Mobile Screen">
      <div class="screenshot-label">Figure 8.2: Actual Dashboard Page (Mobile View)</div>
    </div>
    <div class="screenshot-card">
      <img src="REPLACE_KHAATA_B64" alt="Actual Khaata Split Screen">
      <div class="screenshot-label">Figure 8.3: Actual Khaata Split Ledger & UPI Settlement</div>
    </div>
  </div>"""

if "REPLACE_DASH_DESK_B64" not in updated_pdf_script:
    updated_pdf_script = updated_pdf_script.replace(
        'final_html = html_template.replace("REPLACE_COVER_B64", cover_b64)',
        'final_html = html_template.replace("REPLACE_COVER_B64", cover_b64)\nfinal_html = final_html.replace("REPLACE_DASH_DESK_B64", dash_desk_b64)'
    )
    # Replace Chapter 8 visual showcase
    target_ch8 = """  <h2>8.1 Mobile App User Experience & Core Screens (Synthetic Demo Data)</h2>
  <p>
    Below are actual production UI renderings of RupeePulse v1.5.0 executing within the native Android TWA environment, loaded with synthetic test records demonstrating zero-telemetry client execution:
  </p>

  <div class="screenshot-grid">
    <div class="screenshot-card">
      <img src="REPLACE_DASH_B64" alt="Dashboard Screen">
      <div class="screenshot-label">Figure 8.1: Executive Financial Dashboard & Live Overview</div>
    </div>
    <div class="screenshot-card">
      <img src="REPLACE_KHAATA_B64" alt="Khaata Split Screen">
      <div class="screenshot-label">Figure 8.2: Khaata Bilateral Split Ledger & UPI Settlement</div>
    </div>
    <div class="screenshot-card">
      <img src="REPLACE_VAULT_B64" alt="Vault Guard Screen">
      <div class="screenshot-label">Figure 8.3: Vault Guard Budget Runway & Daily Pacing</div>
    </div>
    <div class="screenshot-card">
      <img src="REPLACE_ANALYTICS_B64" alt="Analytics Screen">
      <div class="screenshot-label">Figure 8.4: Statistical Analytics & Entropy Diversification</div>
    </div>
  </div>"""

    replacement_ch8 = """  <h2>8.1 Actual Production Dashboard (Desktop & Web View)</h2>
  <p>
    Below is the authentic production Financial Overview interface of RupeePulse v1.5.0, exhibiting the 4 primary StatCards (Total Spend, Liquid Cash, To Take, To Give), real-time Spending Velocity, Vault Guard runway metrics, and recent transactions (rendered with synthetic demonstration values):
  </p>

  <div class="figure-container">
    <img src="REPLACE_DASH_DESK_B64" class="figure-img" alt="Actual Desktop Dashboard Screen">
    <div class="figure-caption">Figure 8.1: RupeePulse Production Dashboard Interface (Desktop View)</div>
  </div>

  <h2>8.2 Actual Mobile Application Screens (Android TWA Container)</h2>
  <div class="screenshot-grid">
    <div class="screenshot-card">
      <img src="REPLACE_DASH_B64" alt="Actual Mobile Dashboard Screen">
      <div class="screenshot-label">Figure 8.2: Actual Mobile Dashboard Page</div>
    </div>
    <div class="screenshot-card">
      <img src="REPLACE_KHAATA_B64" alt="Actual Mobile Khaata Ledger Screen">
      <div class="screenshot-label">Figure 8.3: Actual Mobile Khaata Ledger & NPCI UPI QR</div>
    </div>
  </div>"""

    updated_pdf_script = updated_pdf_script.replace(target_ch8, replacement_ch8)

with open('scripts/generate_pdf_report.py', 'w', encoding='utf-8') as f:
    f.write(updated_pdf_script)

print("Running updated generate_pdf_report.py...")
res = subprocess.run([sys.executable, 'scripts/generate_pdf_report.py'], capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
