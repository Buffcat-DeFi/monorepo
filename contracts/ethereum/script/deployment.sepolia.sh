#!/bin/bash
set -e

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
  echo "Sourcing .env..."
  set -a
  source .env
  set +a
fi

# Deploy and create projects in one go (For Ethereum)
forge script DeploySepolia.s.sol:DeployBuffCatUpgradeableOnSepolia --verbosity \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --private-key $OWNER_PRIVATE_KEY \
    --verify \
    --verifier etherscan \
    --etherscan-api-key $ETHERSCAN_API_KEY
