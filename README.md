<div align="center">
  <img src="apps\web\public\favicon-96x96.png" alt="Buffcat Logo" width="96" height="96">
  
  # Buffcat
  
  **Earn Secondary Income From Your Tokens**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://etherscan.io/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a)
  [![Base](https://img.shields.io/badge/Base-0052FF?logo=coinbase&logoColor=white)](https://basescan.org/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a)

**Follow us on X (Twitter):** [![X](https://img.shields.io/badge/BuffcatFinance-000000?style=flat&logo=x&logoColor=white)](https://x.com/BuffcatFinance)

</div>

---

## 👥 Team

<div align="center">

<div align="center" style="display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
  <table>
    <tr>
      <td align="center" style="border: none;">
        <img src="https://github.com/antpoolerjr.png" width="120px"/><br />
        <sub><b>Anthony Pooler (Founder)</b></sub><br />
        <a href="https://github.com/antpoolerjr">
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white"/>
        </a>
        <a href="https://www.linkedin.com/in/anthony-pooler-27a842b5/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white"/>
        </a>
      </td>
      <td width="40px"></td>
      <td align="center" style="border: none;">
        <img src="https://github.com/bhivgadearav.png" width="120px"/><br />
        <sub><b>Arav Bhivgade (Developer)</b></sub><br />
        <a href="https://github.com/bhivgadearav">
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white"/>
        </a>
        <a href="https://www.linkedin.com/in/aravbhivgade/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white"/>
        </a>
      </td>
    </tr>
  </table>
</div>

</div>

---

## 🛠️ Tech Stack

<div align="center">
  
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
  ![Foundry](https://img.shields.io/badge/Foundry-000000?style=for-the-badge&logo=ethereum&logoColor=white)
  ![Wagmi](https://img.shields.io/badge/Wagmi-1C1B1B?style=for-the-badge&logo=ethereum&logoColor=white)
  ![Viem](https://img.shields.io/badge/Viem-646CFF?style=for-the-badge&logo=ethereum&logoColor=white)
  ![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white)
  ![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
  ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
  
</div>

---

## 📖 Table of Contents

- [Introduction](#-introduction)
- [Deployed Contracts](#-deployed-contracts)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Smart Contract Behavior](#-smart-contract-behavior)
- [Smart Contract ABIs](#-smart-contract-abis)
- [Quickstart (Dev)](#-quickstart-dev)
- [Testing Guide](#-testing-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Introduction

Buffcat enables users to earn secondary income from their tokens. By locking tokens into the protocol, users can claim rewards accumulated in Buffcat's reward pool.

**Key Features:**

- 🔒 **Lock:** Lock any token for a set period of time either fixed or flexible. With a fixed lock you can only unlock your tokens after set time period ends and with flexible you can unlock anytime. Adding a referral gives you additional 0.5% boost when claiming rewards.
- 🔓 **Unlock:** You can unlock your tokens anytime if the lock is flexible otherwise you have to wait untill the set time period ends before you can unlock. This will affect your next rewards claim.
- 💰 **Claim Rewards:** You can claim tokens accumulated in buffcat's reward pool with an interval of a day since lock/last claim. You can get boosted rewards depending on lock duration, how many unique tokens you have locked and if you added a referral when locking. Boosts are only applied if your lock has more than 3% of locked amount left. Lastly, rewards are limited by the daily claim limit of non stable and stable token reward pools.

---

## 🚀 Deployed Contracts

The Buffcat protocol is deployed on both **Ethereum** and **Base** networks using upgradeable proxy patterns:

### Ethereum Mainnet

| Contract           | Address                                      | Explorer                                                                                     |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Proxy**          | `0x31eCd0a6d66263Bc1d0150a0e0eEfc9204D6A391` | [View on Etherscan](https://etherscan.io/address/0x31eCd0a6d66263Bc1d0150a0e0eEfc9204D6A391) |
| **Implementation** | `0x458C8D6b9D28b9f996e9550c8F84E135aD6151eF` | [View on Etherscan](https://etherscan.io/address/0x458C8D6b9D28b9f996e9550c8F84E135aD6151eF) |

### Base Mainnet

| Contract           | Address                                      | Explorer                                                                                    |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Proxy**          | `0x31eCd0a6d66263Bc1d0150a0e0eEfc9204D6A391` | [View on BaseScan](https://basescan.org/address/0x31eCd0a6d66263Bc1d0150a0e0eEfc9204D6A391) |
| **Implementation** | `0x458C8D6b9D28b9f996e9550c8F84E135aD6151eF` | [View on BaseScan](https://basescan.org/address/0x458c8d6b9d28b9f996e9550c8f84e135ad6151ef) |

> **Note:** Both Ethereum and Base networks use identical code.

---

## 📁 Project Structure

```
/monorepo
├─ .husky/                  # Git hooks
├─ .turbo/                  # Turborepo cache/internals
├─ .vscode/                 # Workspace editor settings
├─ apps/
│  └─ web/                  # Next.js + TypeScript frontend/dApp
├─ contracts/
│  ├─ base/                 # Base network contract + Foundry project
│  └─ ethereum/             # Ethereum contract + Foundry project
├─ packages/
│  ├─ eslint-config/        # ESLint shareable config
│  └─ typescript-config/    # TS config packages & shared types
├─ node_modules/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

Each folder is focused: `apps/web` is your dApp, `contracts` holds all on-chain code (Foundry-based for EVM), and `packages` stores shared config/util types used by both web and contracts.

---

## 🏗️ Architecture

### Website

- **Framework:** Next.js + TypeScript
- **Wallet & Blockchain:** `wagmi`, `viem`, `ethers.js`
- **Purpose:** User interface for locking/unlocking tokens, viewing positions, initiating transactions, and displaying on-chain state (balances, supply of liquid tokens)
- **Features:** Modern React hooks via `wagmi` and `viem` for seamless blockchain interactions

### Ethereum & EVM Contracts

- **Language & Tooling:** Solidity — developed & tested with Foundry (Forge)
- **Libraries:** OpenZeppelin contracts for ERC-20, access control, upgradeability patterns, and Clones
- **Pattern:** Upgradeable proxy pattern for protocol upgrades; derivative tokens deployed via OpenZeppelin Clones for gas efficiency

---

## 🔐 Smart Contract Behavior

### Lock

Lock any token for a set period of time either fixed or flexible. With a fixed lock you can only unlock your tokens after set time period ends and with flexible you can unlock anytime. Adding a referral gives you additional 0.5% boost when claiming rewards.

### Unlock

You can unlock your tokens anytime if the lock is flexible otherwise you have to wait untill the set time period ends before you can unlock. This will affect your next rewards claim.

### Claim Rewards

You can claim tokens accumulated in buffcat's reward pool with an interval of a day since lock/last claim. You can get boosted rewards depending on lock duration, how many unique tokens you have locked and if you added a referral when locking. Boosts are only applied if your lock has more than 3% of locked amount left. Lastly, rewards are limited by the daily claim limit of non stable and stable token reward pools.

---

## 📄 Smart Contract ABIs

### Interface (Solidity)

For the complete interface file, see: [IBuffCat.sol](file:///c:/Users/ARAV/dev/buffcat/contracts/ethereum/src/IBuffCat.sol)

```solidity
interface IBuffCat {
  function lockAssets(
    address _token,
    uint256 _amount,
    uint256 _lockDuration,
    LockType _lockType,
    address _referrer
  ) external;

  function unlockAssets(uint256 _lockId, uint256 _amount) external;

  function claimRewards(
    address[] calldata _tokens,
    uint256 _lockId,
    uint256 daysOfUnclaimed
  ) external;
}
```

### Minimal ABI (JSON)

Minimal ABI for interaction, see both JSON files: [eth/buffcat.json](file:///c:/Users/ARAV/dev/buffcat/apps/web/src/lib/eth/buffcat.json) and [base/buffcat.json](file:///c:/Users/ARAV/dev/buffcat/apps/web/src/lib/base/buffcat.json)

```json
[
  {
    "type": "function",
    "name": "lockAssets",
    "inputs": [
      { "name": "_token", "type": "address", "internalType": "address" },
      { "name": "_amount", "type": "uint256", "internalType": "uint256" },
      { "name": "_lockDuration", "type": "uint256", "internalType": "uint256" },
      { "name": "_lockType", "type": "uint8", "internalType": "enum LockType" },
      { "name": "_referrer", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unlockAssets",
    "inputs": [
      { "name": "_lockId", "type": "uint256", "internalType": "uint256" },
      { "name": "_amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimRewards",
    "inputs": [
      { "name": "_tokens", "type": "address[]", "internalType": "address[]" },
      { "name": "_lockId", "type": "uint256", "internalType": "uint256" },
      { "name": "daysOfUnclaimed", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
]
```

---

## 🚀 Quickstart (Dev)

### 1. Install Website Dependencies

```bash
pnpm install
```

### 2. Install Solidity Dependencies

#### Install Foundry

Follow the official [Foundry installation guide](https://book.getfoundry.sh/getting-started/installation).

#### Ethereum Contracts

```bash
cd contracts/ethereum
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.5.0
```

#### Base Contracts

```bash
cd contracts/base
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.5.0
```

### 4. Run Frontend Development Server

```bash
cd apps/web
pnpm dev
```

Or from the root:

```bash
pnpm --filter web dev
```

### 5. Build EVM Contracts

```bash
cd contracts/ethereum  # or contracts/base
forge build
```

---

## 🧪 Testing Guide

### How to test evm contract with website

1. Install Foundry
2. Install MetaMask and create a new chain for local anvil with chain id 9999
3. Open terminal and run `anvil --fork-url ${RPC_URL} --chain-id 9999`
4. Open separate terminal and run `cd contracts/ethereum/test/integration`
5. Run `./deploy.sh`
6. Import the wallet USER_PRIVATE_KEY_HEX from contracts/ethereum/test/integration/.env.development in MetaMask
7. Open another terminal and run `pnpm run dev`
8. Open localhost:3000 in the browser with installed metamask and imported wallet
9. Connect wallet and you'll see tokens deployed, locks made etc for you to test the website

---

## 🤝 Contributing

- Follow repository linting and formatting rules (see `packages/eslint-config` and workspace `tsconfig`)
- Create feature branches and open PRs with clear descriptions and tests
- Run `pnpm turbo run test` before opening PRs
- Ensure all Foundry tests pass with `forge test`

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  
  [Report Bug](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/issues) • [Request Feature](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/issues)
  
</div>
