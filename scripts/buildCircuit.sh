#!/usr/bin/env bash
set -ex

if [ "$#" -lt 1 ]; then
  echo "Wrong number of arguments, usage: buildCircuit.sh [CIRCUIT_NAME] <POWERS_OF_TAU=14>"
  exit 1
fi
POWERS_OF_TAU=14
if [ "$#" -gt 1 ]; then
  POWERS_OF_TAU="$2"
fi


BASE=$(cd "$(dirname "$0")";pwd)
ROOT="${BASE}/.."
BUILD="${ROOT}/build/circuits"
SRC="${ROOT}/src"
DIST="${ROOT}/dist/circom/dev"
CIRCUIT="$1"

mkdir -p "${BUILD}"
if [ ! -f "${BUILD}/ptau${POWERS_OF_TAU}" ]; then
  echo "Downloading powers of tau file"
  curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${POWERS_OF_TAU}.ptau" --create-dirs -o "${BUILD}/ptau${POWERS_OF_TAU}"
fi

echo "Building circuit for ${ROOT}/circuits/${CIRCUIT}.circom"
lowerName=`echo "${CIRCUIT}" | tr '[:upper:]' '[:lower:]'`
circom --r1cs --wasm --sym --output "${BUILD}" "${ROOT}/circuits/${CIRCUIT}.circom"
npx snarkjs groth16 setup "${BUILD}/${CIRCUIT}.r1cs" "${BUILD}/ptau${POWERS_OF_TAU}" "${BUILD}/tmp_${CIRCUIT}.zkey"
echo "qwe" | npx snarkjs zkey contribute "${BUILD}/tmp_${CIRCUIT}.zkey" "${BUILD}/${CIRCUIT}.zkey"
npx snarkjs zkey verify "${BUILD}/${CIRCUIT}.r1cs" "${BUILD}/ptau${POWERS_OF_TAU}" "${BUILD}/${CIRCUIT}.zkey"
npx snarkjs zkey export verificationkey "${BUILD}/${CIRCUIT}.zkey" "${BUILD}/${CIRCUIT}.vkey.json"
npx snarkjs zkey export solidityverifier "${BUILD}/${CIRCUIT}.zkey" "${ROOT}/contracts/verifiers/${CIRCUIT}Verifier.sol"
sed -i '' "s/Verifier/${CIRCUIT}Verifier/g" "${ROOT}/contracts/verifiers/${CIRCUIT}Verifier.sol"
sed -i '' "s/Pairing/${CIRCUIT}Pairing/g" "${ROOT}/contracts/verifiers/${CIRCUIT}Verifier.sol"
npx snarkjs info -r "${BUILD}/${CIRCUIT}.r1cs"
cp "${BUILD}/${CIRCUIT}_js/${CIRCUIT}.wasm" "${DIST}/${CIRCUIT}.wasm"
cp "${BUILD}/${CIRCUIT}_js/witness_calculator.js" "${SRC}/protocol/generated/${lowerName}_witness_calculator.js"
cp "${BUILD}/${CIRCUIT}.zkey" "${DIST}/${CIRCUIT}.zkey"
cp "${BUILD}/${CIRCUIT}.vkey.json" "${DIST}/${CIRCUIT}.vkey.json"
