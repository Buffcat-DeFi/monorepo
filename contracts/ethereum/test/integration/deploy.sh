set -euo pipefail

# Load environment variables from .env if it exists
if [ -f ".env.development" ]; then
  echo "Sourcing .env.development..."
  set -a
  source .env.development
  set +a
fi

# Ensure required env vars are present
: "${OWNER_PRIVATE_KEY_HEX:?OWNER_PRIVATE_KEY_HEX must be set}"
: "${USER_PRIVATE_KEY_HEX:?USER_PRIVATE_KEY_HEX must be set}"
: "${FOUNDER_PRIVATE_KEY_HEX:?FOUNDER_PRIVATE_KEY_HEX must be set}"
: "${DEVELOPER_PRIVATE_KEY_HEX:?DEVELOPER_PRIVATE_KEY_HEX must be set}"

echo "Exported environment variables."

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

echo "Deploying TestingScript..."
forge script ./testing-script.s.sol:TestingScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$OWNER_PRIVATE_KEY_HEX" \
  -vvvv

echo "Script completed."

