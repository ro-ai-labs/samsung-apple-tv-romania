#!/usr/bin/env python3
"""Build the exact tested patch from a reader's own matching Apple TV main.js."""

import argparse
import hashlib
from pathlib import Path


ORIGINAL_SHA256 = "e5a1628ef523db51912fef0c737e471dbba4eb971f4f444cddaae57db0c4788f"
PATCHED_SHA256 = "b9e1014fb27bb1a3d0c7f9fe995d9eb3986461bcae78c12d1b65695e71f4309b"
INSERTION_SHA256 = "048d69a182c0795d39ebaa7ba366a23171e53dda7ae595ccaa1a6b9d56d2efe2"
INSERTION_OFFSET = 22832
ANCHOR = b"        try {\n            global.atveLoader.launchTimeInstrumentationMarkers.push({"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def build(input_path, output_path):
    original = input_path.read_bytes()
    if digest(original) != ORIGINAL_SHA256:
        raise ValueError("Input SHA256 does not match the tested original; no output created.")
    if original[INSERTION_OFFSET:INSERTION_OFFSET + len(ANCHOR)] != ANCHOR:
        raise ValueError("Expected insertion anchor is absent at byte offset 22832.")
    insertion = Path(__file__).with_name("insertion.js").read_bytes()
    if digest(insertion) != INSERTION_SHA256:
        raise ValueError("insertion.js SHA256 does not match the tested insertion.")
    patched = original[:INSERTION_OFFSET] + insertion + original[INSERTION_OFFSET:]
    if digest(patched) != PATCHED_SHA256:
        raise ValueError("Result SHA256 does not match the tested patch; no output created.")
    # Exclusive creation refuses an existing file, directory, or symlink.
    with output_path.open("xb") as stream:
        stream.write(patched)
    return len(patched)


def main():
    parser = argparse.ArgumentParser(
        description="Build a version-locked patch locally; no TV or network access."
    )
    parser.add_argument("input", type=Path, help="your own unmodified main.js backup")
    parser.add_argument("output", type=Path, help="new output path; must not exist")
    args = parser.parse_args()
    try:
        size = build(args.input, args.output)
    except FileExistsError:
        parser.exit(1, "Error: output already exists; refusing to overwrite it.\n")
    except (OSError, ValueError) as error:
        parser.exit(1, "Error: " + str(error) + "\n")
    print("Created patched file: {} bytes".format(size))
    print("SHA256: " + PATCHED_SHA256)


if __name__ == "__main__":
    main()
