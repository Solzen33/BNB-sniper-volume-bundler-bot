/**
 * @file Configuration management for EVM BNB Sniper Bundler Volume Bot
 * @description Centralized configuration with environment-specific settings
 */

const { ethers } = require('ethers');

class Config {
    constructor() {
        this.loadEnvironmentConfig();
        this.validateConfig();
    }

    loadEnvironmentConfig() {
        // Network Configuration
        this.networks = {
            bsc: {
                chainId: 56,
                name: 'BSC Mainnet',
                rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
                explorerUrl: 'https://bscscan.com',
                gasMultiplier: 1.2,
                maxGasPrice: ethers.parseUnits('50', 'gwei'), // Max 50 gwei
                minGasPrice: ethers.parseUnits('5', 'gwei'),  // Min 5 gwei
            },
            bscTestnet: {
                chainId: 97,
                name: 'BSC Testnet',
                rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
                explorerUrl: 'https://testnet.bscscan.com',
                gasMultiplier: 1.1,
                maxGasPrice: ethers.parseUnits('20', 'gwei'),
                minGasPrice: ethers.parseUnits('1', 'gwei'),
            },
            hardhat: {
                chainId: 31337,
                name: 'Hardhat Local',
                rpcUrl: 'http://localhost:8545',
                explorerUrl: 'http://localhost:8545',
                gasMultiplier: 1.0,
                maxGasPrice: ethers.parseUnits('100', 'gwei'),
                minGasPrice: ethers.parseUnits('1', 'gwei'),
            }
        };

        // Contract Addresses
        this.addresses = {
            bsc: {
                wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                nfpm: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
                v3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
                v3Router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
                feeRecipient: '0x74c5F8C6ffe41AD4789602BDB9a48E6Cad623520',
            },
            bscTestnet: {
                wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
                nfpm: '0x427bF5b37357632377eCbEC9de3626C71A539e10',
                v3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
                v3Router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
                feeRecipient: '0x74c5F8C6ffe41AD4789602BDB9a48E6Cad623520',
            }
        };

        // Trading Configuration
        this.trading = {
            // Token Configuration
            token: {
                name: process.env.TOKEN_NAME || 'OptimizedToken',
                symbol: process.env.TOKEN_SYMBOL || 'OPT',
                initialSupply: process.env.TOKEN_SUPPLY || '1000000', // 1M tokens
                decimals: 18,
            },
            
            // Pool Configuration
            pool: {
                fee: parseInt(process.env.POOL_FEE || '100'), // 0.01%
                priceRatio: {
                    token0: process.env.PRICE_RATIO_TOKEN0 || '1',
                    token1: process.env.PRICE_RATIO_TOKEN1 || '1',
                },
                liquidity: {
                    tokenAmount: process.env.LIQUIDITY_TOKEN_AMOUNT || '0.00001',
                    wbnbAmount: process.env.LIQUIDITY_WBNB_AMOUNT || '0.00001',
                }
            },

            // Trading Configuration
            swap: {
                amountIn: process.env.SWAP_AMOUNT_IN || '0.0000001',
                slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.5'), // 0.5%
                deadline: parseInt(process.env.SWAP_DEADLINE || '600'), // 10 minutes
            },

            // Fee Configuration
            fees: {
                transferFee: process.env.TRANSFER_FEE || '0.003', // 0.003 BNB
                maxFeePercentage: parseFloat(process.env.MAX_FEE_PERCENTAGE || '5.0'), // 5%
            }
        };

        // BloXroute Configuration
        this.bloxroute = {
            apiEndpoint: process.env.BLOXROUTE_API_ENDPOINT || 'https://api.blxrbdn.com',
            authorizationHeader: process.env.BLOXROUTE_AUTH_HEADER,
            maxRetries: parseInt(process.env.BLOXROUTE_MAX_RETRIES || '3'),
            retryDelay: parseInt(process.env.BLOXROUTE_RETRY_DELAY || '5000'), // 5 seconds
            timeout: parseInt(process.env.BLOXROUTE_TIMEOUT || '30000'), // 30 seconds
        };

        // Security Configuration
        this.security = {
            privateKey: process.env.PRIVATE_KEY,
            maxGasLimit: parseInt(process.env.MAX_GAS_LIMIT || '10000000'),
            maxTransactionValue: process.env.MAX_TRANSACTION_VALUE || '1.0', // 1 BNB max
            enablePause: process.env.ENABLE_PAUSE === 'true',
            requireConfirmation: process.env.REQUIRE_CONFIRMATION === 'true',
        };

        // Monitoring Configuration
        this.monitoring = {
            enableLogging: process.env.ENABLE_LOGGING !== 'false',
            logLevel: process.env.LOG_LEVEL || 'info',
            enableTelegram: process.env.ENABLE_TELEGRAM === 'true',
            telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
            telegramChatId: process.env.TELEGRAM_CHAT_ID,
            enableDiscord: process.env.ENABLE_DISCORD === 'true',
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
        };

        // Performance Configuration
        this.performance = {
            maxConcurrentTransactions: parseInt(process.env.MAX_CONCURRENT_TXS || '5'),
            transactionTimeout: parseInt(process.env.TX_TIMEOUT || '300000'), // 5 minutes
            gasEstimationBuffer: parseInt(process.env.GAS_ESTIMATION_BUFFER || '50000'),
            enableGasOptimization: process.env.ENABLE_GAS_OPTIMIZATION !== 'false',
        };

        // Current Network
        this.currentNetwork = process.env.NETWORK || 'bsc';
    }

