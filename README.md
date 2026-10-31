# Samsung TV native Apple TV guide for Codex

A reusable prompt for investigating native Apple TV installation and playback on Samsung televisions. It adapts discovery and troubleshooting to each generation, country and software version, while preserving the owner's existing streaming services.

**The workflow is general; the included compatibility patch is not.** One Romanian QN90C configuration has a confirmed native playback result. Other TVs must be assessed individually, and some will have no verified native route.

## Start here

1. Download this folder and open it in a local Codex session on a computer that can reach your TV's network. Keep the TV remote nearby.
2. Tell Codex: **“Read SAMSUNG_TV_PROMPT.md and follow it for my Samsung TV. Start with discovery.”**
3. Answer the questions about your TV, country and services you want to keep. You can fill in the prompt's optional preferences beforehand, but you do not need to know every technical detail.

For the interactive Codex CLI, run this from the downloaded folder:

```sh
codex --search --sandbox workspace-write --ask-for-approval on-request "Read SAMSUNG_TV_PROMPT.md and follow it for my Samsung TV. Start with discovery."
```

The [official CLI reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli) documents these options. Use an interactive local session so you can respond to TV prompts and review proposed device changes. Keep the normal permission controls. Local network access and host tools depend on your Codex environment; the prompt cannot create access that the environment lacks. No additional plugin is required.

You can also copy the entire prompt into a local Codex conversation. The optional case branch references companion files, so keep this folder available if you want Codex to evaluate that branch.

## Files

| File | Purpose |
| --- | --- |
| [SAMSUNG_TV_PROMPT.md](SAMSUNG_TV_PROMPT.md) | The main prompt to give Codex |
| [cases/QN90C-ROMANIA.md](cases/QN90C-ROMANIA.md) | Exact tested configuration, evidence and limits |
| [compat/romania-qn90c/README.txt](compat/romania-qn90c/README.txt) | Advanced, version-specific patch instructions |
| `compat/romania-qn90c/build_patch.py` | Builds from the owner's exact matching original app file, offline |
| `compat/romania-qn90c/tv_commands.py` | Extracts backups and generates guarded apply/rollback commands, offline |
| `compat/romania-qn90c/insertion.js` | The authored compatibility insertion |
| `compat/romania-qn90c/SHA256SUMS` | Integrity checks for the four companion files |
| `.gitignore` | Excludes default private-session folders and common generated artifacts |

The prompt covers missing store listings, launch errors, sign-in errors and playback failures separately. It asks Codex to verify current device support, read the TV's own values, preserve essential apps, obtain permission for advanced changes, prepare rollback and require real playback confirmation. It does not assume every Samsung supports Tizen, .NET, Developer Mode or the same root method.

## What is verified

On 31 October 2026, the owner confirmed native Apple TV subscription playback with picture and sound on one QE65QN90CATXXH using a Romanian Apple account and Smart Hub RO. The case note records the exact software and what was not tested.

This general prompt is newly written and reviewed against representative scenarios. It has not been executed as an end-to-end workflow on other TVs. The optional portable helper scripts were tested offline; their generated commands have not themselves been run on a TV. This distinction matters when sharing the project.

## Publishing your copy

Upload only this reviewed guide folder. The included `.gitignore` keeps the default private-session location out of normal Git adds, but review every staged path and diff. Do not upload TV backups, generated apply/rollback scripts, device logs, pairing tokens or complete Apple app files. The original case's private network addresses and credentials are not included.

No particular GitHub owner or repository name is embedded in the instructions. Relative links work wherever you publish the folder. The guide does not require a LinkedIn article to be usable.

## Sources and credits

- [Apple service availability by country](https://support.apple.com/en-us/118205): verify the current country and desired service.
- [Samsung Apple TV and AirPlay compatibility](https://www.samsung.com/de/support/tv-audio-video/tv-airplay-2-und-apple-tv/): one regional support reference, not universal catalogue eligibility.
- [Samsung TV developer model groups](https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html): generation-specific platform information; check the actual runtime too.
- [Samsung TV root tooling, v0.0.12](https://github.com/chris-ritsen/samsung-tv-root/tree/v0.0.12): the temporary access tool used in the single tested case; no root payloads are included here.
- [mircea1223/lg-appletv-romania](https://github.com/mircea1223/lg-appletv-romania): earlier Romanian configuration investigation; its LG procedure is not a Samsung installation method.

Prepared by Mihai Cvasnievschi with Codex, 31 October 2026. Read the case's attribution before reusing the compatibility files. This package contains the authored insertion and narrow source anchors, not complete Apple application files, signed updates or firmware.

The prompt is intended for use in your own Codex sessions. No repository-wide redistribution license has been selected; upstream tools and locally obtained Apple files retain their respective terms.
