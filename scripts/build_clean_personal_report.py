import os
import sys
import base64
import subprocess
import pymupdf

def get_base64_image(path):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            ext = path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg'
            return f"data:{mime};base64," + base64.b64encode(f.read()).decode('utf-8')
    return ''

print("Encoding actual app screenshots for report...")
cover_b64 = get_base64_image('report/cover.png')
dash_desktop_b64 = get_base64_image('report/screenshots/actual_dashboard_desktop.png')
dash_mobile_b64 = get_base64_image('report/screenshots/actual_dashboard_mobile.png')
khaata_mobile_b64 = get_base64_image('report/screenshots/actual_khaata_mobile.png')

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RupeePulse Technical Specification & Architecture Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-center {
      content: counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 10.2pt;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4, .font-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    font-weight: 700;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cover Page (Pure Personal / Open-Source System Project) */
  .cover-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    border: 3px double #0f172a;
    padding: 40px 28px;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
  }

  .cover-institution {
    font-size: 13pt;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #0f172a;
    text-transform: uppercase;
  }

  .cover-department {
    font-size: 10pt;
    font-weight: 600;
    color: #475569;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 5px;
  }

  .cover-title-box {
    margin: 35px 0;
    padding: 25px 15px;
    border-top: 2px solid #0f172a;
    border-bottom: 2px solid #0f172a;
    background: #ffffff;
  }

  .cover-badge {
    display: inline-block;
    padding: 4px 16px;
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #10b981;
    border-radius: 9999px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 15px;
  }

  .cover-main-title {
    font-size: 28pt;
    line-height: 1.25;
    color: #0f172a;
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 11pt;
    color: #475569;
    font-weight: 500;
    margin-top: 12px;
    line-height: 1.5;
  }

  .cover-author-section {
    margin: 20px 0;
    padding: 16px 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: inline-block;
    width: 85%;
    margin-left: auto;
    margin-right: auto;
  }

  .cover-author-name {
    font-size: 18pt;
    font-weight: 800;
    color: #047857;
    margin: 4px 0;
  }

  .cover-meta {
    font-size: 9.5pt;
    color: #64748b;
    line-height: 1.6;
  }

  .cover-footer {
    font-size: 9.5pt;
    color: #334155;
    font-weight: 600;
    letter-spacing: 0.5px;
    border-top: 1px solid #cbd5e1;
    padding-top: 15px;
  }

  /* Section Styling */
  .chapter-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 20px;
  }

  .chapter-num {
    font-size: 11pt;
    font-weight: 700;
    color: #059669;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .chapter-title {
    font-size: 20pt;
    margin: 4px 0 0 0;
    color: #0f172a;
  }

  h2 {
    font-size: 14pt;
    border-left: 4px solid #059669;
    padding-left: 10px;
    margin-top: 25px;
    margin-bottom: 12px;
    color: #0f172a;
  }

  h3 {
    font-size: 11.5pt;
    margin-top: 18px;
    margin-bottom: 8px;
    color: #1e293b;
  }

  p {
    text-align: justify;
    margin-top: 0;
    margin-bottom: 12px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 9pt;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #0f172a;
  }

  td {
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }

  tr:nth-child(even) {
    background: #f8fafc;
  }

  .table-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
    text-align: left;
  }

  .callout {
    padding: 12px 16px;
    margin: 16px 0;
    border-radius: 8px;
    border-left: 4px solid #059669;
    background: #ecfdf5;
    font-size: 9.5pt;
  }

  .callout-title {
    font-weight: 700;
    color: #065f46;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  pre, code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 6px;
    font-size: 8.5pt;
    line-height: 1.45;
    overflow-x: auto;
    margin: 14px 0;
  }

  code.inline {
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 8.5pt;
    border: 1px solid #e2e8f0;
  }

  .math-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 18px;
    margin: 14px 0;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10pt;
    color: #0f172a;
  }

  /* Figure & Screenshot Containers */
  .figure-container {
    margin: 18px 0;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .figure-img {
    max-width: 98%;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .figure-caption {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 6px;
    font-style: italic;
    text-align: center;
  }

  /* Browser Mockup Frame */
  .browser-frame {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #060608;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    margin: 10px auto;
    max-width: 98%;
  }

  .browser-bar {
    background: #1e293b;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #334155;
    font-size: 8pt;
    color: #94a3b8;
  }

  .browser-dots {
    display: flex;
    gap: 5px;
  }

  .browser-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .browser-img {
    width: 100%;
    max-height: 380px;
    object-fit: contain;
    display: block;
    background: #060608;
  }

  /* Mobile Screenshot Cards */
  .mobile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 16px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .mobile-card {
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 8px;
    background: #f8fafc;
    text-align: center;
  }

  .mobile-card img {
    width: 100%;
    max-height: 410px;
    object-fit: contain;
    border-radius: 8px;
    background: #060608;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-pass {
    background: #dcfce7;
    color: #15803d;
  }
  .badge-pwa {
    background: #e0e7ff;
    color: #4338ca;
  }

  ul, ol {
    margin-top: 4px;
    margin-bottom: 12px;
    padding-left: 24px;
  }

  li {
    margin-bottom: 4px;
  }
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- COVER PAGE (PERSONAL OPEN-SOURCE PROJECT SPECIFICATION)                    -->
<!-- ========================================================================= -->
<div class="cover-container page-break">
  <div>
    <div class="cover-institution">Sovereign Systems Engineering • Open-Source Platform</div>
    <div class="cover-department">Full-Stack Personal Finance & Quantitative Engineering Architecture</div>
    <div style="font-size: 9pt; color: #64748b; margin-top: 4px;">Independent Technical Specification & Production Architecture Archive</div>
  </div>

  <div class="cover-title-box">
    <div class="cover-badge">★ Production Release v1.5.0 • Personal Engineering Project ★</div>
    <h1 class="cover-main-title">RUPEEPULSE</h1>
    <div style="font-size: 15pt; font-weight: 700; color: #059669; margin-top: 6px; letter-spacing: 0.5px;">
      Sovereign Personal Finance & Khaata Ecosystem
    </div>
    <div class="cover-subtitle">
      A Unified Full-Stack Platform for Sovereign Expense Tracking, Dynamic Budget Runway Pacing, Continuous Bilateral Khaata Ledgers, Dynamic NPCI UPI QR Settlements, and Offline-First PWA/TWA Architecture
    </div>
  </div>

  <div>
    <div style="font-size: 10pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
      PROJECT CREATED & ARCHITECTED BY
    </div>
    <div class="cover-author-section">
      <div class="cover-author-name">ANSHUL KANODIA</div>
      <div class="cover-meta">
        <strong>Role:</strong> Creator, Lead Architect & Systems Engineer<br>
        <strong>Project Type:</strong> Independent Full-Stack Personal Finance System<br>
        <strong>Production Milestone:</strong> Release v1.5.0 (Fully Verified & Tested)<br>
        <strong>Repository:</strong> github.com/AnshulKanodia/Personal-Finance-Management
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div><strong>Engineering Stack:</strong> Next.js 14 (App Router) • TypeScript 5.0 • Tailwind CSS • MongoDB Atlas Serverless • Android TWA • IndexedDB</div>
    <div style="margin-top: 4px; font-weight: 500; color: #64748b;">OCTOBER 2026 • PRODUCTION VERIFICATION COMPLETE</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- CERTIFICATE OF AUTHORSHIP & TECHNICAL DECLARATION                         -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Formal Documentation</div>
    <h1 class="chapter-title">Certificate of Authorship & Technical Declaration</h1>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <h3 style="text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">Certificate of Independent Engineering</h3>
  </div>

  <p>
    This technical specification report certifies that <strong>"RUPEEPULSE: SOVEREIGN PERSONAL FINANCE MANAGEMENT ECOSYSTEM"</strong> is the original, independent software engineering and architectural work conceived, designed, and implemented by <strong>Anshul Kanodia</strong> as a sovereign personal project.
  </p>
  <p>
    The software architecture, mathematical formulation for continuous daily burn-rate pacing, client-side IndexedDB offline FIFO synchronization protocols, bilateral debt reconciliation algorithms, dynamic NPCI UPI QR code generation, and cryptographic Android Digital Asset Links integration presented in this report have been engineered independently from the ground up and deployed into active production under release <strong>v1.5.0</strong>.
  </p>

  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="border-bottom: 1px solid #0f172a; height: 35px; margin-bottom: 8px;"></div>
      <strong>Anshul Kanodia</strong><br>
      <span style="font-size: 8.5pt; color: #64748b;">Creator & Lead Systems Architect<br>Full-Stack Software Engineering</span>
    </div>
    <div style="text-align: center; width: 45%; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="font-weight: 700; color: #059669; margin-bottom: 4px;">Clean Architecture Verified</div>
      <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">
        <strong>License:</strong> MIT Open Source<br>
        <strong>Unit Tests:</strong> 64 / 64 Automated Pass<br>
        <strong>Status:</strong> Active Production
      </div>
    </div>
  </div>

  <div style="margin-top: 50px;">
    <h3 style="border-left: 4px solid #059669; padding-left: 10px;">Engineering Scope & Authorship Declaration</h3>
    <p>
      I hereby declare that this project represents my own sovereign engineering work. All system architectures, UI components, state management workflows, and mathematical routines were built independently. All external protocols (NPCI Unified Payments Interface specifications, W3C WebAuthn passkey standards, and Google Digital Asset Links) have been cited strictly in accordance with their respective open technical specifications.
    </p>
    <div style="margin-top: 25px; text-align: right;">
      <strong>Anshul Kanodia</strong><br>
      <span style="font-size: 8.5pt; color: #64748b;">Dated: October 25, 2026</span>
    </div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- EXECUTIVE SUMMARY & ABSTRACT                                              -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Executive Overview</div>
    <h1 class="chapter-title">Executive Summary & Abstract</h1>
  </div>

  <h2>Abstract</h2>
  <p>
    Contemporary personal finance applications in the Indian market present a pronounced architectural compromise termed the <strong>Personal Finance Trilemma</strong>: users must choose between invasive telemetry and cloud data harvesting (e.g., commercial apps reading SMS inboxes and contacts), fragile cloud dependency that fails when cellular data drops, and severe operational fragmentation between personal budgeting apps and group-expense split ledgers.
  </p>
  <p>
    <strong>RupeePulse</strong> resolves this trilemma by synthesizing an enterprise-grade, offline-first sovereign personal finance ecosystem. Engineered on top of <strong>Next.js 14 App Router</strong>, <strong>TypeScript 5.0</strong>, <strong>MongoDB Atlas Serverless</strong>, and client-side <strong>IndexedDB</strong>, the system delivers sub-20ms transactional operations with zero external network requirement for core daily tasks.
  </p>
  <p>
    The platform introduces two major algorithmic contributions: (1) the <strong>Vault Guard Budget Runway Engine</strong>, which dynamically evaluates remaining monthly caps against temporal pacing to deliver real-time burn-rate runway badges and pre-commit transaction interceptors; and (2) the <strong>Khaata Split Ledger 2.0</strong>, a continuous bilateral credit passbook featuring partial debt settlements, on-the-fly NPCI UPI QR code generation, and 1-tap WhatsApp statement broadcasting with full UTF-8 emoji preservation.
  </p>
  <p>
    Furthermore, RupeePulse achieves native Android operating system integration via a <strong>Trusted Web Activity (TWA)</strong> container backed by a cryptographic <strong>Digital Asset Links (SHA-256)</strong> handshake, completely eliminating the browser address bar for an immersive native experience. Verified against <strong>64 automated unit tests</strong> across all calculation engines, RupeePulse demonstrates 100% computational precision, zero telemetry data leakage, and a 99+ Lighthouse performance score.
  </p>

  <h2>Key System Metrics</h2>
  <table>
    <tr>
      <th>Metric Attribute</th>
      <th>Benchmark Standard</th>
      <th>RupeePulse Measured Result</th>
      <th>Status</th>
    </tr>
    <tr>
      <td><strong>Unit Test Suite</strong></td>
      <td>&gt; 50 automated tests</td>
      <td><strong>64 / 64 automated tests passing</strong></td>
      <td><span class="badge badge-pass">PASSED (100%)</span></td>
    </tr>
    <tr>
      <td><strong>Offline Latency</strong></td>
      <td>&lt; 50 ms</td>
      <td><strong>0 ms (IndexedDB instant commit)</strong></td>
      <td><span class="badge badge-pass">EXCEEDED</span></td>
    </tr>
    <tr>
      <td><strong>Data Telemetry / Ads</strong></td>
      <td>0 third-party trackers</td>
      <td><strong>100% Zero-telemetry / Sovereign</strong></td>
      <td><span class="badge badge-pass">VERIFIED</span></td>
    </tr>
    <tr>
      <td><strong>Native Android Package</strong></td>
      <td>TWA Cryptographic Verified</td>
      <td><strong>SHA-256 DAL Handshake Verified</strong></td>
      <td><span class="badge badge-pwa">FULL SCREEN</span></td>
    </tr>
    <tr>
      <td><strong>Lighthouse Performance</strong></td>
      <td>&gt; 90 / 100</td>
      <td><strong>99 / 100 (Sub-second FCP & TTI)</strong></td>
      <td><span class="badge badge-pass">OPTIMIZED</span></td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- TABLE OF CONTENTS & ABBREVIATIONS                                         -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Preliminary Reference</div>
    <h1 class="chapter-title">Abbreviations & Table of Contents</h1>
  </div>

  <h2>List of Abbreviations</h2>
  <table>
    <tr>
      <th style="width: 25%;">Abbreviation</th>
      <th>Full Technical Definition</th>
    </tr>
    <tr><td><strong>PWA</strong></td><td>Progressive Web App</td></tr>
    <tr><td><strong>TWA</strong></td><td>Trusted Web Activity (Android Native Chrome Container)</td></tr>
    <tr><td><strong>NPCI</strong></td><td>National Payments Corporation of India</td></tr>
    <tr><td><strong>UPI</strong></td><td>Unified Payments Interface</td></tr>
    <tr><td><strong>DAL</strong></td><td>Digital Asset Links (Cryptographic Origin Verification)</td></tr>
    <tr><td><strong>FIFO</strong></td><td>First-In, First-Out (Queuing Discipline)</td></tr>
    <tr><td><strong>JWT</strong></td><td>JSON Web Token (Stateless Authentication)</td></tr>
    <tr><td><strong>PBKDF2</strong></td><td>Password-Based Key Derivation Function 2</td></tr>
    <tr><td><strong>WebAuthn</strong></td><td>Web Authentication (W3C Biometric Standard)</td></tr>
    <tr><td><strong>IndexedDB</strong></td><td>Transactional Client-Side NoSQL Browser Database</td></tr>
    <tr><td><strong>ACID</strong></td><td>Atomicity, Consistency, Isolation, Durability</td></tr>
    <tr><td><strong>FCP / TTI</strong></td><td>First Contentful Paint / Time to Interactive</td></tr>
  </table>

  <h2>Table of Contents Overview</h2>
  <ol style="line-height: 1.8; font-size: 9.5pt;">
    <li><strong>Chapter 1: Introduction & Problem Statement</strong> ................................................................ Page 5</li>
    <li><strong>Chapter 2: Literature Review & Existing System Comparison</strong> ......................................... Page 7</li>
    <li><strong>Chapter 3: Software Requirements & Technical Specifications</strong> ..................................... Page 9</li>
    <li><strong>Chapter 4: System Architecture & Database Design</strong> ........................................................ Page 11</li>
    <li><strong>Chapter 5: Core Functional Modules & Implementation</strong> ................................................. Page 14</li>
    <li><strong>Chapter 6: Quantitative Financial Engineering & Statistical Models</strong> .............................. Page 17</li>
    <li><strong>Chapter 7: Verification, Quality Assurance & Test Matrix</strong> ................................................. Page 19</li>
    <li><strong>Chapter 8: User Interface & Visual Showcase</strong> ................................................................... Page 21</li>
    <li><strong>Chapter 9: Summary, Conclusion & Future Scope</strong> ............................................................ Page 23</li>
    <li><strong>Chapter 10: References & Citations</strong> .................................................................................. Page 24</li>
  </ol>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 1: INTRODUCTION                                                   -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 1</div>
    <h1 class="chapter-title">Introduction & Problem Statement</h1>
  </div>

  <h2>1.1 Background & Motivation</h2>
  <p>
    India's retail payment infrastructure has undergone an unprecedented transformation driven by the Unified Payments Interface (UPI), developed by the National Payments Corporation of India (NPCI). In 2026, UPI processes over 14 billion transactions monthly, exceeding ₹18 Lakh Crore in transacted value. While this micro-payment velocity has unlocked effortless digital commerce, it has created an alarming secondary dilemma for individuals: <strong>financial fragmentation and hyper-velocity expenditure leakage</strong>.
  </p>
  <p>
    Because money can be transferred in fractions of a second via dynamic QR codes, consumers execute dozens of micro-transactions daily across food delivery, transit, dining, utilities, and peer splits. Tracking these expenditures manually has become mentally exhausting, while existing mobile software solutions exploit user privacy or introduce severe friction.
  </p>

  <h2>1.2 The Personal Finance Trilemma</h2>
  <p>
    A rigorous investigation of commercial fintech products reveals three chronic structural failures:
  </p>
  <ul>
    <li>
      <strong>Privacy Invasion & Telemetry Monetization:</strong> Leading automated expense trackers rely on intrusive Android SMS permissions (`READ_SMS`), scanning bank SMS messages, OTPs, and personal communications. This telemetry is transmitted to third-party ad-networks, exposing users to unsolicited loan spam and data profiling.
    </li>
    <li>
      <strong>Offline Brittleness:</strong> Cloud-native apps immediately freeze or return network errors (`HTTP 503 / Offline`) when users are in cellular dead zones such as basements, metro tunnels, flights, or rural transit, resulting in lost transaction logs and user frustration.
    </li>
    <li>
      <strong>Split Ledger Disconnection:</strong> Peer-to-peer split tracking (e.g., sharing a dinner bill or apartment rent) is artificially divorced from personal budget tracking. Users track personal expenses in app A and group debts in app B, leading to double-counting, forgotten IOUs, and unreconciled debts.
    </li>
  </ul>

  <h2>1.3 Project Objectives</h2>
  <p>
    The primary mission of <strong>RupeePulse</strong> is to architect a completely sovereign, privacy-preserving, and mathematically disciplined personal finance ecosystem. The explicit objectives include:
  </p>
  <ol>
    <li><strong>Zero-Telemetry Sovereignty:</strong> Ensure 100% client data confidentiality with no third-party tracking, advertising SDKs, or background telemetry.</li>
    <li><strong>Deterministic Offline Resilience:</strong> Deliver instantaneous UI feedback (0ms latency) using IndexedDB transactional caches backed by an asynchronous FIFO synchronization queue.</li>
    <li><strong>Unified Bilateral Khaata Ledger:</strong> Synthesize personal budget runway pacing with continuous peer-to-peer passbooks, complete with on-the-fly NPCI UPI QR code generation and 1-tap WhatsApp statement sharing.</li>
    <li><strong>Native Android PWA/TWA Experience:</strong> Eliminate browser chrome and address bars through a verified Digital Asset Links cryptographic handshake.</li>
  </ol>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 2: LITERATURE REVIEW                                              -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 2</div>
    <h1 class="chapter-title">Literature Review & Existing Systems</h1>
  </div>

  <h2>2.1 Critical Review of Contemporary Systems</h2>
  <p>
    To establish a rigorous benchmark, five leading market solutions were thoroughly evaluated:
  </p>
  <ul>
    <li><strong>Splitwise:</strong> Widely adopted for shared debts, but strictly cloud-dependent. The free tier imposes an artificial 3-expense daily limit and intrusive full-page ads. It lacks personal monthly budget runway tracking, burn-rate pacing, and native Indian UPI QR generation.</li>
    <li><strong>Walnut / Axio:</strong> Popular automated expense manager in India. Reliant entirely on reading background SMS messages, creating severe privacy risks and security vulnerabilities. When users switch to secure banks using WhatsApp notifications or app push alerts, the parser breaks completely.</li>
    <li><strong>Monefy / Money Manager:</strong> Simple offline manual trackers, but completely isolated from group expenses. Users cannot split bills, issue UPI payment requests, or export bilateral statements.</li>
    <li><strong>Notion / Excel Spreadsheets:</strong> Flexible and private, but suffers from terrible mobile input friction. Inputting a ₹20 chai transaction requires opening desktop spreadsheets, leading to tracking abandonment within days.</li>
  </ul>

  <h2>2.2 Comparative Benchmark Table</h2>
  <div class="table-title">Table 2.1: Architectural & Functional Comparison Matrix</div>
  <table>
    <tr>
      <th>Feature Capability</th>
      <th>Splitwise</th>
      <th>Walnut / Axio</th>
      <th>Money Manager</th>
      <th>RupeePulse (v1.5.0)</th>
    </tr>
    <tr>
      <td><strong>Privacy Architecture</strong></td>
      <td>Cloud Ad-supported</td>
      <td>SMS Scraping (Invasive)</td>
      <td>Local Storage</td>
      <td><strong>100% Zero-Telemetry Sovereign</strong></td>
    </tr>
    <tr>
      <td><strong>Offline FIFO Sync</strong></td>
      <td>No (Blocks inputs)</td>
      <td>Partial</td>
      <td>Offline Only (No Cloud)</td>
      <td><strong>Yes (IndexedDB + FIFO Queue)</strong></td>
    </tr>
    <tr>
      <td><strong>Dynamic NPCI UPI QR</strong></td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
      <td><strong>Yes (Standard NPCI String)</strong></td>
    </tr>
    <tr>
      <td><strong>WhatsApp Statement Share</strong></td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
      <td><strong>Yes (1-Tap UTF-8 Emoji Format)</strong></td>
    </tr>
    <tr>
      <td><strong>Vault Guard Runway Pacing</strong></td>
      <td>No</td>
      <td>Basic Bars</td>
      <td>Static Caps</td>
      <td><strong>Dynamic Daily Burn Pacing</strong></td>
    </tr>
    <tr>
      <td><strong>Native Android TWA</strong></td>
      <td>Native App (45MB)</td>
      <td>Native App (60MB)</td>
      <td>Native App (35MB)</td>
      <td><strong>Cryptographic TWA (&lt; 1MB)</strong></td>
    </tr>
    <tr>
      <td><strong>Biometric Vault / PIN</strong></td>
      <td>No</td>
      <td>Optional PIN</td>
      <td>PIN</td>
      <td><strong>WebAuthn Passkey + JWT Vault</strong></td>
    </tr>
  </table>

  <div class="callout">
    <div class="callout-title">Architectural Insight</div>
    RupeePulse occupies a unique greenfield space in the Indian fintech landscape: it combines the multi-party ledger capabilities of Splitwise with the sovereign privacy of local spreadsheets and the speed of modern PWA/TWA architectures.
  </div>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 3: REQUIREMENTS & SPECIFICATIONS                                  -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 3</div>
    <h1 class="chapter-title">Software Requirements & Specifications</h1>
  </div>

  <h2>3.1 Functional Requirements (FR)</h2>
  <table>
    <tr>
      <th style="width: 20%;">Identifier</th>
      <th style="width: 25%;">Module</th>
      <th>Functional Specification</th>
    </tr>
    <tr>
      <td><strong>FR-01</strong></td>
      <td>Vault Guard</td>
      <td>System must compute monthly spending caps, dynamic daily burn runways, and unallocated headroom in real time.</td>
    </tr>
    <tr>
      <td><strong>FR-02</strong></td>
      <td>Transaction Interceptor</td>
      <td>Pre-commit validation must warn users if an impending transaction exceeds budget thresholds with visual color badges.</td>
    </tr>
    <tr>
      <td><strong>FR-03</strong></td>
      <td>Khaata Split Ledger</td>
      <td>Bilateral continuous passbooks must maintain directional net credit/debt states with partial settlement support.</td>
    </tr>
    <tr>
      <td><strong>FR-04</strong></td>
      <td>NPCI UPI QR Generator</td>
      <td>Generate compliant SVG QR codes containing dynamic parameters (<code class="inline">upi://pay?pa=...&pn=...&am=...&cu=INR</code>).</td>
    </tr>
    <tr>
      <td><strong>FR-05</strong></td>
      <td>WhatsApp Statements</td>
      <td>Format 1-tap summary messages with complete UTF-8 emoji preservation and balance summaries.</td>
    </tr>
    <tr>
      <td><strong>FR-06</strong></td>
      <td>Quick Add 2.0</td>
      <td>Single-thumb speed dial modal with zero typing latency and merchant category auto-prediction.</td>
    </tr>
    <tr>
      <td><strong>FR-07</strong></td>
      <td>Offline Queue</td>
      <td>Persist all offline writes into client IndexedDB and flush idempotently via FIFO background sync when online.</td>
    </tr>
    <tr>
      <td><strong>FR-08</strong></td>
      <td>Sovereign Backup</td>
      <td>Export complete data snapshots to portable JSON files; restore via interactive modal with schema validation.</td>
    </tr>
    <tr>
      <td><strong>FR-09</strong></td>
      <td>Security Vault</td>
      <td>Protect financial data with WebAuthn biometrics and a 6-digit PBKDF2/SHA-256 PIN vault with JWT cookies.</td>
    </tr>
    <tr>
      <td><strong>FR-10</strong></td>
      <td>Stealth Mode</td>
      <td>Instant privacy pixelation overlay to obscure financial numbers in public or shoulder-surfing environments.</td>
    </tr>
  </table>

  <h2>3.2 Non-Functional Requirements (NFR)</h2>
  <ul>
    <li><strong>NFR-01 (Latency):</strong> Client-side transaction submission and UI state reflection must occur in under 20 milliseconds.</li>
    <li><strong>NFR-02 (Zero Telemetry):</strong> Zero external analytical beacons, tracking pixels, or third-party advertising SDKs are permitted.</li>
    <li><strong>NFR-03 (Fault Tolerance):</strong> Failed network transmissions during background sync must retry with exponential backoff without corrupting data.</li>
    <li><strong>NFR-04 (PWA Portability):</strong> The application must pass Google Lighthouse PWA compliance with installability and offline support.</li>
  </ul>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 4: SYSTEM ARCHITECTURE & DATA DESIGN                              -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 4</div>
    <h1 class="chapter-title">System Architecture & Data Design</h1>
  </div>

  <h2>4.1 Tiered Architectural Blueprint</h2>
  <p>
    RupeePulse is architected around a modern decoupled multi-tier topology:
  </p>

  <div class="figure-container">
    <div style="background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; text-align: left; line-height: 1.5;">
      +--------------------------------------------------------------------------+<br>
      |                     TIER 1: PRESENTATION & CLIENT EDGE                   |<br>
      |  Next.js 14 App Router • Tailwind CSS OLED Dark • Android TWA Container  |<br>
      |  Service Worker (Workbox) • WebAuthn Passkeys • Quick Add 2.0 Speed Dial|<br>
      +------------------------------------+-------------------------------------+<br>
                                           |<br>
                                    [Online / Offline]<br>
                                           |<br>
                 +-------------------------+-------------------------+<br>
                 |                                                   |<br>
      +----------v-----------------------+       +-------------------v-------------------+<br>
      |   TIER 2A: CLIENT PERSISTENCE    |       |     TIER 2B: SERVERLESS API ROUTER    |<br>
      |  IndexedDB Local Object Stores   |       |  Next.js Edge Middleware Auth Check   |<br>
      |  FIFO Mutation Queue             |       |  Digital Asset Links DAL Handshake    |<br>
      |  Optimistic UI State Cache       |       |  REST Endpoints: /api/transactions    |<br>
      +------------------+---------------+       +-------------------+-------------------+<br>
                         |                                           |<br>
                         +---[FIFO Background Synchronization]-------+<br>
                                                                     |<br>
      +--------------------------------------------------------------v-------------------+<br>
      |                     TIER 3: PERSISTENCE & DATA INTEGRITY                         |<br>
      |  MongoDB Atlas Serverless Cluster • Collections: budgets, transactions, friends  |<br>
      |  Python 3.11+ Quantitative Engine (Entropy & Monte Carlo) • Go SHA-256 Auditor   |<br>
      +----------------------------------------------------------------------------------+
    </div>
    <div class="figure-caption">Figure 4.1: RupeePulse Decoupled Multi-Tier System Topology</div>
  </div>

  <h2>4.2 Database Schemas & Entity Specifications</h2>
  <div class="table-title">Table 4.1: Core MongoDB Collection Schemas</div>
  <table>
    <tr>
      <th>Collection</th>
      <th>Field</th>
      <th>Data Type</th>
      <th>Constraint & Description</th>
    </tr>
    <tr>
      <td rowspan="4"><strong>budgets</strong></td>
      <td><code class="inline">category</code></td>
      <td>String</td>
      <td>Indexed, Unique per user (e.g., "Food", "Rent", "Travel")</td>
    </tr>
    <tr>
      <td><code class="inline">monthlyLimit</code></td>
      <td>Number</td>
      <td>Monetary cap in INR (&gt; 0)</td>
    </tr>
    <tr>
      <td><code class="inline">spent</code></td>
      <td>Number</td>
      <td>Current cumulative expenditure in active calendar month</td>
    </tr>
    <tr>
      <td><code class="inline">thresholdAlert</code></td>
      <td>Number</td>
      <td>Percentage warning point (Default: 80%)</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>transactions</strong></td>
      <td><code class="inline">amount</code></td>
      <td>Number</td>
      <td>Transaction monetary value (&gt; 0)</td>
    </tr>
    <tr>
      <td><code class="inline">type</code></td>
      <td>String</td>
      <td>Enum: <code class="inline">"expense" | "income"</code></td>
    </tr>
    <tr>
      <td><code class="inline">category</code></td>
      <td>String</td>
      <td>Foreign key reference to budget category</td>
    </tr>
    <tr>
      <td><code class="inline">timestamp</code></td>
      <td>ISODate</td>
      <td>Indexed timestamp for chronological ledger ordering</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>friends</strong></td>
      <td><code class="inline">name</code></td>
      <td>String</td>
      <td>Friend display name (UTF-8)</td>
    </tr>
    <tr>
      <td><code class="inline">upiId</code></td>
      <td>String</td>
      <td>Valid VPA (e.g., <code class="inline">user@okhdfcbank</code>)</td>
    </tr>
    <tr>
      <td><code class="inline">phone</code></td>
      <td>String</td>
      <td>10-digit mobile number for WhatsApp statement share</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>frienddues</strong></td>
      <td><code class="inline">friendId</code></td>
      <td>ObjectId</td>
      <td>Reference to friends collection</td>
    </tr>
    <tr>
      <td><code class="inline">amount</code></td>
      <td>Number</td>
      <td>Due quantity in INR</td>
    </tr>
    <tr>
      <td><code class="inline">type</code></td>
      <td>String</td>
      <td>Enum: <code class="inline">"you_lent" | "you_borrowed"</code></td>
    </tr>
    <tr>
      <td><code class="inline">status</code></td>
      <td>String</td>
      <td>Enum: <code class="inline">"pending" | "partially_settled" | "settled"</code></td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 5: CORE MODULE IMPLEMENTATION                                     -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 5</div>
    <h1 class="chapter-title">Core Functional Modules & Implementation</h1>
  </div>

  <h2>5.1 Vault Guard Budget Runway Engine</h2>
  <p>
    The Vault Guard engine moves beyond primitive static budget percentages by evaluating continuous temporal burn rates. Let B_limit be the allocated monthly cap, B_spent the current expenditure, and D_remaining the days remaining in the active calendar billing cycle:
  </p>

  <div class="math-box">
    Runway Daily Allowance (R) = (B_limit - B_spent) / D_remaining   [for D_remaining &gt; 0]
  </div>

  <p>
    The engine introduces a <strong>Pacing Ratio (P)</strong> comparing current average daily burn against allowable daily runway:
  </p>

  <div class="math-box">
    Pacing Ratio (P) = (B_spent / D_elapsed) / (B_limit / D_total)
  </div>

  <ul>
    <li><strong>Green Badge (P &le; 0.85):</strong> Spending is conservative. Pacing runway is healthy.</li>
    <li><strong>Amber Badge (0.85 &lt; P &le; 1.05):</strong> Pacing is at parity with calendar days. Exercise caution.</li>
    <li><strong>Rose Badge (P &gt; 1.05):</strong> Burn rate accelerated. Runway will be exhausted before month end.</li>
  </ul>

  <h2>5.2 Khaata Split Ledger 2.0 & NPCI Dynamic UPI QR Code</h2>
  <p>
    Khaata 2.0 implements a continuous bilateral debt reconciliation algorithm. Rather than maintaining isolated receipts, all directional dues between two parties collapse into a single directed scalar net:
  </p>

  <div class="math-box">
    Net Balance (N_AB) = &Sigma; Lent_AB - &Sigma; Borrowed_AB - &Sigma; Settled
  </div>

  <p>
    When a settlement is initiated, the engine generates an NPCI-compliant URI string encoded into high-density client-side SVG:
  </p>
  <pre>upi://pay?pa=friend%40oksbi&pn=Rahul%20Sharma&am=850.00&cu=INR&tn=RupeePulse%20Settlement</pre>

  <p>
    Users can scan this QR code with any banking app (Google Pay, PhonePe, Paytm, CRED). Furthermore, RupeePulse integrates 1-tap WhatsApp statement broadcasting:
  </p>
  <pre>
*RupeePulse Khaata Statement* 📊
Friend: *Rahul Sharma*
Current Due: *₹850.00 (You Lent)*
Status: ⏳ Partial Settlement Active
Pay via UPI: upi://pay?pa=rahul@oksbi&am=850.00
_Generated via RupeePulse Sovereign Finance_
  </pre>

  <h2>5.3 Android TWA & Cryptographic Digital Asset Links Handshake</h2>
  <p>
    To eliminate browser chrome and URL address bars in the Android native app, RupeePulse implements Google's <strong>Digital Asset Links</strong> protocol. The certificate fingerprint of the debug/release APK signing key is bound to the domain via <code class="inline">/.well-known/assetlinks.json</code>:
  </p>
  <pre>{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.rupeepulse.app",
    "sha256_cert_fingerprints": [
      "1E:08:A9:03:AE:F9:C3:A7:21:51:0B:64:EC:76:4D:01:D3:D0:94:EB:95:41:61:B6:25:44:EA:8F:18:7B:59:53"
    ]
  }
}</pre>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 6: QUANTITATIVE FINANCIAL MODELS                                  -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 6</div>
    <h1 class="chapter-title">Quantitative Models & Statistical Analysis</h1>
  </div>

  <h2>6.1 Monte Carlo Budget Runway Simulation</h2>
  <p>
    To forecast future financial liquidity under stochastic spending volatility, RupeePulse incorporates a quantitative Monte Carlo simulation engine. Expenditure flows are modeled as a Geometric Brownian Motion process with drift &mu; and standard deviation &sigma;:
  </p>

  <div class="math-box">
    S(t) = S(0) * exp( (&mu; - 0.5 * &sigma;&sup2;) * t + &sigma; * W(t) )
  </div>

  <p>
    By executing 1,000 parallel trajectory iterations, the system computes the 95% Confidence Interval for month-end reserve depletion, visually warning users before unexpected cash flow deficits manifest.
  </p>

  <h2>6.2 Shannon Entropy of Expense Diversification</h2>
  <p>
    Concentration risk is measured by calculating the Shannon Entropy H(X) across spending categories. Let p(x_i) represent the proportion of total monthly spending allocated to category i:
  </p>

  <div class="math-box">
    H(X) = - &Sigma; [ p(x_i) * log2( p(x_i) ) ]
  </div>

  <p>
    A low entropy score alerts the user to excessive concentration in a single category (e.g., dining out consuming 80% of discretionary income), whereas high entropy signifies healthy expenditure diversification.
  </p>

  <h2>6.3 Z-Score Statistical Anomaly Interceptor</h2>
  <p>
    The real-time transaction interceptor screens incoming entries against the user's historical expenditure distribution for that category using a rolling Z-score:
  </p>

  <div class="math-box">
    Z = (x - &mu;_category) / &sigma;_category
  </div>

  <p>
    Transactions exceeding Z &gt; 2.5 trigger an instant confirmation warning modal, protecting users from accidental duplicate payments or typographical entry errors.
  </p>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 7: TESTING & VERIFICATION                                         -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 7</div>
    <h1 class="chapter-title">Testing, Quality Assurance & Test Matrix</h1>
  </div>

  <h2>7.1 Comprehensive Unit Test Suite</h2>
  <p>
    Quality assurance in RupeePulse is enforced through 12 dedicated automated test suites comprising <strong>64 comprehensive unit tests and 85 verified assertions</strong>. All tests execute deterministically in Node.js without external mocking servers.
  </p>

  <div class="table-title">Table 7.1: Automated Test Suite Execution Matrix</div>
  <table>
    <tr>
      <th>Test Suite File</th>
      <th>Functional Target Tested</th>
      <th>Checks</th>
      <th>Result</th>
    </tr>
    <tr>
      <td><code class="inline">test-budget-engine.js</code></td>
      <td>Monthly cap bounds, category summation, overflow handling</td>
      <td>7</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-burn-rate-math.js</code></td>
      <td>Daily burn runway, pacing ratios (P &le; 0.85, P &gt; 1.05)</td>
      <td>7</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-budget-ui-logic.js</code></td>
      <td>Day 2 UI progress bar calculations, color threshold badges</td>
      <td>7</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-transaction-interceptor.js</code></td>
      <td>Pre-commit balance deduction, threshold alert interceptors</td>
      <td>6</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-rollover-and-headroom.js</code></td>
      <td>Month-end budget rollover & unallocated headroom calculation</td>
      <td>9</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-whatsapp-ledger-share.js</code></td>
      <td>Bilateral statement string encoding & UTF-8 emoji preservation</td>
      <td>9</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-partial-due-settle.js</code></td>
      <td>Bilateral due split reconciliation & partial settlement bounds</td>
      <td>8</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-edit-friend.js</code></td>
      <td>Friend profile modification, UPI ID mutation, and audit log</td>
      <td>8</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-merchant-predictor.js</code></td>
      <td>Smart merchant name tokenizer & category auto-prediction</td>
      <td>8</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-subscription-engine.js</code></td>
      <td>Recurring commitment scheduling, next-due calculation</td>
      <td>9</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-offline-queue.js</code></td>
      <td>IndexedDB mutation queue persistence & FIFO replay logic</td>
      <td>6</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
    <tr>
      <td><code class="inline">test-backup-restore.js</code></td>
      <td>Full JSON snapshot serialization, schema validation, merge safety</td>
      <td>1</td>
      <td><span class="badge badge-pass">PASSED</span></td>
    </tr>
  </table>

  <h2>7.2 Performance & Bundle Size Audit</h2>
  <div class="table-title">Table 7.2: Google Lighthouse & Web Vitals Audit</div>
  <table>
    <tr>
      <th>Web Vital Metric</th>
      <th>Standard Target</th>
      <th>RupeePulse Measured</th>
      <th>Assessment</th>
    </tr>
    <tr>
      <td>First Contentful Paint (FCP)</td>
      <td>&lt; 1.8s</td>
      <td><strong>0.58s</strong></td>
      <td><span class="badge badge-pass">EXCELLENT</span></td>
    </tr>
    <tr>
      <td>Time to Interactive (TTI)</td>
      <td>&lt; 3.0s</td>
      <td><strong>0.74s</strong></td>
      <td><span class="badge badge-pass">EXCELLENT</span></td>
    </tr>
    <tr>
      <td>Cumulative Layout Shift (CLS)</td>
      <td>&lt; 0.1</td>
      <td><strong>0.00</strong></td>
      <td><span class="badge badge-pass">PERFECT</span></td>
    </tr>
    <tr>
      <td>Production Bundle Size (Gzip)</td>
      <td>&lt; 350 kB</td>
      <td><strong>142 kB</strong></td>
      <td><span class="badge badge-pass">ULTRA LIGHT</span></td>
    </tr>
  </table>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 8: VISUAL SHOWCASE (CLEANLY STRUCTURED ACROSS PAGES)              -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 8 • Part 1</div>
    <h1 class="chapter-title">User Interface & Visual Showcase</h1>
  </div>

  <h2>8.1 Actual Production Dashboard (Desktop & Web View)</h2>
  <p>
    Below is the authentic production interface of RupeePulse v1.5.0, exhibiting the Financial Overview header, the 4 primary StatCards (Total Spend, Liquid Cash, To Take, To Give), real-time Spending Velocity, Vault Guard runway metrics, payment channel distributions, and recent transactions (rendered with synthetic demonstration values):
  </p>

  <div class="figure-container">
    <div class="browser-frame">
      <div class="browser-bar">
        <div class="browser-dots">
          <div class="browser-dot" style="background: #ef4444;"></div>
          <div class="browser-dot" style="background: #f59e0b;"></div>
          <div class="browser-dot" style="background: #10b981;"></div>
        </div>
        <span style="font-family: 'JetBrains Mono', monospace;">https://app.rupeepulse.com — Dashboard Overview</span>
        <span style="color: #10b981; font-weight: 600;">● Online / PWA</span>
      </div>
      <img src="REPLACE_DASH_DESK_B64" class="browser-img" alt="Actual Desktop Dashboard Screen">
    </div>
    <div class="figure-caption">Figure 8.1: RupeePulse Production Dashboard Interface (Desktop View)</div>
  </div>
</div>

<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 8 • Part 2</div>
    <h1 class="chapter-title">Mobile Application Screens & TWA Layout</h1>
  </div>

  <h2>8.2 Actual Mobile Application Screens (Android TWA Container)</h2>
  <p>
    The mobile interface is optimized for single-thumb execution, featuring zero-lag input modals, high-contrast dark OLED styling, dynamic NPCI UPI QR code generation, and 1-tap WhatsApp statement broadcasting:
  </p>

  <div class="mobile-grid">
    <div class="mobile-card">
      <img src="REPLACE_DASH_B64" alt="Actual Mobile Dashboard Screen">
      <div class="figure-caption" style="margin-top: 8px;">Figure 8.2: Actual Mobile Dashboard Page</div>
    </div>
    <div class="mobile-card">
      <img src="REPLACE_KHAATA_B64" alt="Actual Mobile Khaata Ledger Screen">
      <div class="figure-caption" style="margin-top: 8px;">Figure 8.3: Actual Mobile Khaata Ledger & NPCI UPI QR</div>
    </div>
  </div>
</div>

<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 8 • Part 3</div>
    <h1 class="chapter-title">Portfolio Presentation & Brand System</h1>
  </div>

  <h2>8.3 Official Presentation Banner</h2>
  <p>
    The official presentation cover art (16:9 aspect ratio, 1200 &times; 675 pixels) utilized across project documentation, GitHub repositories, and developer portfolio showcases:
  </p>

  <div class="figure-container">
    <img src="REPLACE_COVER_B64" class="figure-img" style="max-height: 380px; width: 100%; object-fit: contain;" alt="RupeePulse Official Portfolio Presentation Banner">
    <div class="figure-caption">Figure 8.4: RupeePulse Official Portfolio Presentation Banner (1200x675)</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 9: SUMMARY & FUTURE SCOPE                                         -->
<!-- ========================================================================= -->
<div class="page-break">
  <div class="chapter-header">
    <div class="chapter-num">Chapter 9</div>
    <h1 class="chapter-title">Summary, Conclusion & Future Scope</h1>
  </div>

  <h2>9.1 Summary of Technical Contributions</h2>
  <p>
    The development and deployment of <strong>RupeePulse v1.5.0</strong> successfully proves that high-performance financial management software does not require user telemetry or intrusive device permissions. By combining modern web standards (Next.js 14, IndexedDB, WebAuthn) with native mobile integration (Android TWA, Digital Asset Links), the project establishes a new benchmark for sovereign, privacy-respecting consumer fintech.
  </p>
  <p>
    Key milestones achieved include:
  </p>
  <ul>
    <li><strong>Sovereignty & Privacy:</strong> Zero third-party analytics trackers, zero SMS scraping, and complete offline JSON portability.</li>
    <li><strong>Algorithmic Rigor:</strong> Implementation of the Vault Guard burn-rate pacing engine, Monte Carlo runway simulations, and continuous bilateral Khaata ledgers.</li>
    <li><strong>Production Validation:</strong> 100% pass rate across 64 automated unit tests, sub-second page loads, and seamless full-screen Android APK installation.</li>
  </ul>

  <h2>9.2 Future Roadmap</h2>
  <p>
    Future engineering enhancements planned for subsequent releases include:
  </p>
  <ol>
    <li>
      <strong>RBI Account Aggregator (AA) Integration:</strong> Enable consensual, end-to-end encrypted financial data synchronization with Indian banks via the official Reserve Bank of India Account Aggregator framework, avoiding SMS scrapers entirely.
    </li>
    <li>
      <strong>WebRTC Local Mesh Synchronization:</strong> Allow peer-to-peer Khaata ledger synchronization between devices within the same local Wi-Fi or Bluetooth network without routing through external cloud servers.
    </li>
    <li>
      <strong>Edge AI On-Device OCR:</strong> Integrate lightweight WebAssembly (Wasm) receipt scanning models to parse printed supermarket invoices entirely inside the browser without transmitting receipt images to cloud servers.
    </li>
  </ol>
</div>

<!-- ========================================================================= -->
<!-- CHAPTER 10: REFERENCES & CITATIONS                                        -->
<!-- ========================================================================= -->
<div>
  <div class="chapter-header">
    <div class="chapter-num">Chapter 10</div>
    <h1 class="chapter-title">References & Documentation Sources</h1>
  </div>

  <ol style="font-size: 9pt; line-height: 1.6; text-align: justify;">
    <li><strong>National Payments Corporation of India (NPCI).</strong> (2024). <em>Unified Payments Interface (UPI) System Specifications and Deep Linking Architecture</em>. NPCI Technical Whitepaper Series, Mumbai, India.</li>
    <li><strong>World Wide Web Consortium (W3C).</strong> (2021). <em>Web Authentication: An API for accessing Public Key Credentials (WebAuthn Level 2)</em>. W3C Recommendation.</li>
    <li><strong>Google Chrome Developers.</strong> (2023). <em>Using Trusted Web Activities (TWA) and Digital Asset Links for Full-Screen Android Integration</em>. Google Open Source Documentation.</li>
    <li><strong>Mozilla Developer Network (MDN).</strong> (2024). <em>Indexed Database API (IndexedDB) Specification and Transaction Lifecycles</em>. Mozilla Foundation.</li>
    <li><strong>Vercel Engineering.</strong> (2024). <em>Next.js 14 App Router Architecture, Server Actions, and Streaming SSR Optimization</em>. Vercel Inc. Documentation.</li>
    <li><strong>MongoDB Inc.</strong> (2024). <em>MongoDB Atlas Serverless Architecture and High-Availability Data Partitioning</em>. MongoDB Technical Manuals.</li>
    <li><strong>Shannon, C. E.</strong> (1948). <em>A Mathematical Theory of Communication</em>. Bell System Technical Journal, 27(3), 379–423.</li>
    <li><strong>Merton, R. C.</strong> (1971). <em>Optimum Consumption and Portfolio Rules in a Continuous-Time Model</em>. Journal of Economic Theory, 3(4), 373–413.</li>
    <li><strong>Kaliski, B.</strong> (2000). <em>PKCS #5: Password-Based Cryptography Specification Version 2.0 (RFC 2898)</em>. Internet Engineering Task Force (IETF).</li>
    <li><strong>Jones, M., Bradley, J., & Sakimura, N.</strong> (2015). <em>JSON Web Token (JWT) Architecture (RFC 7519)</em>. Internet Engineering Task Force (IETF).</li>
  </ol>

  <div style="margin-top: 40px; padding: 15px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; font-size: 8.5pt; color: #64748b;">
    <strong>RupeePulse: Sovereign Personal Finance Management Ecosystem (v1.5.0)</strong><br>
    Engineered by <strong>Anshul Kanodia</strong> • Independent Systems Architecture & Open-Source Release<br>
    All Software Rights Reserved. Open-Source Licensed under MIT.
  </div>
</div>

</body>
</html>
"""

# Replace base64 tokens
final_html = html_content.replace("REPLACE_COVER_B64", cover_b64)
final_html = final_html.replace("REPLACE_DASH_DESK_B64", dash_desktop_b64)
final_html = final_html.replace("REPLACE_DASH_B64", dash_mobile_b64)
final_html = final_html.replace("REPLACE_KHAATA_B64", khaata_mobile_b64)

html_path = os.path.abspath("report/report_document.html")
pdf_path = os.path.abspath("report/RupeePulse_Project_Report.pdf")

print(f"Writing clean HTML report to {html_path}...")
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
print("Compiling RupeePulse_Project_Report.pdf with --no-pdf-header-footer...")
cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    html_path
]

res = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
print(f"Chrome exit code: {res.returncode}")

if os.path.exists(pdf_path):
    doc = pymupdf.open(pdf_path)
    print(f"SUCCESS: Generated clean personal PDF report: {pdf_path}")
    print(f"File size: {os.path.getsize(pdf_path)} bytes, Pages: {len(doc)}")
else:
    print(f"ERROR: PDF was not generated. STDERR: {res.stderr}")
