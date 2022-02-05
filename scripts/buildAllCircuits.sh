#!/usr/bin/env bash
set -ex

BASE=$(cd "$(dirname "$0")";pwd)

${BASE}/buildCircuit.sh "Withdraw" "16"
${BASE}/buildCircuit.sh "Rollup1" "16"
${BASE}/buildCircuit.sh "Rollup4" "18"
${BASE}/buildCircuit.sh "Rollup16" "20"
#${BASE}/buildCircuit.sh "Rollup64" "22"
#${BASE}/buildCircuit.sh "Rollup256" "24"

