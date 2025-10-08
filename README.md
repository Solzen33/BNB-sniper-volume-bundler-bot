# 🚀 BNB Chain Trading Bot v2.0 (Support All EVM Chains)
**Professional Sniper, Bundler & Volume Automation for PancakeSwap and Four.meme**

# 👨‍💻 Author
### 📞 Telegram: [FroganBee](https://t.me/froganbee_sol)   
https://t.me/froganbee_sol

A completely rewritten and optimized high-performance trading bot infrastructure built for the **BNB Smart Chain**, featuring enterprise-grade architecture, comprehensive error handling, and real-time monitoring. Designed with precision, speed, and enterprise-grade reliability — ideal for developers, traders, and liquidity engineers.

## ✨ What's New in v2.0

### 🔧 **Major Optimizations**
- **Gas-optimized smart contracts** with OpenZeppelin best practices
- **Advanced bundling logic** with retry mechanisms and circuit breakers
- **Intelligent gas estimation** with dynamic pricing and optimization
- **Comprehensive error handling** with exponential backoff
- **Real-time monitoring** with Telegram/Discord notifications
- **Modular architecture** for easy maintenance and extension

### 🛡️ **Enhanced Security**
- **Input validation** and sanitization
- **Private key protection** with secure handling
- **Transaction limits** and safety checks
- **Emergency pause** functionality
- **Circuit breaker** pattern for fault tolerance

### 📊 **Advanced Monitoring**
- **Real-time transaction tracking**
- **Performance metrics** and analytics
- **Multi-channel notifications** (Telegram, Discord)
- **Comprehensive logging** with structured data
- **Health monitoring** and alerting

## 🧠 Overview
The **BNB Chain Trading Bot v2.0** enables seamless automation of token operations and trading strategies on **PancakeSwap V3** and **Four.meme**.  
It includes everything from token deployment to liquidity provisioning, volume simulation, and bundled transaction execution via **bloXroute** for MEV protection.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Config        │    │   Logger        │    │   Monitor       │
│   Management    │    │   & Alerts     │    │   & Metrics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────┼─────────────────────────────────┐
│                                 │                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Gas            │  │   Error         │  │   Transaction   │  │
│  │   Optimizer      │  │   Handler       │  │   Retry         │  │
│  │   & Estimator    │  │   & Recovery    │  │   Manager       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                 │                                 │
└─────────────────────────────────┼─────────────────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Optimized     │
                    │   Bundler Bot   │
                    │   (Main Logic)  │
                    └─────────────────┘
```

## How it works
### Sniper flow
Load targets from config → query router for expected out → apply configured slippage → perform WBNB → TOKEN swap → emit tx hash/receipt → optionally notify via Telegram.
### Copy‑Trader flow
Subscribe to pending mempool transactions → filter by leader wallets → detect router swap intents → mirror with your position sizing and caps → optionally notify.
### Bundler flow
Read a sequence of routes from config → execute each respecting slippage/deadline settings → suitable base for multicall-style extensions.
### Volume Bot flow
Loop on an interval → small buys → approve when needed → partial or full sells → repeat with built‑in rate limiting.

## ✨ Key Features
- 🚀 **Token Deployment** — Auto-generate and deploy optimized ERC20 tokens with customizable supply, name, and symbol  
- 💧 **Liquidity Management** — Instantly create liquidity pools and provide liquidity on PancakeSwap V3  
- ⚡ **Transaction Bundling** — Integrate with bloXroute to enable atomic, front-run protected operations  
- 🎯 **Trading Strategies** — Execute **sniper**, **bundler**, and **volume-generation** strategies  
- 🔒 **Security First** — Built with **OpenZeppelin** contracts, hardened with audits and local test suites  
- 🧪 **Fork Testing** — Use **BSC mainnet forking** for safe and realistic testing before live deployment  
- 🪙 **Multi-Wallet Orchestration** — Create, manage, and fund multiple wallets for distributed trading  
- 📊 **Real-time Monitoring** — Comprehensive logging, metrics, and multi-channel notifications
- 🛡️ **Advanced Security** — Input validation, circuit breakers, and emergency pause functionality
- ⚡ **Gas Optimization** — Intelligent gas estimation and dynamic pricing

## 🏗️ Architecture
The bot follows a **modular architecture** designed for flexibility and scalability.

| Component | Description |
|------------|-------------|
| **Smart Contracts** | Gas-optimized Solidity-based ERC20 token & liquidity management contracts |
| **Transaction Bundler** | bloXroute API for atomic multi-tx execution and MEV protection |
| **Liquidity Protocols** | Uniswap V3 SDK for PancakeSwap V3 interaction |
| **Development Framework** | Hardhat for compilation, testing, deployment, and simulation |
| **Configuration Management** | Centralized config with environment-specific settings |
| **Error Handling** | Exponential backoff retry with circuit breaker patterns |
| **Monitoring System** | Real-time tracking with Telegram/Discord notifications |

## 🧰 Technology Stack

| Component | Technology |
|------------|-------------|
| Smart Contracts | Solidity ^0.8.19 |
| Framework | Hardhat ^2.19.5 |
| Testing | Hardhat Toolbox |
| DEX Integration | Uniswap V3 SDK |
| Security | OpenZeppelin Contracts |
| RPC Provider | QuickNode/Infura/Alchemy |
| MEV Protection | bloXroute |
| Monitoring | Custom Logger & Metrics |
| Error Handling | Circuit Breaker Pattern |
| Configuration | Environment-based Config |

## ⚙️ Core Modules

- **Wallet Generation** — Create and manage multiple sub-wallets derived from a single master key  
- **BNB Distribution** — Distribute BNB from the master wallet to all sub-wallets automatically  
- **Token Deployment** — Deploy optimized tokens using the Four.meme factory contract  
- **Auto-Buy Execution** — Simultaneous buy transactions from all generated wallets  
- **Balance Tracking** — Retrieve and log both BNB and token balances  
- **Exported Data** — Automatically save wallet and transaction data in JSON format  
- **Configuration Management** — Centralized config with environment-specific settings
- **Error Handling** — Exponential backoff retry with circuit breaker patterns
- **Monitoring System** — Real-time tracking with multi-channel notifications
- **Gas Optimization** — Intelligent gas estimation and dynamic pricing

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16.x or higher
- **npm** v8.x or higher
- **RPC Access** (QuickNode, Infura, or Alchemy)
- **BloXroute Account** with API credentials
- **Funded Wallet** on BNB Smart Chain

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bnb-sniper-bundler-volume-bot.git
cd bnb-sniper-bundler-volume-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### Configuration

Edit your `.env` file with your specific settings:

```bash
# Required Settings
PRIVATE_KEY=your_private_key_here
BLOXROUTE_AUTH_HEADER=your_bloxroute_auth_header_here
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Optional Settings
TOKEN_NAME=MyOptimizedToken
TOKEN_SYMBOL=MOT
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Running the Bot

