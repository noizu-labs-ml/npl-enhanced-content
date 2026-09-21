#!/bin/sh
# Runtime GA4 injection for the nginx-served static site.
#
# nginx:alpine's stock entrypoint runs every /docker-entrypoint.d/*.sh before
# starting nginx, so no ENTRYPOINT/CMD override is needed.
#
# The image ships a pristine copy of index.html at $GA_TEMPLATE. Each container
# start regenerates the served file from that template, so the step is
# idempotent across restarts and changing the measurement id is a redeploy of
# the same image, never a rebuild.
#
# GA_MEASUREMENT_ID unset or empty => the marker line is dropped outright: no
# script tag, no partial tag, no leftover comment, no JS.
set -eu

TEMPLATE="${GA_TEMPLATE:-/usr/share/nginx/templates/index.html}"
TARGET="${GA_TARGET:-/usr/share/nginx/html/index.html}"
MARKER="<!-- GA_MEASUREMENT_ID_SNIPPET -->"

if [ ! -f "$TEMPLATE" ]; then
  echo "ga: no template at $TEMPLATE — nothing to inject" >&2
  exit 0
fi

id="${GA_MEASUREMENT_ID:-}"

# The id is interpolated into HTML. Anything outside the GA id alphabet is
# rejected rather than escaped, so a malformed value can never inject markup.
if [ -n "$id" ] && ! printf %s "$id" | grep -Eq "^[A-Za-z0-9_-]+$"; then
  echo "ga: GA_MEASUREMENT_ID is not [A-Za-z0-9_-]+ — analytics disabled" >&2
  id=""
fi

if [ -n "$id" ]; then
  # Two separate awk vars: a -v value may not contain a literal newline.
  tag_src="<script async src=\"https://www.googletagmanager.com/gtag/js?id=${id}\"></script>"
  tag_cfg="<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>"
  echo "ga: injecting GA4 tag ${id} into ${TARGET}"
else
  tag_src=""
  tag_cfg=""
  echo "ga: GA_MEASUREMENT_ID unset — ${TARGET} served with no analytics"
fi

tmp="${TARGET}.ga.tmp"
awk -v marker="$MARKER" -v tag_src="$tag_src" -v tag_cfg="$tag_cfg" '
  index($0, marker) {
    if (tag_src != "") { print tag_src; print tag_cfg }
    next
  }
  { print }
' "$TEMPLATE" > "$tmp"
mv "$tmp" "$TARGET"
