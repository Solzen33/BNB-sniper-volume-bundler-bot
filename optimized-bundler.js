/**
 * @file Optimized EVM BNB Sniper Bundler Volume Bot
 * @description High-performance trading bot with advanced bundling, gas optimization, and monitoring
 */

require('dotenv').config();

const { ethers } = require('ethers');
const { Token, Percent } = require('@uniswap/sdk-core');
const { abi: UniswapV3FactoryABI } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');
const { encodeSqrtRatioX96, Pool, Position, NonfungiblePositionManager, nearestUsableTick } = require('@uniswap/v3-sdk');
const axios = require('axios');

// Import our optimized modules
const Config = require('./config/config');
const { Logger, TransactionMonitor, GasOptimizer } = require('./utils/logger');
const { TransactionRetryManager } = require('./utils/errorHandler');

class OptimizedBundlerBot {
    constructor() {
        this.config = new Config();
        this.logger = new Logger(this.config);
        this.monitor = new TransactionMonitor(this.config, this.logger);
        this.gasOptimizer = new GasOptimizer(this.config, this.logger);
        this.retryManager = new TransactionRetryManager(this.logger, {
            maxRetries: this.config.bloxroute.maxRetries,
            baseDelay: this.config.bloxroute.retryDelay,
            maxDelay: this.config.bloxroute.timeout
        });

        this.setupProvider();
        this.setupWallet();
        this.setupContracts();
        
        this.logger.info('Optimized Bundler Bot initialized', {
            network: this.config.currentNetwork,
            wallet: this.wallet.address
        });
    }

    setupProvider() {
        const networkConfig = this.config.getNetworkConfig();
        this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        this.logger.info('Provider configured', { rpcUrl: networkConfig.rpcUrl });
    }

    setupWallet() {
        const privateKey = this.config.security.privateKey;
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.logger.info('Wallet configured', { address: this.wallet.address });
    }

    setupContracts() {
        const addresses = this.config.getAddresses();
        
        this.contracts = {
            nfpm: new ethers.Contract(addresses.nfpm, [
                "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
                "function createAndInitializePoolIfNecessary(address token0,address token1,uint24 fee,uint160 sqrtPriceX96) external payable override returns (address pool)"
            ], this.wallet),
            
            v3Factory: new ethers.Contract(addresses.v3Factory, UniswapV3FactoryABI, this.wallet),
            
            v3Router: new ethers.Contract(addresses.v3Router, [
                {
                    "inputs": [{
                        "components": [
                            { "name": "tokenIn", "type": "address" },
                            { "name": "tokenOut", "type": "address" },
                            { "name": "fee", "type": "uint24" },
                            { "name": "recipient", "type": "address" },
                            { "name": "deadline", "type": "uint256" },
                            { "name": "amountIn", "type": "uint256" },
                            { "name": "amountOutMinimum", "type": "uint256" },
                            { "name": "sqrtPriceLimitX96", "type": "uint160" }
                        ],
                        "name": "params",
                        "type": "tuple"
                    }],
                    "name": "exactInputSingle",
                    "outputs": [{ "name": "amountOut", "type": "uint256" }],
                    "stateMutability": "payable",
                    "type": "function"
                }
            ], this.wallet)
        };

        this.logger.info('Contracts configured', {
            nfpm: addresses.nfpm,
            v3Factory: addresses.v3Factory,
            v3Router: addresses.v3Router
        });
    }

    async getOptimalGasPrice() {
        return this.gasOptimizer.estimateOptimalGasPrice(this.provider);
    }

    async getCurrentNonce() {
        return this.provider.getTransactionCount(this.wallet.address, 'pending');
    }

    async getFutureBlockNumber() {
        const currentBlock = await this.provider.getBlockNumber();
        return currentBlock + 5; // Target 5 blocks ahead
    }

