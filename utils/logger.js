/**
 * @file Advanced logging and monitoring system for EVM BNB Sniper Bundler Volume Bot
 * @description Comprehensive logging with multiple outputs and real-time monitoring
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class Logger {
    constructor(config) {
        this.config = config;
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };
        this.currentLevel = this.logLevels[config.monitoring.logLevel] || this.logLevels.info;
        this.logDir = path.join(process.cwd(), 'logs');
        this.setupLogDirectory();
    }

    async setupLogDirectory() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error.message);
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            data: data || {}
        };

        return logEntry;
    }

    async writeToFile(level, message, data) {
        if (!this.config.monitoring.enableLogging) return;

        try {
            const logEntry = this.formatMessage(level, message, data);
            const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
            
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    async sendTelegramNotification(message, data = null) {
        if (!this.config.monitoring.enableTelegram || !this.config.monitoring.telegramBotToken) return;

        try {
            const text = `🤖 *EVM Bot Alert*\n\n${message}`;
            if (data) {
                text += `\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
            }

            await axios.post(`https://api.telegram.org/bot${this.config.monitoring.telegramBotToken}/sendMessage`, {
                chat_id: this.config.monitoring.telegramChatId,
                text,
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error('Failed to send Telegram notification:', error.message);
        }
    }

    async sendDiscordNotification(message, data = null) {
        if (!this.config.monitoring.enableDiscord || !this.config.monitoring.discordWebhookUrl) return;

        try {
            const embed = {
                title: '🤖 EVM Bot Alert',
                description: message,
                color: 0x00ff00,
                timestamp: new Date().toISOString(),
                fields: []
            };

            if (data) {
                Object.entries(data).forEach(([key, value]) => {
                    embed.fields.push({
                        name: key,
                        value: String(value),
                        inline: true
                    });
                });
            }

            await axios.post(this.config.monitoring.discordWebhookUrl, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('Failed to send Discord notification:', error.message);
        }
    }

    async log(level, message, data = null, sendNotification = false) {
        if (this.logLevels[level] > this.currentLevel) return;

        const formattedMessage = this.formatMessage(level, message, data);
        
        // Console output
        console.log(`[${formattedMessage.timestamp}] ${formattedMessage.level}: ${formattedMessage.message}`);
        if (data) {
            console.log('Data:', data);
        }

        // File logging
        await this.writeToFile(level, message, data);

        // External notifications
        if (sendNotification) {
            await Promise.all([
                this.sendTelegramNotification(message, data),
                this.sendDiscordNotification(message, data)
            ]);
        }
    }

    error(message, data = null, sendNotification = true) {
        return this.log('error', message, data, sendNotification);
    }

    warn(message, data = null, sendNotification = false) {
        return this.log('warn', message, data, sendNotification);
    }

    info(message, data = null, sendNotification = false) {
        return this.log('info', message, data, sendNotification);
    }

    debug(message, data = null, sendNotification = false) {
        return this.log('debug', message, data, sendNotification);
    }

    trace(message, data = null, sendNotification = false) {
        return this.log('trace', message, data, sendNotification);
    }
}

class TransactionMonitor {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.pendingTransactions = new Map();
        this.completedTransactions = new Map();
        this.failedTransactions = new Map();
        this.metrics = {
            totalTransactions: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            totalGasUsed: 0,
            totalFeesPaid: 0,
            averageGasPrice: 0,
            startTime: Date.now()
        };
    }

    startMonitoring(txHash, txData) {
        this.pendingTransactions.set(txHash, {
            ...txData,
            startTime: Date.now(),
            status: 'pending'
        });
        
        this.metrics.totalTransactions++;
        this.logger.info(`Transaction started monitoring: ${txHash}`, txData);
    }

    async updateTransactionStatus(txHash, status, receipt = null, error = null) {
        const txData = this.pendingTransactions.get(txHash);
        if (!txData) return;

        const endTime = Date.now();
        const duration = endTime - txData.startTime;

        const updatedTxData = {
            ...txData,
            status,
            endTime,
            duration,
            receipt,
            error
        };

        if (status === 'success' && receipt) {
            this.completedTransactions.set(txHash, updatedTxData);
            this.metrics.successfulTransactions++;
            this.metrics.totalGasUsed += Number(receipt.gasUsed);
            this.metrics.totalFeesPaid += Number(receipt.gasUsed) * Number(receipt.effectiveGasPrice);
            
            this.logger.info(`Transaction successful: ${txHash}`, {
                gasUsed: receipt.gasUsed,
                gasPrice: receipt.effectiveGasPrice,
                duration: `${duration}ms`
            });
        } else if (status === 'failed') {
            this.failedTransactions.set(txHash, updatedTxData);
            this.metrics.failedTransactions++;
            
            this.logger.error(`Transaction failed: ${txHash}`, {
                error: error?.message || 'Unknown error',
                duration: `${duration}ms`
            }, true);
        }

        this.pendingTransactions.delete(txHash);
        this.updateMetrics();
    }

    updateMetrics() {
        if (this.metrics.successfulTransactions > 0) {
            this.metrics.averageGasPrice = this.metrics.totalFeesPaid / this.metrics.totalGasUsed;
        }
    }

    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        return {
            ...this.metrics,
            uptime: `${Math.floor(uptime / 1000)}s`,
            successRate: this.metrics.totalTransactions > 0 
                ? (this.metrics.successfulTransactions / this.metrics.totalTransactions * 100).toFixed(2) + '%'
                : '0%',
            averageTransactionTime: this.completedTransactions.size > 0
                ? Array.from(this.completedTransactions.values())
                    .reduce((sum, tx) => sum + tx.duration, 0) / this.completedTransactions.size
                : 0
        };
    }

    async generateReport() {
        const metrics = this.getMetrics();
        const report = {
            timestamp: new Date().toISOString(),
            metrics,
            recentTransactions: Array.from(this.completedTransactions.values()).slice(-10),
            recentFailures: Array.from(this.failedTransactions.values()).slice(-5)
        };

        this.logger.info('Transaction monitoring report generated', report);
        return report;
    }
}

class GasOptimizer {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.gasHistory = [];
        this.maxHistorySize = 100;
    }

    async estimateOptimalGasPrice(provider) {
        try {
            const feeData = await provider.getFeeData();
            const networkConfig = this.config.getNetworkConfig();
            
            let gasPrice = feeData.gasPrice;
            
            // Apply gas multiplier
            gasPrice = gasPrice * BigInt(Math.floor(networkConfig.gasMultiplier * 100)) / 100n;
            
            // Ensure within bounds
            const minGasPrice = networkConfig.minGasPrice;
            const maxGasPrice = networkConfig.maxGasPrice;
            
            if (gasPrice < minGasPrice) {
                gasPrice = minGasPrice;
            } else if (gasPrice > maxGasPrice) {
                gasPrice = maxGasPrice;
            }

            // Store in history for analysis
            this.gasHistory.push({
                timestamp: Date.now(),
                gasPrice: gasPrice.toString(),
                baseFee: feeData.gasPrice?.toString() || '0'
            });

            // Keep only recent history
            if (this.gasHistory.length > this.maxHistorySize) {
                this.gasHistory = this.gasHistory.slice(-this.maxHistorySize);
            }

            this.logger.debug('Gas price estimated', {
                gasPrice: gasPrice.toString(),
                baseFee: feeData.gasPrice?.toString() || '0',
                multiplier: networkConfig.gasMultiplier
            });

            return gasPrice;
        } catch (error) {
            this.logger.error('Failed to estimate gas price', { error: error.message });
            throw error;
        }
    }

    async estimateGasLimit(provider, transaction) {
        try {
            const estimatedGas = await provider.estimateGas(transaction);
            const buffer = BigInt(this.config.performance.gasEstimationBuffer);
            const gasLimit = estimatedGas + buffer;

            this.logger.debug('Gas limit estimated', {
                estimated: estimatedGas.toString(),
                buffer: buffer.toString(),
                final: gasLimit.toString()
            });

            return gasLimit;
        } catch (error) {
            this.logger.error('Failed to estimate gas limit', { 
                error: error.message,
                transaction: {
                    to: transaction.to,
                    data: transaction.data?.substring(0, 20) + '...'
                }
            });
            throw error;
        }
    }

    getGasHistory() {
        return this.gasHistory;
    }

    getAverageGasPrice() {
        if (this.gasHistory.length === 0) return '0';
        
        const sum = this.gasHistory.reduce((acc, entry) => acc + BigInt(entry.gasPrice), 0n);
        return (sum / BigInt(this.gasHistory.length)).toString();
    }
}

module.exports = { Logger, TransactionMonitor, GasOptimizer };
