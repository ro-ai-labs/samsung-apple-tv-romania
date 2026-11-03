# Follow-up: a working Home launcher for native Apple TV

**Confirmed by the owner on 3 November 2026.** This follows the [Romanian QN90C compatibility case](QN90C-ROMANIA.md). The genuine native Apple TV app could already play subscription content, but Samsung's original Home and installed-app entries later offered to delete it. A separate **Apple TV Direct** launcher now opens that app from a new Home tile.

The owner reported success after being asked to add the new tile to Home, restart the TV, and play a subscription show with picture and sound. The original Samsung entry was not repaired. Keep the genuine Apple TV app installed and use the new launcher.

## Tested configuration

| Component | Observed value |
| --- | --- |
| TV | Samsung QE65QN90CATXXH / QN90C, 2023 |
| Firmware | T-PTMCDEUC-0090-2220.4 |
| Actual current OS | Tizen 9.0 |
| Smart Hub / Apple account | RO / Romania |
| Genuine native app | `com.samsung.tv.aria-video`, version `16.2.0` |
| Signed JavaScript update | `16.4.4.J34S139` |
| Existing compatibility change | The exact-version insertion documented in the original case remained in place |
| New helper | Apple TV Direct `0.1.0`, app ID `CdxArD4Q9x.Launcher` |

The launcher is a follow-up to an already working native playback setup. It does not replace the compatibility investigation or make Apple TV run on unsupported hardware.

## The regression

The original entry displayed:

> This Apple TV has been terminated and is no longer available. Do you want to delete selected item(s)?

The same prompt appeared from both Home and the installed-app entry in Apps Settings. Voice launch did not provide a working route in this test. However, an authorized direct launch of the installed native app succeeded, and the owner confirmed subscription playback with picture and sound. Package presence and direct playback therefore had to be distinguished from the failing original entry.

**Choose No/Cancel on that deletion prompt** if retaining this setup. Deleting the genuine app would leave the helper with nothing to launch.

## What did not provide a lasting repair

Read-only analysis of this exact app-manager build mapped `widgetinfo.reserved_tinyint_1` to its pending-uninstall flag. That is a finding about this build, not a stable cross-generation database contract.

Two narrowly guarded repair attempts were tested on the owner's TV:

1. Clearing only the flag made the original entry work during one restart/playback test, but the flag returned.
2. Stopping the app manager, clearing the flag, and restarting it also failed to keep the flag clear. A subsequent read found it set again before another owner launch was requested, with the recorded launch count/date unchanged.

The manager was restored to normal operation after the test. The recurrence's actual producer was not identified. The inspected revocation records were empty, and no evidence established that the modified Apple JavaScript caused an integrity rejection. These observations do not justify disabling Samsung services or publishing repeated database writes as a fix.

The public workflow therefore uses a separate launcher once native playback has been verified. It includes no database-repair script or background service that repeatedly clears the flag.

## What worked

The [four-file launcher source](../launcher/apple-tv-direct/) uses the public Tizen `application.launch` privilege to request `com.samsung.tv.aria-video`. On an accepted launch it exits **itself**. If the request fails, it shows a short error and allows OK to retry or Back to exit.

It contains no streaming player, embedded browser, Apple sign-in code or network/media access. The genuine app continues to handle the catalogue, account, entitlement, DRM and playback. The launcher installation made no further changes to Apple app files, firmware or Smart Hub country. VOYO remained installed; the launcher test was not a fresh playback test of every other service.

The sample declares Tizen 4.0 as its minimum API version. Only the Tizen 9 QN90C above was tested. The older 2016/Tizen 2.4 model remains unverified, and changing the manifest's minimum version would not establish compatibility.

## Signing and installation

Earlier packages signed with generic SDK profiles reached the TV but were rejected for their certificate chain. Local signature checks alone were insufficient.

For the successful package, the owner completed Samsung account authentication in the computer's browser. Official Samsung tooling issued a fresh author certificate and a **Public TV distributor certificate containing the target TV's DUID**. Local checks verified certificate validity, private-key matching, the expected Samsung CA signatures, the actual issued distributor's device binding, the exact packaged source and both XML signatures. The TV then accepted the signed package, and its installed-app inventory contained **Apple TV Direct**.

Use the [build/sign/install instructions](../launcher/README.md) with your own certificates and device identity. No device-bound signed package, certificate, private key, password, authentication cache or private TV identifier is published here. Keep the author certificate privately for updates to your own installation.

For an agent running under WSL, first check Windows browser integration and the local callback route. In this case, the Windows browser could reach the WSL loopback listener directly; no SSH tunnel was needed. A genuinely remote browser requires its own verified callback arrangement. Never paste an OAuth callback URL or payload into chat: it can contain an access token. The browser is used for Samsung certificate issuance; Apple TV viewing stays on the TV.

## Verification and remaining limits

| Check | Result and evidence |
| --- | --- |
| Installation | TV installer reported completion; independent installed-app listing contained the helper |
| Native launch from stopped state | Before launching only the helper, Apple TV was stopped/hidden; afterward it was running/visible |
| Helper lifecycle | The helper was stopped/hidden after the genuine app opened |
| Home/restart/subscription playback | Owner reported success after the requested new-Home-tile, restart and picture-and-sound test |
| Original Samsung entry | Not repaired by this workaround; retain the app and use the new tile |
| Other models, long sessions, 4K/HDR and future updates | Not validated by this follow-up |

One successful restart is useful evidence, not a guarantee of indefinite persistence. The native app and the earlier compatibility insertion may still require separate reassessment after an app or firmware update.

## Removing the workaround

Remove **Apple TV Direct** through Apps Settings if it is no longer needed. That removes the helper only. Keep the original Apple TV app if you still intend to use it. Removing the helper does not restore the original Samsung entry or undo the separate compatibility insertion; that insertion has its own guarded rollback procedure.
