Apple TV on a Romanian Samsung TV: reproducible compatibility patch
Companion code for the October 31, 2026 case study

This kit contains an authored JavaScript insertion and two offline Python tools.
Supply your own original Apple TV main.js. No Apple application, signed
JetPack, firmware, account data, or device-access tool is included.

Tested case
  TV: Samsung QE65QN90CATXXH (2023 QN90C), upgraded to Tizen 9
  Firmware: 2220.4
  Native package: com.samsung.tv.aria-video, version 16.2.0
  Captured base application build: 16.2.0.32S47
  Mounted JavaScript OTA build: 16.4.4.J34S139
  Samsung SmartHub service country: RO
  Apple account country: Romania, unchanged

The owner confirmed native playback on October 31, 2026 with the compatibility
patch. That observation is not proof of persistence across a cold boot, a later
application update, a firmware update, or Samsung store reconciliation.

Build on your computer
1. Keep a private, byte-for-byte backup of your own unmodified installed main.js
   and its original owner/group, permissions and SMACK label. On the tested TV,
   the installed file was /opt/usr/apps/com.samsung.tv.aria-video/res/main.js.
2. Extract all five kit files together. Optionally verify with:
     sha256sum -c SHA256SUMS
3. Run Python 3 with your own backup as input and a new output filename:
     python3 build_patch.py main.js.original main.ro-compat.js

The builder uses binary I/O, checks the original hash, verifies the insertion
anchor at byte offset 22832, verifies insertion.js, and checks the final hash.
It refuses to overwrite an existing output, including the input itself.
It makes no network requests and does not connect to or modify a TV.

Required original: 23564 bytes
  e5a1628ef523db51912fef0c737e471dbba4eb971f4f444cddaae57db0c4788f
Expected patched result: 34889 bytes
  b9e1014fb27bb1a3d0c7f9fe995d9eb3986461bcae78c12d1b65695e71f4309b

A mismatch means this kit does not match your input. Do not remove the checks
or transplant the byte offset into a different version. The generated file
contains your own application bytes; it is not part of the distributed kit.

What the insertion does
It runs after the normal signed OTA mount and before application bootstrap.
It requires the exact tested OTA version and source hashes. Unknown versions
skip the workaround. It fills missing Romanian availability/routing metadata
without overriding explicit false values. Only the exact Apple configuration
POST request is changed from the native vz/vz/v96 profile to web/web/v100,
removing mfr. The Romanian storefront, native request body, credentials and
callbacks remain unchanged. Bare 143487 and the strict numeric header form
143487-<digits>,<digits> are recognized without changing their value.

Native login, media and DRM routines remain in place. The signed JetPack and
OTA mechanism are preserved. No firmware, kernel, UEP, permanent-root setting
or Apple account country is changed by this insertion.

Samsung installation context
Installing the official native package is a separate step covered in the case
study. Read your own TV's values using the following read-only commands in an
authorized device shell:
  vconftool get db/comss/countrycode
  vconftool get db/comss/modelid

The successful store-install request used viewerCountry=DE for that individual
installation, the actual nonblank model identifier returned by this TV, and
Samsung store app ID 3201807016597. Use the value after "value =" and before the
type annotation, not the entire vconftool output. Do not invent a model or use a
blank one. The retail model name above is not a substitute for that identifier.
SmartHub country remained RO; viewerCountry was an installer request field.
This kit does not perform installation or change the SmartHub service country.

Backup, deployment and rollback commands
These examples use a Bash-compatible terminal on the computer and Python 3.12.
Install Samsung SDB, have a working authorized developer connection, and extract
the upstream v0.0.12 Linux release including source and _internal/payloads.
OpenSSL must be on PATH. Replace these placeholders with your own values:

  export TV_IP='YOUR_TV_LAN_ADDRESS'
  export PC_IP='YOUR_PC_ADDRESS_ON_THE_SAME_LAN'
  export SDB='PATH_TO_YOUR_SDB_EXECUTABLE'
  export TV_ROOT_RELEASE='PATH_TO_EXTRACTED_V0_0_12_RELEASE'
  umask 077

The tested Linux release stores payloads under _internal, not a top-level
payloads directory. Verify the paths before defining the source-mode wrapper:

  test -f "$TV_ROOT_RELEASE/source/src/samsung_tv_root/__main__.py"
  test -d "$TV_ROOT_RELEASE/_internal/payloads/common"
  test -d "$TV_ROOT_RELEASE/_internal/payloads/common31"
  tvroot() {
    PYTHONPATH="$TV_ROOT_RELEASE/source/src" \
    SAMSUNG_TV_ROOT_COMMON_PAYLOAD_DIRECTORY="$TV_ROOT_RELEASE/_internal/payloads/common" \
    SAMSUNG_TV_ROOT_COMMON31_PAYLOAD_DIRECTORY="$TV_ROOT_RELEASE/_internal/payloads/common31" \
    python3.12 -m samsung_tv_root -o json --sdb "$SDB" \
      archive-root root "$TV_IP" --callback-host "$PC_IP" \
      --bind-host "$PC_IP" --command-timeout 35 "$@"
  }