```bash
# Start the optimized bot
npm start

# Or run in development mode
npm run dev

# Compile contracts
npm run compile

# Run tests
npm test
```

## ▶️ Usage (Legacy)

```bash
node bundler.js
```

This command will:

1. Generate wallets (`wallet_details.json`)  
2. Distribute BNB to sub-wallets  
3. Deploy a new token  
4. Execute buy transactions  
5. Save all transaction data to `token_details.json`  

## 🪙 Contract Information

| Parameter | Value |
|------------|--------|
| **Network** | Binance Smart Chain (Mainnet or Testnet) |
| **Factory Contract** | 0x5c952063c7fc8610FFDB798152D69F0B9550762b |
| **Launch Cost** | ~0.005 BNB |
| **Liquidity Threshold** | Auto-liquidity at 24 BNB |
| **Explorer** | https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b |

## 📁 Example Output Files

**wallet_details.json**
```json
[
  {
    "index": 0,
    "address": "0xabc123...",
    "privateKey": "0xdef456..."
  }
]
```

**token_details.json**
```json
{
  "address": "0x987654...",
  "name": "TestMeme",
  "symbol": "TME",
  "supply": "1000000",
  "transactions": [
    { "hash": "0x123...", "blockNumber": 38192612 }
  ]
}
```

## ⚙️ Configuration Options

### Network Settings
```bash
NETWORK=bsc                    # Network: bsc, bscTestnet, hardhat
BSC_RPC_URL=your_rpc_url      # BSC RPC endpoint
```

### Token Configuration
```bash
TOKEN_NAME=OptimizedToken      # Token name
TOKEN_SYMBOL=OPT              # Token symbol
TOKEN_SUPPLY=1000000         # Initial supply
```

### Trading Parameters
```bash
POOL_FEE=100                 # Pool fee (100 = 0.01%)
SLIPPAGE_TOLERANCE=0.5       # Slippage tolerance (%)
SWAP_AMOUNT_IN=0.0000001     # Swap amount in BNB
```

### Monitoring & Alerts
```bash
ENABLE_TELEGRAM=true         # Enable Telegram notifications
TELEGRAM_BOT_TOKEN=token    # Telegram bot token
TELEGRAM_CHAT_ID=chat_id    # Telegram chat ID

ENABLE_DISCORD=true         # Enable Discord notifications
DISCORD_WEBHOOK_URL=url     # Discord webhook URL
```

## 🔧 Advanced Features

### Gas Optimization
- **Dynamic gas pricing** based on network conditions
- **Intelligent gas estimation** with buffer management
- **Gas price limits** to prevent overpaying
- **Historical gas analysis** for optimization

### Error Handling
- **Exponential backoff** retry mechanism
- **Circuit breaker** pattern for fault tolerance
- **Comprehensive error classification**
- **Automatic recovery** from transient failures

### Monitoring & Analytics
- **Real-time transaction tracking**
- **Performance metrics** (success rate, gas usage, etc.)
- **Multi-channel notifications**
- **Structured logging** with JSON format
- **Health monitoring** and alerting

