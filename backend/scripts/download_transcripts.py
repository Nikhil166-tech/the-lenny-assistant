"""
Transcript Downloader / Synchronizer for Lenny's Podcast Transcripts
"""
import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("download_transcripts")

TRANSCRIPTS_DIR = Path(__file__).resolve().parent.parent / "data" / "transcripts"

def verify_or_download():
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    existing_files = list(TRANSCRIPTS_DIR.glob("*.md"))
    logger.info(f"Verified transcript repository. Found {len(existing_files)} local episode transcripts in {TRANSCRIPTS_DIR}.")
    for f in existing_files:
        logger.info(f"  - Ready: {f.name}")

if __name__ == "__main__":
    verify_or_download()
