#!/usr/bin/env bash
set -euo pipefail

# Load environment variables
if [ -f ".env.development" ]; then
  echo "Sourcing .env.development..."
  set -a
  source .env.development
  set +a
fi

# Required environment variables
: "${OWNER_PRIVATE_KEY_HEX:?OWNER_PRIVATE_KEY_HEX must be set}"
: "${USER_PRIVATE_KEY_HEX:?USER_PRIVATE_KEY_HEX must be set}"
: "${FOUNDER_PRIVATE_KEY_HEX:?FOUNDER_PRIVATE_KEY_HEX must be set}"
: "${DEVELOPER_PRIVATE_KEY_HEX:?DEVELOPER_PRIVATE_KEY_HEX must be set}"

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

echo "========================================"
echo "STEP 1 - Deploy & Initialize"
echo "========================================"

forge script unified/DeployAndInitialize.s.sol:DeployAndInitializeScript \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --skip-simulation \
    --private-key "$OWNER_PRIVATE_KEY_HEX" \
    -vvvv

echo
echo "========================================"
echo "STEP 2 - Advance blockchain time"
echo "========================================"

cast rpc --rpc-url "$RPC_URL" evm_increaseTime 600
cast rpc --rpc-url "$RPC_URL" evm_mine

echo
echo "========================================"
echo "STEP 3 - Finalize TWAP & Lock Assets"
echo "========================================"

forge script unified/FinalizeTWAPAndLock.s.sol:FinalizeTWAPAndLockScript \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --skip-simulation \
    --private-key "$USER_PRIVATE_KEY_HEX" \
    --via-ir \
    -vvvv

echo
echo "========================================"
echo "Setup completed successfully."
echo "========================================"