tvroot acquires temporary root and executes the supplied command on the TV.
The offline Python tools below do not connect to the TV. Native package
installation is a separate prerequisite; the commands here modify only its
main.js after verifying the exact tested original and signed OTA hashes.

Capture a fresh, private backup. The shell command must emit only base64:

  tvroot --command 'base64 /opt/usr/apps/com.samsung.tv.aria-video/res/main.js' > backup-root.json
  python3 tv_commands.py extract-backup backup-root.json main.js.original
  python3 build_patch.py main.js.original main.ro-compat.js

extract-backup accepts direct upstream -o json output, verifies authenticated
UID/EUID 0, successful command 0 with no timeout, decodes its base64 stdout,
and verifies the known original SHA256. It refuses an existing output.
Keep the JSON private: it contains device information and your application.

Generate both scripts locally before applying anything:

  python3 tv_commands.py apply main.js.original main.ro-compat.js apply.tv.sh
  python3 tv_commands.py rollback main.js.original rollback.tv.sh
  sh -n apply.tv.sh
  sh -n rollback.tv.sh

Generated scripts contain compressed copies of your application bytes. Keep
them private; they are not distributed in this kit. Each command is under
65536 bytes. Review it before running:

  tvroot --command "$(cat apply.tv.sh)" > apply-root.json

Do not interpret the root tool's process exit status alone as shell success.
Its JSON command statuses must be checked separately. This check prints only
the command diagnostics and fails if root identity, command status, timeout,
or staging cleanup is wrong:

  python3 - apply-root.json <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    r = json.load(f)
assert r.get("authenticated") is True
assert all(type(r.get(k)) is int and r[k] == 0 for k in ("uid", "euid"))
commands = r.get("commands")
assert isinstance(commands, list) and commands
for c in commands:
    print(c.get("stdout", ""), end="")
    print(c.get("stderr", ""), end="", file=sys.stderr)
    assert type(c.get("exit_code")) is int and c["exit_code"] == 0
    assert c.get("timed_out") is False
assert r.get("staging_cleaned") is True
assert "COMPAT_STAGING_CLEAN" in commands[0].get("stdout", "").splitlines()
PY

Expect COMPAT_STAGING_CLEAN, COMPATIBILITY_FILE_APPLIED and the known patched
hash. The upstream staging_cleaned JSON flag covers the root tool's staging;
COMPAT_STAGING_CLEAN separately proves removal of this script's own directory.
Open Apple TV
from its normal TV tile after the successful status check. To roll back:

  tvroot --command "$(cat rollback.tv.sh)" > rollback-root.json

Run the same JSON status-check block with rollback-root.json in place of
apply-root.json. Expect COMPAT_STAGING_CLEAN, ORIGINAL_FILE_RESTORED and the known original hash;
then open Apple TV normally. Retain your original backup and metadata.

Both generated scripts require SmartHub RO, the exact expected current main.js
hash, owner/group/mode 201 0 644, and SMACK User::Pkg::com.samsung.tv.aria-video::RO.
Only apply additionally requires OTA SHA256
970aa2885fefb8390eee8208ee8a6c10dbd40c123a1c9723ee5004a88881ddd4.
Rollback has no OTA-hash requirement, so it can restore the original after an
OTA change if the installed main.js still matches the known patched hash.
They stop only Apple TV and confirm it is stopped, use a unique private staging
directory, overwrite the existing inode, verify the resulting hash/inode and
metadata, and explicitly verify staging removal before emitting success.
On failure an EXIT trap attempts cleanup without claiming it succeeded.
A detected write/check failure attempts to
restore the exact original and verifies that restoration. Power loss or a
forced termination during the write is not an atomic rollback guarantee.

The generator is NEW, locally tested code wrapping the previously TV-tested
compressed apply sequence and Apple stop command. These newly generated
scripts have not themselves been run on the TV. This is not a second-device
reproduction, and cold-boot/update persistence remains untested.

Scope of verification
The compatibility implementation passed 23 offline tests against captured
factories and bootstrap code. The portable builder was checked against the
private original and produced byte-identical tested output; wrong input hashes
and existing outputs were rejected. The kit includes no captured test fixtures.

Prior work and attribution
Temporary-root tooling: chris-ritsen/samsung-tv-root, release v0.0.12
  https://github.com/chris-ritsen/samsung-tv-root/releases/tag/v0.0.12
Related LG/webOS Romanian Apple TV investigation: mircea1223/lg-appletv-romania
  https://github.com/mircea1223/lg-appletv-romania
The Samsung hook and local helpers here were authored for this case. The hook
uses narrow version/source anchors and hashes; no complete Apple source files,
factory fixtures, signed packages, firmware or upstream root payloads are
redistributed. The LG project informed the configuration-profile investigation;
its LG installation procedure is not a Samsung procedure.
