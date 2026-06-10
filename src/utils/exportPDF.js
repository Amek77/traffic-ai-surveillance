export const exportViolationPDF = (violation) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download the PDF challan.');
    return;
  }

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/600x400/0a0a0f/ffffff?text=No+Image+Available';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
  };

  const formattedDate = new Date(violation.timestamp || violation.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const violationsHTML = violation.violations && violation.violations.length > 0 
    ? violation.violations.map(v => `<span class="badge">${v}</span>`).join(' ')
    : '<span class="badge badge-compliant">NO VIOLATION (COMPLIANT)</span>';

  const fineRows = violation.fineBreakdown && violation.fineBreakdown.length > 0
    ? violation.fineBreakdown.map(item => `
        <tr>
          <td><strong>${item.violation}</strong></td>
          <td>${item.section || 'N/A'}</td>
          <td>${item.penalty || 'N/A'}</td>
          <td style="text-align: right; font-weight: bold;">₹${item.amount}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="text-align: center; color: #16a34a; padding: 15px 10px;">No offenses detected. No fine applicable.</td></tr>`;

  printWindow.document.write(`
    <html>
      <head>
        <title>Challan_${violation.plateNumber || 'UNKNOWN'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 14px;
            line-height: 1.5;
          }
          .challan-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .header-left h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #111827;
          }
          .header-left p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-right {
            text-align: right;
          }
          .challan-title {
            font-size: 18px;
            font-weight: 700;
            color: #dc2626;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .challan-id {
            font-size: 12px;
            color: #4b5563;
            margin: 4px 0 0 0;
            font-family: monospace;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #f3f4f6;
          }
          .meta-item strong {
            display: block;
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .meta-item span {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }
          .image-section {
            margin-bottom: 25px;
            text-align: center;
          }
          .image-section img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            max-height: 350px;
            object-fit: contain;
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin: 25px 0 12px 0;
            letter-spacing: 0.5px;
          }
          .badge {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
            margin-right: 5px;
          }
          .badge-compliant {
            background: #d1fae5;
            color: #065f46;
            border-color: #a7f3d0;
          }
          .fine-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .fine-table th {
            text-align: left;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            color: #4b5563;
            border-bottom: 1px solid #d1d5db;
            background: #f3f4f6;
          }
          .fine-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .total-row {
            background: #f9fafb;
          }
          .total-row td {
            border-top: 2px solid #111827;
            border-bottom: none;
            padding: 15px 10px;
          }
          .narrative {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 15px;
            border-radius: 6px;
            font-style: italic;
            font-size: 13px;
            color: #92400e;
            margin-top: 10px;
            line-height: 1.6;
          }
          .footer-note {
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            font-size: 11px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature {
            text-align: right;
          }
          .signature-line {
            width: 150px;
            border-bottom: 1px solid #9ca3af;
            margin-bottom: 5px;
            height: 40px;
          }
          @media print {
            body {
              padding: 0;
            }
            .challan-container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="challan-container">
          <div class="header">
            <div class="header-left">
              <h1>SVDS TRAFFIC ENFORCEMENT</h1>
              <p>Smart Traffic Violation Detection System &bull; Govt of India</p>
            </div>
            <div class="header-right">
              <div class="challan-title">Official Traffic Challan</div>
              <div class="challan-id">ID: ${violation.id || 'N/A'}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Vehicle Registration No.</strong>
              <span>${violation.plateNumber || 'NOT DETECTED'}</span>
            </div>
            <div class="meta-item">
              <strong>Date & Time of Infraction</strong>
              <span>${formattedDate}</span>
            </div>
            <div class="meta-item">
              <strong>Threat Severity</strong>
              <span>${violation.severity || 'NONE'}</span>
            </div>
            <div class="meta-item">
              <strong>Checkpoint Location / GPS Coordinates</strong>
              <span>${violation.location?.address || 'Challan Checkpoint, Hyderabad, India'} (${violation.location?.latitude?.toFixed(4) || '17.3850'}, ${violation.location?.longitude?.toFixed(4) || '78.4867'})</span>
            </div>
          </div>

          <div class="section-title">Offense Evidence Snapshot</div>
          <div class="image-section">
            <img src="${getImageUrl(violation.imageUrl)}" alt="Evidence Snap" />
          </div>

          <div class="section-title">Detected Offense Classifications</div>
          <div style="margin-bottom: 15px;">
            ${violationsHTML}
          </div>

          <div class="section-title">Motor Vehicle Act Challan Details</div>
          <table class="fine-table">
            <thead>
              <tr>
                <th>Violation</th>
                <th>MVA Section</th>
                <th>Penalty Guidelines</th>
                <th style="text-align: right;">Fine Amount</th>
              </tr>
            </thead>
            <tbody>
              ${fineRows}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; font-weight: bold; font-size: 15px; color: #111827;">Total Cumulative Fine:</td>
                <td style="text-align: right; font-weight: bold; font-size: 16px; color: #dc2626;">₹${(violation.fineAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">AI Safety Narrative & Legal Implication</div>
          <div class="narrative">
            "${violation.aiAnalysis || 'No narration compiled.'}"
          </div>

          <div class="footer-note">
            <div>
              <p>This is a computer-generated challan issued via SVDS AI automated surveillance checkpoints.</p>
              <p>Please pay the fine online within 15 days of challan receipt to avoid legal action under the Motor Vehicles Act.</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <strong>Issuing Officer Signature</strong>
              <p style="margin: 2px 0 0 0; color: #9ca3af; font-size: 10px;">Automated Enforcement Authority</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