### Security Features
- **Input validation** and sanitization
- **Transaction limits** and safety checks
- **Private key protection**
- **Emergency pause** functionality
- **Rate limiting** and abuse prevention

## ⚠️ Security Guidelines

- 🔐 Never commit `.env` files containing private keys or API credentials  
- 🧩 Use **separate wallets** for testing and production  
- 🧠 Audit transactions carefully before deploying on mainnet  
- 🧪 Test thoroughly on **forked networks** before live execution  
- ⛽ Monitor gas fees to avoid unnecessary spending  
- ⚔️ Understand and mitigate **MEV risks** when using atomic bundles  
- 🛡️ Enable **input validation** and **circuit breakers**
- 📊 Monitor **real-time metrics** and set up **alerts**

## 🧬 Workflow Summary
The bot executes the following operations **in one atomic bundle** via bloXroute:

1. Deploy optimized ERC20 token with security features
2. Approve token for NFPM (Non-Fungible Position Manager)  
3. Approve WBNB for NFPM  
4. Create a liquidity pool on PancakeSwap V3  
5. Initialize the pool with the starting price  
6. Add liquidity  
7. Execute buy transactions  
8. Transfer fees and complete monitoring

All steps are bundled atomically to ensure consistency, front-run protection, and efficient execution with comprehensive error handling and monitoring.

## 🛠️ Development

### Project Structure
```
├── contracts/           # Smart contracts
│   └── OptimizedToken.sol
├── config/             # Configuration management
│   └── config.js
├── utils/              # Utility modules
│   ├── logger.js       # Logging & monitoring
│   └── errorHandler.js # Error handling & retry
├── optimized-bundler.js # Main bot logic
├── .env.example       # Environment template
└── package.json        # Dependencies & scripts
```

### Development Setup

```bash
git clone https://github.com/your-username/bnb-sniper-bundler-volume-bot.git
cd bnb-sniper-bundler-volume-bot
npm install
cp .env.example .env
npm start
```

### Testing

```bash
# Run unit tests
npm test

# Test on BSC testnet
NETWORK=bscTestnet npm start

# Test locally with Hardhat fork
npm run fork
```

## 🚨 Troubleshooting

### Common Issues

**1. Transaction Failures**
```bash
# Check gas price
# Verify wallet balance
# Ensure nonce is correct
# Check network congestion
```

**2. BloXroute Errors**
```bash
# Verify API credentials
# Check rate limits
# Ensure proper formatting
# Monitor API status
```

**3. Configuration Issues**
```bash
# Validate environment variables
# Check network settings
# Verify contract addresses
# Test RPC connectivity
```

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Checks

Monitor bot health:
```bash
# Check logs
tail -f logs/$(date +%Y-%m-%d).log

# Monitor metrics
curl http://localhost:3000/health
```

## 🪄 Future Enhancements
- Integrate AI-based strategy optimization  
- Support for cross-chain deployment (ETH, Base, Arbitrum)  
- Advanced PnL and analytics dashboard
- Machine learning for gas price prediction
- Automated strategy backtesting

## 📚 API Reference

### Configuration API
```javascript
const config = new Config();
config.getNetworkConfig();
config.getTradingConfig();
config.updateGasMultiplier(1.5);
```

### Logger API
```javascript
const logger = new Logger(config);
logger.info('Message', data);
logger.error('Error', errorData, true); // with notification
```

### Monitor API
```javascript
const monitor = new TransactionMonitor(config, logger);
monitor.startMonitoring(txHash, txData);
monitor.updateTransactionStatus(txHash, 'success', receipt);
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

### Code Standards
- **ESLint** configuration included
- **JSDoc** comments required
- **Error handling** mandatory
- **Logging** for all operations

## 📄 License
This project is licensed under the MIT License — open for development, customization, and research purposes.

## ⚠️ Disclaimer
This software is provided for educational and research purposes only. Use at your own risk. The maintainers assume no responsibility for financial losses or regulatory implications.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-username/bnb-sniper-bundler-volume-bot/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/bnb-sniper-bundler-volume-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/bnb-sniper-bundler-volume-bot/discussions)

## 📊 Performance Metrics

### Transaction Links (Legacy Bot)
- https://bscscan.com/tx/0x581cda788080b52fbd5db8c4d3500c22a6c136a07b73e2311d1fc29330d48fe5
- https://bscscan.com/tx/0x8c870cf1721c2c765b45d2b13731bf384ec2e8020552aafb0436c01ded98f2ab
- https://bscscan.com/tx/0xb46d289c48d04dc6cc74849ecd9ef4fff6bf86aa3b16fc231d019b82c7789bc2

### Future Roadmap
- Randomizing trading amount
- Randomizing trading frequency (Buy/Sell)
- Randomizing the pool
- AI-powered strategy optimization
- Cross-chain deployment support

---

**Built with ❤️ for the DeFi community**

*Optimized for performance. Secured for production. Monitored for reliability.*
