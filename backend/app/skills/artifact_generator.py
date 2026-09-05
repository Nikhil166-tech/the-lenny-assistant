import re
from typing import Optional, Dict, Any, Tuple

ARTIFACT_SYSTEM_INSTRUCTIONS = """
When the user asks for an interactive tool, calculator, dashboard, component, or formatted document/template:
Generate the code or content wrapped inside an <artifact> block formatted exactly as:

<artifact type="html" title="Brief Descriptive Title">
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Clean, modern, responsive CSS styling */
  </style>
</head>
<body>
  <!-- Interactive HTML content with inline JavaScript -->
</body>
</html>
</artifact>

Or for structured documents:
<artifact type="markdown" title="PRD Template">
# Title
...
</artifact>

Important Artifact Rules:
- The HTML artifact must be self-contained and visually appealing (using modern styling, flexbox/grid, neutral backgrounds).
- Do not make external network requests in scripts.
"""

def extract_artifact(text: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Scans the response for <artifact type="..." title="...">...</artifact>
    Returns cleaned message text and extracted artifact metadata dict.
    """
    pattern = r'<artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)(?:</artifact>|$)'
    match = re.search(pattern, text)
    if not match:
        return text, None

    artifact_type = match.group(1).strip()
    title = match.group(2).strip()
    content = match.group(3).strip()

    # Clean text to display in chat
    cleaned_text = re.sub(pattern, f"\n\n*(Created Artifact: **{title}** — viewable in the Artifact Canvas)*\n", text).strip()

    artifact_data = {
        "artifact_type": artifact_type,
        "title": title,
        "content": content
    }
    return cleaned_text, artifact_data

def build_calculator_artifact(title: str = "PLG vs SLG ROI Calculator") -> Dict[str, Any]:
    return {
        "artifact_type": "html",
        "title": title,
        "content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .card { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 520px; margin: 0 auto; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #0369a1; color: #e0f2fe; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 20px; margin: 0 0 8px 0; color: #38bdf8; font-weight: 700; }
    p.desc { font-size: 13px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.4; }
    .slider-group { margin-bottom: 20px; }
    .label-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #e2e8f0; }
    .label-row span:last-child { color: #10b981; font-family: monospace; font-size: 14px; font-weight: 700; }
    input[type=range] { width: 100%; accent-color: #10b981; height: 6px; border-radius: 3px; background: #334155; outline: none; cursor: pointer; }
    .results { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #334155; }
    .metric { background: #0f172a; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #334155; }
    .metric-val { font-size: 24px; font-weight: 800; color: #10b981; margin-top: 6px; }
    .metric-lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .verna-callout { margin-top: 20px; padding: 12px 16px; background: #172554; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 12px; color: #bfdbfe; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Elena Verna B2B Growth Model</span>
    <h2>PLG vs SLG ROI Simulator</h2>
    <p class="desc">Calculate LTV:CAC efficiency and payback periods across Product-Led and Sales-Led motions.</p>
    
    <div class="slider-group">
      <div class="label-row">
        <span>Customer Acquisition Cost (CAC)</span>
        <span id="cacVal">$800</span>
      </div>
      <input type="range" id="cac" min="100" max="6000" step="50" value="800" oninput="recalc()">
    </div>

    <div class="slider-group">
      <div class="label-row">
        <span>Customer Lifetime Value (LTV)</span>
        <span id="ltvVal">$4,800</span>
      </div>
      <input type="range" id="ltv" min="500" max="30000" step="100" value="4800" oninput="recalc()">
    </div>

    <div class="slider-group">
      <div class="label-row">
        <span>Monthly Churn Rate</span>
        <span id="churnVal">2.5%</span>
      </div>
      <input type="range" id="churn" min="0.5" max="12.0" step="0.1" value="2.5" oninput="recalc()">
    </div>

    <div class="results">
      <div class="metric">
        <div class="metric-lbl">LTV : CAC Ratio</div>
        <div class="metric-val" id="ratio">6.0x</div>
      </div>
      <div class="metric">
        <div class="metric-lbl">Payback Period</div>
        <div class="metric-val" id="payback">4.2 mos</div>
      </div>
    </div>

    <div class="verna-callout">
      <strong>Elena's Rule:</strong> Healthy PLG motions achieve LTV:CAC > 3.0x with < 12 month payback. Use freemium to reduce CAC and build viral bottom-up expansion loops before applying sales-assist.
    </div>
  </div>

  <script>
    function recalc() {
      const cac = parseFloat(document.getElementById('cac').value);
      const ltv = parseFloat(document.getElementById('ltv').value);
      const churn = parseFloat(document.getElementById('churn').value);
      
      document.getElementById('cacVal').innerText = '$' + cac.toLocaleString();
      document.getElementById('ltvVal').innerText = '$' + ltv.toLocaleString();
      document.getElementById('churnVal').innerText = churn.toFixed(1) + '%';
      
      const ratio = (ltv / Math.max(cac, 1)).toFixed(1);
      const ratioEl = document.getElementById('ratio');
      ratioEl.innerText = ratio + 'x';
      ratioEl.style.color = ratio >= 3.0 ? '#10b981' : '#f59e0b';
      
      const payback = ((cac / (ltv * (churn / 100))) * 0.8).toFixed(1);
      document.getElementById('payback').innerText = payback + ' mos';
    }
  </script>
</body>
</html>"""
    }
