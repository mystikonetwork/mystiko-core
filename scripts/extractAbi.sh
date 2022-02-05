#!/usr/bin/env bash
set -ex

if [ "$#" -ne 1 ]; then
  echo "Wrong number of arguments, usage: extractAbi.sh [CONTRACT_NAME]"
  exit 1
fi

BASE=$(cd "$(dirname "$0")";pwd)
ROOT="${BASE}/.."
BUILD="${ROOT}/build"
CONTRACT_BUILD="${ROOT}/build/contracts"
SRC="${ROOT}/src"
CONTRACT="${CONTRACT_BUILD}/$1.json"

if [ ! -f "${CONTRACT}" ]; then
  echo "$1 does not exit in ${CONTRACT_BUILD}"
  exit 1
fi

jq .abi < "${CONTRACT}" > "${SRC}/chain/abis/$1.json"
