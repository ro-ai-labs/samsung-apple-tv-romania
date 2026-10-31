#!/usr/bin/env python3
"""Offline backup extraction and TV command generation; never connects to a TV."""

import argparse
import base64
import binascii
import gzip
import json
import os
from pathlib import Path
import secrets

from build_patch import ORIGINAL_SHA256, PATCHED_SHA256, digest


TARGET = "/opt/usr/apps/com.samsung.tv.aria-video/res/main.js"
OTA = "/opt/usr/home/owner/apps_rw/com.samsung.tv.aria-video/data/diff.jetpack"
OTA_SHA256 = "970aa2885fefb8390eee8208ee8a6c10dbd40c123a1c9723ee5004a88881ddd4"
LABEL = "User::Pkg::com.samsung.tv.aria-video::RO"
APP = "com.samsung.tv.aria-video"


def known_bytes(path, expected):
    data = path.read_bytes()
    if digest(data) != expected:
        raise ValueError("File SHA256 does not match the required version.")
    return data


def write_new(path, data):
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb") as stream:
        stream.write(data)


def extract_backup(result_path, output_path):
    result = json.loads(result_path.read_text(encoding="utf-8"))
    if not isinstance(result, dict) or result.get("authenticated") is not True:
        raise ValueError("Expected direct upstream authenticated root JSON.")
    if any(type(result.get(key)) is not int or result[key] != 0 for key in ("uid", "euid")):
        raise ValueError("Root result must contain integer UID=0 and EUID=0.")
    commands = result.get("commands")
    if not isinstance(commands, list) or not commands or not isinstance(commands[0], dict):
        raise ValueError("Root result has no command 0.")
    command = commands[0]
    if type(command.get("exit_code")) is not int or command["exit_code"] != 0 or command.get("timed_out") is not False:
        raise ValueError("Backup command failed, timed out, or has incomplete status.")
    stdout = command.get("stdout")
    if not isinstance(stdout, str):
        raise ValueError("Backup command stdout must be base64 text.")
    try:
        data = base64.b64decode("".join(stdout.split()), validate=True)
    except (ValueError, binascii.Error) as error:
        raise ValueError("Backup stdout is not valid base64.") from error
    if digest(data) != ORIGINAL_SHA256:
        raise ValueError("Decoded backup SHA256 does not match the tested original.")
    write_new(output_path, data)
    return len(data)


def compressed(data):
    return base64.b64encode(gzip.compress(data, compresslevel=9, mtime=0)).decode("ascii")


def generate(original_path, output_path, patched_path=None):
    original = known_bytes(original_path, ORIGINAL_SHA256)
    patched = known_bytes(patched_path, PATCHED_SHA256) if patched_path is not None else None
    applying = patched is not None
    expected_before = ORIGINAL_SHA256 if applying else PATCHED_SHA256
    expected_after = PATCHED_SHA256 if applying else ORIGINAL_SHA256
    stage = "/home/owner/share/tmp/sdk_tools/apple-tv-ro-compat-" + secrets.token_hex(8)
    lines = [
        "set -e",
        "vconftool get db/comss/countrycode | grep -q 'value = RO (String)'",
        'test "$(sha256sum ' + TARGET + ' | cut -d " " -f1)" = ' + expected_before,
        *(['test "$(sha256sum ' + OTA + ' | cut -d " " -f1)" = ' + OTA_SHA256] if applying else []),
        'test "$(stat -c \'%u %g %a\' ' + TARGET + ')" = "201 0 644"',
        'ls -lZ ' + TARGET + ' | grep -q "' + LABEL + '"',
        "app_launcher -u 5001 -t " + APP + " >/dev/null 2>&1 || true",
        "sleep 2",
        'app_state=$(app_launcher -u 5001 -r ' + APP + ' 2>&1 || true)',
        'test "$app_state" = "result: not running"',
        'original_inode=$(stat -c %i ' + TARGET + ')',
        "umask 077",
        "mkdir " + stage,
        "trap 'rm -f " + stage + "/original.js " + stage + "/patched.js; rmdir " + stage + " 2>/dev/null || true' EXIT",
        "printf %s " + compressed(original) + " | base64 -d | gzip -d > " + stage + "/original.js",
        'test "$(sha256sum ' + stage + '/original.js | cut -d " " -f1)" = ' + ORIGINAL_SHA256,
    ]
    if applying:
        lines.extend([
            "printf %s " + compressed(patched) + " | base64 -d | gzip -d > " + stage + "/patched.js",
            'test "$(sha256sum ' + stage + '/patched.js | cut -d " " -f1)" = ' + PATCHED_SHA256,
        ])
    def verify(expected):
        return ('test "$(sha256sum ' + TARGET + ' | cut -d " " -f1)" = ' + expected +
                ' && test "$(stat -c %i ' + TARGET + ')" = "$original_inode"' +
                ' && test "$(stat -c \'%u %g %a\' ' + TARGET + ')" = "201 0 644"' +
                ' && ls -lZ ' + TARGET + ' | grep -q "' + LABEL + '"')
    replacement = stage + ("/patched.js" if applying else "/original.js")
    lines.extend([
        "if cat " + replacement + " > " + TARGET + " && " + verify(expected_after) + "; then",
        "  :",
        "else",
        "  if cat " + stage + "/original.js > " + TARGET + " && " + verify(ORIGINAL_SHA256) + "; then",
        "    echo RESTORED_ORIGINAL_AFTER_WRITE_FAILURE",
        "  else",
        "    echo RESTORE_FAILED_CHECK_PRIVATE_BACKUP >&2",
        "  fi",
        "  exit 1",
        "fi",
        "stat -c '%u %g %a %s' " + TARGET,
        "ls -lZ " + TARGET,
        "sha256sum " + TARGET,
        "vconftool get db/comss/countrycode",
        "rm -f " + stage + "/original.js " + stage + "/patched.js",
        "rmdir " + stage,
        "test ! -e " + stage,
        "trap - EXIT",
        "echo COMPAT_STAGING_CLEAN",
        "echo " + ("COMPATIBILITY_FILE_APPLIED" if applying else "ORIGINAL_FILE_RESTORED"),
    ])
    script = ("\n".join(lines) + "\n").encode("ascii")
    if len(script) >= 65536:
        raise ValueError("Generated command exceeds the 65535-byte limit.")
    write_new(output_path, script)
    return len(script)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="action", required=True)
    extract = commands.add_parser("extract-backup", help="decode command 0 of direct upstream root JSON")
    extract.add_argument("result", type=Path)
    extract.add_argument("output", type=Path)
    apply = commands.add_parser("apply", help="generate a guarded TV apply command; do not execute it")
    apply.add_argument("original", type=Path)
    apply.add_argument("patched", type=Path)
    apply.add_argument("output", type=Path)
    rollback = commands.add_parser("rollback", help="generate a guarded TV rollback command; do not execute it")
    rollback.add_argument("original", type=Path)
    rollback.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        if args.action == "extract-backup":
            size = extract_backup(args.result, args.output)
        else:
            size = generate(args.original, args.output, args.patched if args.action == "apply" else None)
    except FileExistsError:
        parser.exit(1, "Error: output exists; refusing to overwrite it.\n")
    except (OSError, ValueError) as error:
        parser.exit(1, "Error: " + str(error) + "\n")
    print("Created {} bytes locally; no TV or network connection was made.".format(size))


if __name__ == "__main__":
    main()
