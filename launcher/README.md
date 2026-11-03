# Apple TV Direct launcher

This optional helper opens an **already installed, working native Apple TV app** from a separate Home entry. It addresses the case where direct launch and entitled playback work, but the original Apple TV entry reports that the app terminated and offers to delete it.

The owner confirmed the helper worked after the Home launch, TV restart, and subscription-playback test on **one Samsung QN90C running Tizen 9**, on 2026-11-03. Other models and firmware versions are untested. The API 4.0 declaration in `config.xml` is a minimum API setting, not evidence of compatibility with older TVs.

## Check that this is the right problem

Use this helper only after establishing all three conditions:

1. The genuine native Apple TV app is installed, and you have verified its application ID on this particular TV.
2. Directly launching that app opens its native interface and plays a title covered by your Apple subscription or purchase, with picture and sound.
3. The original Home/Apps entry still fails or presents the termination/deletion prompt.

The helper supplies no browser, player, Apple app files, or app port. It does not install or repair Apple TV, change country/model settings, repair DRM, or grant playback rights. Keep the native app installed. Installation and playback problems belong to the earlier diagnosis, not this launcher step.

## What the source does

The four files in [apple-tv-direct/](apple-tv-direct/) are the exact tested source. Version `0.1.0` uses package ID `CdxArD4Q9x` and application ID `CdxArD4Q9x.Launcher`.

`launcher.js` calls `tizen.application.launch('com.samsung.tv.aria-video', ...)`, then exits the helper when the platform accepts the launch. This success callback does not prove that Apple playback succeeded. The helper displays a bounded error name on failure; OK retries and Back exits. It requests only the Public `application.launch` privilege, with network/media/frame access disabled by its content security policy. See Samsung's [Tizen 9 TV Application API](https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/api/9.0/device_api/tv/tizen/application.html) and [application termination guide](https://developer.samsung.com/smarttv/develop/guides/fundamentals/terminating-applications.html).

**Verify the native target ID on each TV.** `com.samsung.tv.aria-video` was the observed ID on the tested QN90C; it is not a cross-model guarantee. A separate TV development diagnostic can enumerate installed application names and IDs through the documented `tizen.application.getAppsInfo()` API. If your verified native Apple ID differs, review and adapt the target before building; that becomes an untested adaptation of this source.

## Prepare your own development environment and certificate

Install the official Samsung TV SDK tools and Samsung Certificate Extension. Use your own development computer and your own Samsung account. Follow Samsung's [TV device setup](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html) and [TV certificate instructions](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html).

Identify the computer actually running `tizen` and `sdb`, its reachable LAN interface, and the TV's current IP address. For host discovery, use `ip -brief address` on Linux, `ipconfig` on Windows, or `ifconfig` on macOS. With WSL or a virtual machine, check the host/network arrangement instead of assuming the terminal's virtual address is reachable from the TV. Enter the correct development-host address in the TV's Developer Mode setup, then connect using the SDK. No SSH setup is required by this helper.

In Certificate Manager, create your own **Samsung → TV** profile with an author certificate and a **Public Samsung TV distributor certificate containing your target TV's DUID**. Complete Samsung account sign-in privately in the owner's browser. Obtain the DUID through the connected-device certificate workflow; do not substitute the IP address, model name, or SDB serial. If required by the SDK, use Device Manager's **Permit to install applications** action. Samsung documents [Public privileges and DUID-bound distribution](https://developer.samsung.com/tizen/certificate-signing/creating-certificate.html).

The two generic SDK distributor profiles tried in this case were rejected; a Samsung-issued profile for the target TV was accepted. That observation does not establish certificate compatibility for every TV. Preserve your author key privately for future updates. Do not publish certificates, private keys, passwords, account tokens, DUIDs, SDK profiles, or a device-specific signed WGT in this repository.

## Connect, build, sign, and install

The examples below use Bash from the repository root, with the official SDK commands available in your shell. Replace the placeholders with your own values. Check that `sdb devices` identifies the intended TV before any target operation.

```bash
command -v tizen
command -v sdb
TV_IP="YOUR_TV_IP"
TV_PROFILE="YOUR_SAMSUNG_TV_PROFILE"
sdb connect "${TV_IP}:26101"
sdb devices
TV_SERIAL="COPY_THE_TARGET_SERIAL_FROM_SDB_DEVICES"
```

After verifying the native application ID, a standard direct-launch preflight is:

```bash
tizen run -s "$TV_SERIAL" -p com.samsung.tv.aria-video
```

Confirm actual entitled playback before proceeding. For a different verified ID, substitute that ID in both the preflight and the reviewed source. Samsung's [TV CLI documentation](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html) specifies **application IDs** for the TV `run -p` and `uninstall -p` options.

This plain HTML/JavaScript helper has no npm dependencies or compilation step. Stage only its four source files outside the checkout, then package and sign with your own profile:

```bash
# Optional syntax check if Node.js is installed; packaging does not require Node.
if command -v node >/dev/null 2>&1; then
  node --check launcher/apple-tv-direct/launcher.js
fi
LAUNCHER_BUILD="$(mktemp -d)"
mkdir -p "$LAUNCHER_BUILD/app" "$LAUNCHER_BUILD/out"
cp launcher/apple-tv-direct/config.xml \
   launcher/apple-tv-direct/index.html \
   launcher/apple-tv-direct/launcher.js \
   launcher/apple-tv-direct/style.css "$LAUNCHER_BUILD/app/"
tizen package -t wgt -s "$TV_PROFILE" \
  -o "$LAUNCHER_BUILD/out" -- "$LAUNCHER_BUILD/app"
mv "$LAUNCHER_BUILD/out/Apple TV Direct.wgt" \
   "$LAUNCHER_BUILD/out/apple-tv-direct.wgt"
tizen install -n apple-tv-direct.wgt -s "$TV_SERIAL" \
  -- "$LAUNCHER_BUILD/out"
tizen run -s "$TV_SERIAL" -p CdxArD4Q9x.Launcher
```

Check each command's result before continuing. A simple WGT filename avoids quoting problems in TV installation tools. If your SDK emits a different package filename, inspect its output and rename that generated file. A signing or certificate-chain failure needs correction of the local profile or device binding; do not change the TV clock or weaken certificate validation.

## Verify from Home and roll back

Find **Apple TV Direct** in Apps and use **Add to Home**, where available. Samsung describes this in its [app-management guide](https://www.samsung.com/us/support/answer/ANS10005205/). Menu placement varies by TV.

Test the new Home entry, restart the TV, then repeat the Home launch and play an entitled title with picture and sound. A successful SDK launch alone is not this acceptance test. Keep the genuine Apple TV app and the helper's separate identities clear when navigating Apps.

To remove only this helper:

```bash
tizen uninstall -s "$TV_SERIAL" -p CdxArD4Q9x.Launcher
```

Alternatively, delete **Apple TV Direct** through the TV's Apps settings. Leave the genuine Apple TV application installed. Removing the helper does not undo any earlier native-app compatibility work documented elsewhere in this repository.
