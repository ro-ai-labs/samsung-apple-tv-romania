# Confirmed case: native Apple TV on a Romanian QN90C

On 31 October 2026, the owner confirmed that an Apple TV subscription show played with picture and sound in the genuine native app. The Apple account remained Romanian and Smart Hub remained RO.

**Follow-up, 3 November 2026:** the original Samsung entry later showed a termination/deletion prompt despite the native app still playing through direct launch. A separate Home launcher resolved access through the new tile, with an owner-confirmed restart/playback test. Read [the follow-up report](QN90C-HOME-LAUNCHER.md) before treating the original Home entry as reliable.

## Exact configuration

| Component | Observed value |
| --- | --- |
| TV | Samsung QE65QN90CATXXH, QN90C, 2023 |
| Full firmware | T-PTMCDEUC-0090-2220.4, E2371440, BT - S |
| Current TV OS | Tizen 9.0, upgraded from its launch OS |
| Architecture | ARMv7 |
| Internal Samsung model ID | 23_PTM_QTV_T09 |
| Smart Hub country | RO |
| Apple account country | Romania |
| Samsung Apple TV store ID | 3201807016597 |
| Native package | com.samsung.tv.aria-video, version 16.2.0 |
| Base JavaScript build | 16.2.0.32S47 |
| Mounted signed JavaScript update | 16.4.4.J34S139 |

These are case facts, not values to paste into a different TV. In particular, use a target's actual internal model ID and application user ID.

## Two separate problems

Apple TV was absent from the Romanian Samsung Apps results. A whole-Hub country change disrupted VOYO; restoring RO recovered that service, and the owner confirmed VOYO playback. A Home shortcut later remained even though Apple TV was no longer installed.

The successful installation used Samsung's genuine `com.samsung.tv.appinfoviewer` application. Its Pause / download-app form accepted Germany for that individual request, the actual nonblank model ID and store ID `3201807016597`. Smart Hub stayed RO. Package presence was independently checked; a closed popup alone had previously concealed a failed attempt.

The installed native app then reported that Apple TV was unavailable for the device or region. Browser account authentication did not fix it. Configuration probes isolated a Romanian native-profile rejection; changing the startup request profile suggested a workaround. Those probes were evidence about configuration, not proof of playable video.

## The compatibility change

After authorization, temporary access used `archive-root` from [samsung-tv-root v0.0.12](https://github.com/chris-ritsen/samsung-tv-root/tree/v0.0.12). Developer Mode alone was not root. The procedure changed only `/opt/usr/apps/com.samsung.tv.aria-video/res/main.js`, preserving the existing inode, UID 201, GID 0, mode 0644 and SMACK label `User::Pkg::com.samsung.tv.aria-video::RO`.

The insertion runs after the normal signed update mount and before bootstrap. Exact version and source-hash guards restrict its hooks. It fills missing Romanian routing metadata without overriding explicit false values. For the narrowly matched Romanian configuration POST, it changes native `vz/vz/v96` to `web/web/v100` and removes `mfr`, while preserving the Romanian storefront, body, authentication context and callbacks.

The UI and player remain native. Login, entitlement checks, DRM routines and signed updates stay in place. No firmware flashing, permanent root service or UEP disabling was part of this successful change.

The [companion README](../compat/romania-qn90c/README.txt) contains the exact hashes and offline backup/build/deployment/rollback instructions. It requires the reader's own original application resource; this guide distributes no complete Apple app or signed JetPack.

## Evidence and limits

- Native subscription playback with moving picture and sound: confirmed by the owner after the change.
- Smart Hub RO: checked after the successful fix.
- VOYO playback: confirmed earlier after restoring Romania. Focus Sat was later restored; SkyShowtime, HBO Max and Hayu were confirmed installed. These are not fresh playback tests for every service.
- The compatibility insertion passed 23 offline checks. The portable builder produced the exact TV-tested patched bytes from the private original.
- The portable command generator was tested offline. Its newly generated scripts have not themselves been run on a TV; the original TV deployment used the previously tested core write sequence.
- At the original 31 October test, cold-boot persistence was untested. The [3 November follow-up](QN90C-HOME-LAUNCHER.md) records the original entry's failure and an owner-confirmed Home/restart/playback test through the new launcher. That single restart does not establish long-term persistence.
- Long sessions, 4K/HDR, future app/firmware updates and another TV remain unvalidated.

Use this case to decide whether further investigation is justified. It is not proof that the same app, root path or hook works on an older Samsung or another firmware. An unknown version must cause the supplied patch path to stop rather than weaken its checks.

## Credits

[chris-ritsen/samsung-tv-root](https://github.com/chris-ritsen/samsung-tv-root) supplied the temporary access tooling. [mircea1223/lg-appletv-romania](https://github.com/mircea1223/lg-appletv-romania) informed the Romanian configuration investigation. The Samsung insertion and offline helpers were authored for this case, with Codex assisting the owner. The owner handled TV prompts, private sign-in and playback confirmation.
