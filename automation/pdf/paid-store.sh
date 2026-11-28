#!/usr/bin/env bash
# The paid download files do not live in this public repository. They live in a
# PRIVATE one (frog-logic-paid-files). Jobs that need them, or that build new
# ones, call this script:
#
#   paid-store.sh fetch   copy the paid files into digital/ for this run
#   paid-store.sh save    send any new or changed paid file in digital/ back
#
# It needs the secret PAID_FILES_WRITE_TOKEN (a key that can write to that one
# private repository only). The key is passed in a request header for this run
# and is never written to a file, a web address or the log. With no key set the
# script does nothing, so a job still runs as it did before the switch.
set -euo pipefail

mode="${1:-}"
repo="${PAID_FILES_REPO:-froglogic60/frog-logic-paid-files}"
token="${PAID_FILES_WRITE_TOKEN:-}"
store="${RUNNER_TEMP:-/tmp}/paid-store"
root="$(cd "$(dirname "$0")/../.." && pwd)"

# The only files in digital/ that are free and stay public.
is_free() {
  case "$1" in
    Pond-Guide-*.pdf | Christmas-Visual-Timetable.pdf | Christmas-Visual-Timetable-Letter.pdf) return 0 ;;
    *) return 1 ;;
  esac
}

if [ "$mode" != "fetch" ] && [ "$mode" != "save" ]; then
  echo "usage: paid-store.sh fetch|save" >&2
  exit 2
fi
if [ -z "$token" ]; then
  echo "paid-store: no PAID_FILES_WRITE_TOKEN set, so '$mode' is skipped"
  exit 0
fi

auth="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$token" | base64 | tr -d '\n')"
g() { git -c "http.https://github.com/.extraheader=$auth" "$@"; }

if [ ! -d "$store/.git" ]; then
  g clone --quiet --depth 1 "https://github.com/$repo.git" "$store"
fi

if [ "$mode" = "fetch" ]; then
  n=0
  for f in "$store"/*.pdf "$store"/*.xlsx; do
    [ -f "$f" ] || continue
    cp "$f" "$root/digital/"
    n=$((n + 1))
  done
  echo "paid-store: $n paid files copied into digital/"
  exit 0
fi

n=0
for f in "$root"/digital/*.pdf "$root"/digital/*.xlsx; do
  [ -f "$f" ] || continue
  name="$(basename "$f")"
  if is_free "$name"; then continue; fi
  if ! cmp -s "$f" "$store/$name"; then
    cp "$f" "$store/$name"
    n=$((n + 1))
  fi
done
if [ "$n" -eq 0 ]; then
  echo "paid-store: nothing new to save"
  exit 0
fi
cd "$store"
git config user.name "frog-logic-bot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A
git commit --quiet -m "Paid files updated by ${GITHUB_WORKFLOW:-a job} ($n file(s))"
g push --quiet
echo "paid-store: $n paid file(s) saved to the private store"
