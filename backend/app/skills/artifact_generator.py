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