    validateConfig() {
        const requiredEnvVars = [
            'PRIVATE_KEY',
            'BLOXROUTE_AUTH_HEADER'
        ];

        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        if (!this.networks[this.currentNetwork]) {
            throw new Error(`Unsupported network: ${this.currentNetwork}`);
        }

        if (!this.addresses[this.currentNetwork]) {
            throw new Error(`No addresses configured for network: ${this.currentNetwork}`);
        }

        // Validate private key format
        try {
            new ethers.Wallet(this.security.privateKey);
        } catch (error) {
            throw new Error('Invalid private key format');
        }

        // Validate numeric values
        if (this.trading.pool.fee < 100 || this.trading.pool.fee > 10000) {
            throw new Error('Pool fee must be between 100 (0.01%) and 10000 (1%)');
        }

        if (this.trading.swap.slippageTolerance < 0.1 || this.trading.swap.slippageTolerance > 50) {
            throw new Error('Slippage tolerance must be between 0.1% and 50%');
        }
    }

    getNetworkConfig() {
        return this.networks[this.currentNetwork];
    }

    getAddresses() {
        return this.addresses[this.currentNetwork];
    }

    getTradingConfig() {
        return this.trading;
    }

    getBloxrouteConfig() {
        return this.bloxroute;
    }

    getSecurityConfig() {
        return this.security;
    }

    getMonitoringConfig() {
        return this.monitoring;
    }

    getPerformanceConfig() {
        return this.performance;
    }

    // Helper methods
    getWbnbAddress() {
        return this.getAddresses().wbnb;
    }

    getNfpmAddress() {
        return this.getAddresses().nfpm;
    }

    getV3FactoryAddress() {
        return this.getAddresses().v3Factory;
    }

    getV3RouterAddress() {
        return this.getAddresses().v3Router;
    }

    getFeeRecipientAddress() {
        return this.getAddresses().feeRecipient;
    }

    isMainnet() {
        return this.currentNetwork === 'bsc';
    }

    isTestnet() {
        return this.currentNetwork === 'bscTestnet';
    }

    isLocal() {
        return this.currentNetwork === 'hardhat';
    }

    // Dynamic configuration updates
    updateGasMultiplier(multiplier) {
        if (multiplier >= 1.0 && multiplier <= 3.0) {
            this.networks[this.currentNetwork].gasMultiplier = multiplier;
        }
    }

    updateSlippageTolerance(slippage) {
        if (slippage >= 0.1 && slippage <= 50) {
            this.trading.swap.slippageTolerance = slippage;
        }
    }

    // Configuration export for debugging
    exportConfig() {
        return {
            network: this.currentNetwork,
            networkConfig: this.getNetworkConfig(),
            addresses: this.getAddresses(),
            trading: this.getTradingConfig(),
            security: {
                ...this.getSecurityConfig(),
                privateKey: '***REDACTED***'
            },
            monitoring: this.getMonitoringConfig(),
            performance: this.getPerformanceConfig()
        };
    }
}

module.exports = Config;
