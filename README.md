# Gimloader Mods

A collection of custom Gimloader plugins and experiments made for Gimkit.

## Plugins

| Plugin | What it does |
| --- | --- |
| [IdleForXp](IdleForXp.js) | Automatically answers questions in supported 2D games, adjusts its timing to energy levels, and stops refilling at 5,000 energy. Coordinates with Auto Bait in Fishtopia. |
| [Auto Bait](AutoBait.js) | Answers questions for bait in Fishtopia, with a faster rate below 10 bait, a slower rate below 30, and a stop at 30. |
| [Smooth Energy Counter](SmoothEnergyCounter.js) | Changes the energy display only. It displays energy spent and holds gains until you press R to show the actual amount. |
| [Hide Energy Popup](HideEnergyPopup.js) | Hides the energy reward popup. |
| [Character Visual Picker](CharacterVisualPicker.js) | Adds a searchable skin and trail picker to CharacterCustomization settings. Requires the CharacterCustomization plugin. |
| [Synced Summit Routes](SyncedSummitRoutes.js) | Records and replays Don't Look Down routes, saving faster runs. Set the Summit 1 start from its Start menu before recording. |

Synced Summit Routes is experimental: movement can drift, and a complete summit run has not been verified for this version. If you take control or playback drifts off course, it records your correction after the part already played. It can stop on interruptions; it does not correct lag automatically. Returning to the marked Summit 1 start restarts the recording. An ordinary fall does not stop it. Turn off InputRecorder and Desynchronize before using it.

SummitRouteManager.js is an older route manager; DLDInputProbe.js and RoutePlaybackDiagnostic.js are temporary diagnostic tools. They are intended for testing; the older route manager requires InputRecorder.

## Install

1. Install [Gimloader](https://github.com/Gimloader/Gimloader).
2. Download the desired `.js` file from this repository.
3. Open Gimkit and the Gimloader menu using the wrench or **Alt + P**.
4. In the Plugins tab, choose **Create/Install → Upload File** and select the downloaded script. Alternatively, drag the file onto the Plugins tab.

See the [Gimloader installation guide](https://gimloader.github.io/usage/plugins/) for details. These plugins depend on Gimkit and Gimloader internals and may stop working when those change.

## Credits

IdleForXp and Auto Bait are adapted from Gimloader's official IdleForXp plugin. Their original source is credited in their headers. Plugin author fields are set to jonathan+codex. Gimloader and Gimkit are separate projects; this collection is unofficial.
