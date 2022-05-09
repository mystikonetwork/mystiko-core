#!/usr/bin/env bash
set -e

BASE=$(cd "$(dirname "$0")";pwd)
ROOT="${BASE}/../.."
DIST="${ROOT}/dist/zokrates/dev"

for file in $(ls "${DIST}"); do
  md5=`md5sum "${DIST}/${file}" | awk '{ print $1 }'`
  mv "${DIST}/${file}" "${DIST}/${md5}.${file}"
done
