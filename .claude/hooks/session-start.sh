#!/bin/bash
# Prepares a Claude Code cloud session to build and check Space Words:
#   - acorn, for tools/check-es5.js (Chromium 39 / ES5 checker)
#   - Android SDK (platform 34 + build-tools 34) in ~/android-sdk, plus local.properties
#   - Gradle 8.7 and the Android Gradle plugin, pre-downloaded
# Runs only in cloud sessions, in the background so the session starts right away.
# Every step is idempotent, and a blocked download only warns. The Android SDK needs
# dl.google.com allowed in the environment's network settings.
#
# Because it runs in the background, the tools must not depend on its environment variables:
# check-es5.js finds acorn by path, and Gradle finds the SDK through local.properties.
# Progress goes to $STATUS_FILE: "running" while working, then one line per result.
set -uo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

echo '{"async": true, "asyncTimeout": 900000}'

STATUS_FILE="$HOME/.space-words-setup"
echo "running (started $(date -u +%H:%M:%S) UTC)" > "$STATUS_FILE"

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${CLAUDE_ENV_FILE:-/dev/null}"
SDK="$HOME/android-sdk"
NODE_DIR="$HOME/.cache/space-words-node"
CLT_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
PACKAGES=("platforms;android-34" "build-tools;34.0.0")
status=()

# 1. ES5 checker dependency
if [ ! -d "$NODE_DIR/node_modules/acorn" ]; then
  mkdir -p "$NODE_DIR"
  npm install --prefix "$NODE_DIR" --no-audit --no-fund --silent acorn@8 >&2 \
    || echo "warning: could not install acorn; tools/check-es5.js will not run" >&2
fi
echo "export NODE_PATH=\"$NODE_DIR/node_modules\"" >> "$ENV_FILE"
[ -d "$NODE_DIR/node_modules/acorn" ] && status+=("ES5 checker ready (node tools/check-es5.js)")

# 2. Android SDK command-line tools
SDKMANAGER="$SDK/cmdline-tools/latest/bin/sdkmanager"
if [ ! -x "$SDKMANAGER" ]; then
  tmp="$(mktemp -d)"
  if curl -fsSL --retry 3 -o "$tmp/clt.zip" "$CLT_URL"; then
    unzip -q "$tmp/clt.zip" -d "$tmp"
    mkdir -p "$SDK/cmdline-tools"
    rm -rf "$SDK/cmdline-tools/latest"
    mv "$tmp/cmdline-tools" "$SDK/cmdline-tools/latest"
  else
    echo "warning: could not download the Android SDK from dl.google.com (blocked by the network policy?)" >&2
  fi
  rm -rf "$tmp"
fi

# 3. SDK packages, local.properties, Gradle warm-up
cd "$ROOT"
if [ -x "$SDKMANAGER" ]; then
  if [ ! -d "$SDK/platforms/android-34" ] || [ ! -d "$SDK/build-tools/34.0.0" ]; then
    yes 2>/dev/null | "$SDKMANAGER" --sdk_root="$SDK" --licenses >/dev/null 2>&1
    "$SDKMANAGER" --sdk_root="$SDK" "${PACKAGES[@]}" >&2 \
      || echo "warning: sdkmanager could not install ${PACKAGES[*]}" >&2
  fi
  echo "sdk.dir=$SDK" > "$ROOT/local.properties"
  echo "export ANDROID_HOME=\"$SDK\"" >> "$ENV_FILE"
  if [ -d "$SDK/platforms/android-34" ]; then
    if ./gradlew --no-daemon -q help >&2; then
      status+=("Android SDK ready: ./gradlew assembleDebug lintDebug")
    else
      status+=("Android SDK installed, but the Gradle warm-up failed")
    fi
  else
    status+=("Android SDK tools installed, but platform 34 is missing")
  fi
else
  ./gradlew --no-daemon -q --version >/dev/null 2>&1 || true
  status+=("Android SDK NOT available (dl.google.com blocked): APK builds will fail; use node tools/check-es5.js")
fi

printf 'done: %s\n' "${status[@]}" > "$STATUS_FILE"
exit 0
