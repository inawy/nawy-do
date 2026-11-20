#!/usr/bin/env python3
"""Adds the permissions the reminders need to the generated Android project (ADR 0045).

The android/ folder is generated in CI by `npx cap add android`, never committed, so what we need
beyond the template is applied here, idempotently. Usage: patch_manifest.py <AndroidManifest.xml>
"""
import re
import sys

PERMISSIONS = [
    # Android 13+: showing any notification needs the person's yes.
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    # Exact timing is the person's to allow (Settings → Alarms & reminders). Without it the plugin
    # falls back to an inexact alarm that can come a few minutes late; reminders still ring.
    '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
    # So the plugin can put the scheduled reminders back after the phone restarts.
    '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
]


def main(path: str) -> None:
    text = open(path, encoding="utf-8").read()
    missing = []
    for line in PERMISSIONS:
        name = re.search(r'android:name="([^"]+)"', line).group(1)
        if f'android:name="{name}"' not in text:
            missing.append("    " + line)
    if missing:
        text = text.replace("</manifest>", "\n".join(missing) + "\n</manifest>", 1)
        open(path, "w", encoding="utf-8").write(text)
    print(f"added {len(missing)} permission(s)")


if __name__ == "__main__":
    main(sys.argv[1])
