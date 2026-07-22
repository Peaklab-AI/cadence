#!/usr/bin/env bash
# Packages the built .app bundle into a .zip and drops it into the landing
# page's public/ folder, so it deploys to cadence.peaklab.ai/downloads
# alongside the site itself. No Apple Developer ID means no notarization —
# curl-based installs (see apps/landing/public/install.sh) sidestep that
# entirely, since curl never sets the com.apple.quarantine attribute that
# triggers Gatekeeper's "unidentified developer" warning.
#
# Usage: scripts/release.sh
set -euo pipefail

cd "$(dirname "$0")/.."

APP_NAME="Cadence"
APP_BUNDLE="src-tauri/target/release/bundle/macos/${APP_NAME}.app"
ZIP_PATH="src-tauri/target/release/bundle/macos/${APP_NAME}.zip"
LANDING_DOWNLOAD_DIR="apps/landing/public/downloads"

pnpm tauri build

VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "${APP_BUNDLE}/Contents/Info.plist")

echo "Zipping ${APP_BUNDLE} (v${VERSION})..."
rm -f "${ZIP_PATH}"
# ditto (not `zip`) preserves the bundle structure and extended attributes
# correctly — plain `zip` can mangle .app bundles.
ditto -c -k --keepParent "${APP_BUNDLE}" "${ZIP_PATH}"

mkdir -p "${LANDING_DOWNLOAD_DIR}"
cp "${ZIP_PATH}" "${LANDING_DOWNLOAD_DIR}/${APP_NAME}.zip"

echo "Built ${ZIP_PATH} (v${VERSION})"
echo "Copied to ${LANDING_DOWNLOAD_DIR}/${APP_NAME}.zip — commit and push apps/landing to publish it at cadence.peaklab.ai/downloads/${APP_NAME}.zip."
