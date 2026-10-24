# Installed Windows desktop sync checklist

Status: **NOT VERIFIED in an installed MSI/NSIS build.** Local static export and
Tauri compilation do not prove sign-in or sync. The current Tauri CSP allows
`http://localhost:4000` for development only. A production HTTPS API origin is
not allowlisted, and cookie behavior from Tauri's app origin has not been
observed. Do not advertise desktop sync until the steps below pass.

Use a disposable account and a staging HTTPS API. Record installer filename,
version, SHA-256 digest, Windows version, and whether it is MSI or NSIS. Keep a
JSON backup of an existing local profile before an upgrade test.

| Check | Exact manual action | Status |
| --- | --- | --- |
| Install and launch | Install the actual artifact on a clean Windows account, launch, close, relaunch. | NOT VERIFIED |
| Offline local mode | Disconnect network; create profile, task, note, and backup; restart and confirm persistence. | NOT VERIFIED |
| Sign-up and verification | Connect to staging; create account; follow staging mailbox link; sign in in installed app. | NOT VERIFIED |
| Session lifecycle | Restart app, confirm session persists; wait for or force expiration and confirm graceful sign-in prompt. | NOT VERIFIED |
| Password reset | Request link; complete reset in browser or app; confirm old session invalid and new password works. | NOT VERIFIED |
| Network policy | Inspect WebView developer tools for HTTPS requests, allowed CSP, exact Origin, CORS response, and cookie storage/sending. | NOT VERIFIED |
| API errors | Disable staging API, then restore it; confirm user-facing error and no local-data loss. | NOT VERIFIED |
| Offline sync | Link one profile, disconnect, edit selected data, restart with pending outbox, reconnect, confirm upload and second-device pull. | NOT VERIFIED |
| Conflict | Edit same item on two devices, reconnect, choose both resolution paths in separate runs. | NOT VERIFIED |
| Profile and unlink | Confirm other profiles stay local; unlink and confirm local data remains and uploads stop. | NOT VERIFIED |
| Delete account | Delete staging account, confirm server data gone and local data retained. | NOT VERIFIED |
| Upgrade | Install prior released artifact with sample data, upgrade in place, confirm IndexedDB profile and backup survive. | NOT VERIFIED |
| Reinstall | Uninstall/reinstall and document whether app data is retained or removed by installer. | NOT VERIFIED |
| Artifact integrity | Compare installer SHA-256 to release artifact and confirm version displayed matches package metadata. | NOT VERIFIED |

If sign-in fails because the Tauri app origin and staging API are cross-site,
design and test a desktop-specific auth flow before changing CSP or cookie
settings. Do not broaden CSP to arbitrary HTTPS origins. A desktop feature flag
or UI gate should hide unavailable sync when no verified API origin is bundled.
