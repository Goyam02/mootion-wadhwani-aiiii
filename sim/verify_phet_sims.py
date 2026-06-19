#!/usr/bin/env python3
"""
verify_phet_sims.py

Verifies that every `phet_url` in a topic-mapping JSON file actually
resolves to a live, renderable PhET simulation page (not a 404, not a
redirect to the homepage/browse page, not an empty stub) and writes out
clean JSON files split into "verified" and "failed".

Why this matters: PhET sometimes 200s a dead slug straight to a generic
page, or 301/302s it to /en/simulations/browse. A plain "is the status
code 200?" check misses both of those, so this script also inspects the
final URL and a couple of content signals.

Usage:
    pip install requests
    python verify_phet_sims.py sims.json

    # optional flags
    python verify_phet_sims.py sims.json --workers 8 --timeout 15 \\
        --verified-out verified_sims.json --failed-out failed_sims.json

Outputs:
    verified_sims.json  -> entries whose phet_url rendered a real sim page
    failed_sims.json    -> entries that failed, each with a failure_reason
"""

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    sys.exit("This script needs the 'requests' library.\nInstall it with: pip install requests")

HEADERS = {
    # A plain python-requests UA gets blocked/treated differently by some
    # CDNs in front of phet.colorado.edu, so pretend to be a browser.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

# Phrases that show up on PhET's not-found / generic landing pages even
# when the HTTP status is 200, so a status-code check alone isn't enough.
NOT_FOUND_MARKERS = [
    "page not found",
    "we couldn't find that page",
    "sorry, this simulation",
]

# A real sim page is a fairly heavy single-page-app shell; a stub/error
# page is tiny. Cheap extra signal alongside the markers above.
MIN_CONTENT_BYTES = 2000


def check_url(entry, timeout, retries):
    """Return (entry, ok: bool, reason: str)."""
    url = entry["phet_url"]
    last_error = None

    for attempt in range(retries + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        except requests.RequestException as exc:
            last_error = str(exc)
            time.sleep(1.5)
            continue

        if resp.status_code != 200:
            return entry, False, f"HTTP {resp.status_code}"

        final_url = resp.url.rstrip("/")
        if "/sims/html/" not in final_url:
            return entry, False, f"Redirected away from sim page to {resp.url}"

        body_lower = resp.text.lower()
        if any(marker in body_lower for marker in NOT_FOUND_MARKERS):
            return entry, False, "Page loaded but looks like a not-found page"

        if len(resp.content) < MIN_CONTENT_BYTES:
            return entry, False, f"Response too small ({len(resp.content)} bytes) to be a real sim page"

        return entry, True, "OK"

    return entry, False, f"Request failed after {retries + 1} attempts: {last_error}"


def main():
    parser = argparse.ArgumentParser(description="Verify PhET simulation URLs in a topic-mapping JSON file.")
    parser.add_argument("input_file", help="Path to the input JSON file (array of topic objects)")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent requests (default: 6)")
    parser.add_argument("--timeout", type=int, default=12, help="Per-request timeout in seconds (default: 12)")
    parser.add_argument("--retries", type=int, default=2, help="Retries per URL on network errors (default: 2)")
    parser.add_argument("--verified-out", default="verified_sims.json", help="Output path for passing entries")
    parser.add_argument("--failed-out", default="failed_sims.json", help="Output path for failing entries")
    args = parser.parse_args()

    with open(args.input_file, "r", encoding="utf-8") as f:
        entries = json.load(f)

    print(f"Checking {len(entries)} PhET URLs with {args.workers} workers...\n")

    verified, failed = [], []

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(check_url, entry, args.timeout, args.retries): entry
            for entry in entries
        }
        for i, future in enumerate(as_completed(futures), 1):
            entry, ok, reason = future.result()
            tag = "OK  " if ok else "FAIL"
            print(f"[{i:>3}/{len(entries)}] {tag}  {entry['topic_key']:<35} {reason}")
            (verified if ok else failed).append(
                entry if ok else {**entry, "failure_reason": reason}
            )

    with open(args.verified_out, "w", encoding="utf-8") as f:
        json.dump(verified, f, indent=2, ensure_ascii=False)

    with open(args.failed_out, "w", encoding="utf-8") as f:
        json.dump(failed, f, indent=2, ensure_ascii=False)

    print(f"\nDone. {len(verified)} verified / {len(failed)} failed.")
    print(f"  -> {args.verified_out}")
    if failed:
        print(f"  -> {args.failed_out}  (review these — slugs may have changed)")


if __name__ == "__main__":
    main()
