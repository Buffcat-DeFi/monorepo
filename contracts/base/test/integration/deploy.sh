set -euo pipefail

# Load environment variables from .env if it exists
if [ -f ".env.development" ]; then
  echo "Sourcing .env file..."
  # Use 'export' to ensure values are in the shell
  set -o allexport
  source .env
  set +o allexport
fi

# Ensure required env vars are present
: "${OWNER_PRIVATE_KEY:?OWNER_PRIVATE_KEY must be set}"
: "${USER_PRIVATE_KEY:?USER_PRIVATE_KEY must be set}"
: "${FOUNDER_PRIVATE_KEY:?FOUNDER_PRIVATE_KEY must be set}"
: "${DEVELOPER_PRIVATE_KEY:?DEVELOPER_PRIVATE_KEY must be set}"

echo "Exported environment variables."

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

# start Anvil in background
echo "Starting anvil..."
anvil --quiet &
ANVIL_PID=$!
trap "kill $ANVIL_PID" EXIT
sleep 2

echo "Deploying TestingScript..."
forge script test/integration/testing-script.s.sol:TestingScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$OWNER_PRIVATE_KEY" \
  -vvvv

echo "Script completed."