    async createDeploymentTransaction(deployParams, nonce, gasPrice) {
        const factory = await ethers.getContractFactory("OptimizedToken");
        const deployTx = await factory.getDeployTransaction(...deployParams);
        
        const gasLimit = await this.gasOptimizer.estimateGasLimit(this.provider, {
            data: deployTx.data,
            from: this.wallet.address
        });

        const transaction = {
            to: null,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            data: deployTx.data,
            value: 0,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async createApproveTransaction(tokenAddress, spenderAddress, nonce, gasPrice) {
        const tokenContract = new ethers.Contract(tokenAddress, [
            "function approve(address spender, uint256 amount) returns (bool)"
        ], this.wallet);

        const maxAmount = ethers.MaxUint256;
        const txData = tokenContract.interface.encodeFunctionData("approve", [spenderAddress, maxAmount]);

        const transaction = {
            to: tokenAddress,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 100000,
            data: txData,
            value: 0,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async createPoolTransaction(token0, token1, fee, price, nonce, gasPrice) {
        const txData = this.contracts.nfpm.interface.encodeFunctionData("createAndInitializePoolIfNecessary", [
            token0.toLowerCase(),
            token1.toLowerCase(),
            fee,
            price
        ]);

        const transaction = {
            to: this.config.getAddresses().nfpm,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 5000000,
            data: txData,
            value: 0,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async createLiquidityTransaction(token0, token1, amount0, amount1, fee, sqrtPriceX96, nonce, gasPrice) {
        const Token1 = new Token(this.config.getNetworkConfig().chainId, token0, 18);
        const Token2 = new Token(this.config.getNetworkConfig().chainId, token1, 18);

        const configuredPool = new Pool(
            Token1,
            Token2,
            fee,
            sqrtPriceX96.toString(),
            "0",
            0
        );

        const position = Position.fromAmounts({
            pool: configuredPool,
            tickLower: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing * 2,
            tickUpper: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing * 2,
            amount0: amount0.toString(),
            amount1: amount1.toString(),
            useFullPrecision: false,
        });

        const mintOptions = {
            recipient: this.wallet.address,
            deadline: Math.floor(Date.now() / 1000) + this.config.trading.swap.deadline,
            slippageTolerance: new Percent(Math.floor(this.config.trading.swap.slippageTolerance * 100), 10_000),
        };

        const { calldata } = NonfungiblePositionManager.addCallParameters(position, mintOptions);

        const transaction = {
            to: this.config.getAddresses().nfpm,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 800000,
            data: calldata,
            value: 0,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async createSwapTransaction(amountIn, wbnb, token, fee, nonce, gasPrice) {
        const params = {
            tokenIn: wbnb,
            tokenOut: token,
            fee: fee,
            recipient: this.wallet.address,
            deadline: Math.floor(Date.now() / 1000) + this.config.trading.swap.deadline,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        };

        const txData = this.contracts.v3Router.interface.encodeFunctionData("exactInputSingle", [params]);

        const transaction = {
            to: this.config.getAddresses().v3Router,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 400000,
            data: txData,
            value: 0,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async createTransferTransaction(nonce, gasPrice) {
        const transaction = {
            to: this.config.getAddresses().feeRecipient,
            value: ethers.parseEther(this.config.trading.fees.transferFee),
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 21000,
            chainId: this.config.getNetworkConfig().chainId
        };

        const rawTx = await this.wallet.signTransaction(transaction);
        return rawTx.startsWith("0x") ? rawTx.slice(2) : rawTx;
    }

    async simulateBundle(transactions, blockNumber) {
        const payload = {
            id: "1",
            method: "blxr_simulate_bundle",
            params: {
                transaction: transactions,
                block_number: '0x' + blockNumber.toString(16),
                blockchain_network: this.config.isMainnet() ? "BSC-Mainnet" : "BSC-Testnet"
            }
        };

        const response = await axios.post(this.config.bloxroute.apiEndpoint, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.config.bloxroute.authorizationHeader
            },
            timeout: this.config.bloxroute.timeout
        });

        return response.data;
    }

    async submitBundle(transactions, blockNumber) {
        const payload = {
            id: "1",
            method: "blxr_submit_bundle",
            params: {
                transaction: transactions,
                blockchain_network: this.config.isMainnet() ? "BSC-Mainnet" : "BSC-Testnet",
                block_number: '0x' + blockNumber.toString(16),
                mev_builders: {
                    all: ""
                }
            }
        };

        const response = await axios.post(this.config.bloxroute.apiEndpoint, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": this.config.bloxroute.authorizationHeader
            },
            timeout: this.config.bloxroute.timeout
        });

        return response.data;
    }

    async executeBundle() {
        return this.retryManager.executeBundle(async () => {
            const tradingConfig = this.config.getTradingConfig();
            const gasPrice = await this.getOptimalGasPrice();
            let nonce = await this.getCurrentNonce();
            const futureBlockNumber = await this.getFutureBlockNumber();

            this.logger.info('Starting bundle execution', {
                gasPrice: gasPrice.toString(),
                nonce,
                futureBlock: futureBlockNumber
            });

            // 1. Deploy token
            const deployParams = [
                tradingConfig.token.name,
                tradingConfig.token.symbol,
                ethers.parseUnits(tradingConfig.token.initialSupply, tradingConfig.token.decimals),
                this.wallet.address
            ];

            const rawTx0 = await this.createDeploymentTransaction(deployParams, nonce, gasPrice);
            const tokenAddress = ethers.getCreateAddress({
                from: this.wallet.address,
                nonce: nonce
            });

            this.logger.info('Token deployment prepared', { tokenAddress });

            // 2. Approve WBNB to NFPM
            nonce++;
            const rawApprove0 = await this.createApproveTransaction(
                this.config.getWbnbAddress(),
                this.config.getNfpmAddress(),
                nonce,
                gasPrice
            );

            // 3. Approve token to NFPM
            nonce++;
            const rawApprove1 = await this.createApproveTransaction(
                tokenAddress,
                this.config.getNfpmAddress(),
                nonce,
                gasPrice
            );

            // 4. Create and initialize pool
            const [token0, token1] = [this.config.getWbnbAddress().toLowerCase(), tokenAddress.toLowerCase()].sort();
            const price = encodeSqrtRatioX96(
                tradingConfig.pool.priceRatio.token1,
                tradingConfig.pool.priceRatio.token0
            );

            nonce++;
            const rawCreatePool = await this.createPoolTransaction(token0, token1, tradingConfig.pool.fee, price.toString(), nonce, gasPrice);

            // 5. Add liquidity
            let amount0, amount1;
            if (token0 === this.config.getWbnbAddress().toLowerCase()) {
                amount0 = ethers.parseUnits(tradingConfig.pool.liquidity.wbnbAmount, 18);
                amount1 = ethers.parseUnits(tradingConfig.pool.liquidity.tokenAmount, 18);
            } else {
                amount1 = ethers.parseUnits(tradingConfig.pool.liquidity.wbnbAmount, 18);
                amount0 = ethers.parseUnits(tradingConfig.pool.liquidity.tokenAmount, 18);
            }

            nonce++;
            const rawAddLiquidity = await this.createLiquidityTransaction(
                token0, token1, amount0.toString(), amount1.toString(),
                tradingConfig.pool.fee, price.toString(), nonce, gasPrice
            );

            // 6. Approve WBNB to router
            nonce++;
            const buyApprovalRaw = await this.createApproveTransaction(
                this.config.getWbnbAddress(),
                this.config.getV3RouterAddress(),
                nonce,
                gasPrice
            );

            // 7. Execute buy transaction
            nonce++;
            const amountIn = ethers.parseEther(tradingConfig.swap.amountIn);
            const rawBuyTx = await this.createSwapTransaction(
                amountIn, this.config.getWbnbAddress(), tokenAddress,
                tradingConfig.pool.fee, nonce, gasPrice
            );

            // 8. Transfer fee
            nonce++;
            const rawTransferTx = await this.createTransferTransaction(nonce, gasPrice);

            const transactions = [
                rawTx0, rawApprove0, rawApprove1, rawCreatePool,
                rawAddLiquidity, buyApprovalRaw, rawBuyTx, rawTransferTx
            ];

            this.logger.info('Bundle transactions prepared', {
                transactionCount: transactions.length,
                tokenAddress,
                poolAddress: `${token0}/${token1}`
            });

            // Simulate bundle
            const simulationResult = await this.simulateBundle(transactions, futureBlockNumber);
            this.logger.info('Bundle simulation completed', simulationResult);

            // Submit bundle
            const submissionResult = await this.submitBundle(transactions, futureBlockNumber);
            this.logger.info('Bundle submitted successfully', submissionResult);

            return {
                tokenAddress,
                transactions,
                simulationResult,
                submissionResult
            };
        }, {
            operation: 'bundle_execution',
            gasPrice: gasPrice?.toString(),
            nonce
        });
    }

    async run() {
        try {
            this.logger.info('Starting Optimized Bundler Bot', this.config.exportConfig());
            
            const result = await this.executeBundle();
            
            this.logger.info('Bundle execution completed successfully', result, true);
            
            // Generate monitoring report
            const report = await this.monitor.generateReport();
            this.logger.info('Monitoring report generated', report);
            
        } catch (error) {
            this.logger.error('Bundle execution failed', { error: error.message }, true);
            throw error;
        }
    }
}

// Main execution
async function main() {
    try {
        const bot = new OptimizedBundlerBot();
        await bot.run();
    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = OptimizedBundlerBot;
