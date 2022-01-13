#!/usr/bin/env bash
set -ex

BASE=$(cd "$(dirname "$0")";pwd)
ROOT="${BASE}/.."
BUILD="${ROOT}/build/circuits"
POWERS_OF_TAU=16

mkdir -p "${BUILD}"
if [ ! -f "${BUILD}/ptau${POWERS_OF_TAU}" ]; then
  echo "Downloading powers of tau file"
  curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${POWERS_OF_TAU}.ptau" --create-dirs -o "${BUILD}/ptau${POWERS_OF_TAU}"
fi

npx circom -v -r "${BUILD}/withdraw.r1cs" -w "${BUILD}/withdraw.wasm" -s "${BUILD}/withdraw.sym" "${ROOT}/circuits/withdraw.circom"
npx snarkjs groth16 setup "${BUILD}/withdraw.r1cs" "${BUILD}/ptau${POWERS_OF_TAU}" "${BUILD}/tmp_withdraw.zkey"
echo "qwe" | npx snarkjs zkey contribute "${BUILD}/tmp_withdraw.zkey" "${BUILD}/withdraw.zkey"
npx snarkjs zkey verify "${BUILD}/withdraw.r1cs" "${BUILD}/ptau${POWERS_OF_TAU}" "${BUILD}/withdraw.zkey"
npx snarkjs zkey export verificationkey "${BUILD}/withdraw.zkey" "${BUILD}/withdraw.vkey.json"
npx snarkjs zkey export solidityverifier "${BUILD}/withdraw.zkey" "${ROOT}/contracts/Verifier.sol"
npx snarkjs info -r "${BUILD}/withdraw.r1cs"
