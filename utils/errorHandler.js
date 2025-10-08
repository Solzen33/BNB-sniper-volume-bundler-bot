/**
 * @file Advanced error handling and retry mechanisms for EVM BNB Sniper Bundler Volume Bot
 * @description Comprehensive error handling with exponential backoff and circuit breaker patterns
 */

const { ethers } = require('ethers');

class RetryConfig {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000; // 1 second
        this.maxDelay = options.maxDelay || 30000; // 30 seconds
        this.exponentialBase = options.exponentialBase || 2;
        this.jitter = options.jitter || 0.1; // 10% jitter
        this.retryableErrors = options.retryableErrors || [
            'NETWORK_ERROR',
            'TIMEOUT',
            'RATE_LIMITED',
            'SERVER_ERROR',
            'GAS_ESTIMATION_FAILED'
        ];
    }

    calculateDelay(attempt) {
        const exponentialDelay = this.baseDelay * Math.pow(this.exponentialBase, attempt - 1);
        const delay = Math.min(exponentialDelay, this.maxDelay);
        
        // Add jitter to prevent thundering herd
        const jitterAmount = delay * this.jitter * Math.random();
        return Math.floor(delay + jitterAmount);
    }
}

class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
        this.monitoringPeriod = options.monitoringPeriod || 300000; // 5 minutes
        
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failures = [];
    }

    canExecute() {
        const now = Date.now();
        
        switch (this.state) {
            case 'CLOSED':
                return true;
                
            case 'OPEN':
                if (now - this.lastFailureTime >= this.recoveryTimeout) {
                    this.state = 'HALF_OPEN';
                    return true;
                }
                return false;
                
            case 'HALF_OPEN':
                return true;
                
            default:
                return false;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        this.failures = [];
    }

    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.failures.push({
            timestamp: this.lastFailureTime,
            error: error.message || 'Unknown error'
        });

        // Keep only recent failures
        const cutoff = this.lastFailureTime - this.monitoringPeriod;
        this.failures = this.failures.filter(f => f.timestamp > cutoff);

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
        }
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            recentFailures: this.failures.length
        };
    }
}

class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.errorTypes = {
            NETWORK_ERROR: 'Network connectivity issues',
            TIMEOUT: 'Request timeout',
            RATE_LIMITED: 'Rate limit exceeded',
            SERVER_ERROR: 'Server-side error',
            GAS_ESTIMATION_FAILED: 'Gas estimation failed',
            INSUFFICIENT_FUNDS: 'Insufficient funds',
            TRANSACTION_REVERTED: 'Transaction reverted',
            NONCE_TOO_LOW: 'Nonce too low',
            GAS_PRICE_TOO_LOW: 'Gas price too low',
            CONTRACT_ERROR: 'Smart contract error',
            VALIDATION_ERROR: 'Input validation error',
            CONFIGURATION_ERROR: 'Configuration error'
        };
    }

    classifyError(error) {
        const message = error.message?.toLowerCase() || '';
        const code = error.code;

        // Network errors
        if (code === 'NETWORK_ERROR' || message.includes('network') || message.includes('connection')) {
            return 'NETWORK_ERROR';
        }

        // Timeout errors
        if (code === 'TIMEOUT' || message.includes('timeout')) {
            return 'TIMEOUT';
        }

        // Rate limiting
        if (code === 'RATE_LIMITED' || message.includes('rate limit') || message.includes('too many requests')) {
            return 'RATE_LIMITED';
        }

        // Server errors
        if (code >= 500 || message.includes('server error') || message.includes('internal error')) {
            return 'SERVER_ERROR';
        }

        // Gas estimation errors
        if (message.includes('gas estimation') || message.includes('cannot estimate gas')) {
            return 'GAS_ESTIMATION_FAILED';
        }

        // Insufficient funds
        if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
            return 'INSUFFICIENT_FUNDS';
        }

        // Transaction reverted
        if (message.includes('revert') || message.includes('execution reverted')) {
            return 'TRANSACTION_REVERTED';
        }

        // Nonce errors
        if (message.includes('nonce too low') || message.includes('nonce')) {
            return 'NONCE_TOO_LOW';
        }

        // Gas price errors
        if (message.includes('gas price too low') || message.includes('gas price')) {
            return 'GAS_PRICE_TOO_LOW';
        }

        // Contract errors
        if (message.includes('contract') || message.includes('call exception')) {
            return 'CONTRACT_ERROR';
        }

        // Validation errors
        if (message.includes('invalid') || message.includes('validation')) {
            return 'VALIDATION_ERROR';
        }

        return 'UNKNOWN_ERROR';
    }

    isRetryable(errorType) {
        const retryableTypes = [
            'NETWORK_ERROR',
            'TIMEOUT',
            'RATE_LIMITED',
            'SERVER_ERROR',
            'GAS_ESTIMATION_FAILED',
            'NONCE_TOO_LOW',
            'GAS_PRICE_TOO_LOW'
        ];
        return retryableTypes.includes(errorType);
    }

    async handleError(error, context = {}) {
        const errorType = this.classifyError(error);
        const errorInfo = {
            type: errorType,
            message: error.message,
            code: error.code,
            context,
            timestamp: new Date().toISOString()
        };

        this.logger.error(`Error occurred: ${errorType}`, errorInfo);

        return {
            errorType,
            isRetryable: this.isRetryable(errorType),
            errorInfo,
            description: this.errorTypes[errorType] || 'Unknown error type'
        };
    }
}

class RetryManager {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.retryConfig = new RetryConfig(config.retry);
        this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
        this.errorHandler = new ErrorHandler(logger);
    }

    async executeWithRetry(operation, context = {}) {
        if (!this.circuitBreaker.canExecute()) {
            throw new Error('Circuit breaker is OPEN - operation not allowed');
        }

        let lastError;
        
        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                this.logger.debug(`Executing operation (attempt ${attempt}/${this.retryConfig.maxRetries})`, context);
                
                const result = await operation();
                
                // Success - reset circuit breaker
                this.circuitBreaker.onSuccess();
                this.logger.info(`Operation succeeded on attempt ${attempt}`, context);
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                const errorAnalysis = await this.errorHandler.handleError(error, {
                    ...context,
                    attempt,
                    maxRetries: this.retryConfig.maxRetries
                });

                // Update circuit breaker
                this.circuitBreaker.onFailure(error);

                // If not retryable, fail immediately
                if (!errorAnalysis.isRetryable) {
                    this.logger.error(`Non-retryable error occurred`, errorAnalysis);
                    throw error;
                }

                // If this was the last attempt, fail
                if (attempt === this.retryConfig.maxRetries) {
                    this.logger.error(`Operation failed after ${attempt} attempts`, errorAnalysis);
                    throw error;
                }

                // Calculate delay and wait
                const delay = this.retryConfig.calculateDelay(attempt);
                this.logger.warn(`Operation failed (attempt ${attempt}), retrying in ${delay}ms`, {
                    errorType: errorAnalysis.errorType,
                    delay,
                    nextAttempt: attempt + 1
                });

                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    async executeWithCircuitBreaker(operation, context = {}) {
        if (!this.circuitBreaker.canExecute()) {
            const state = this.circuitBreaker.getState();
            throw new Error(`Circuit breaker is ${state.state} - operation not allowed`);
        }

        try {
            const result = await operation();
            this.circuitBreaker.onSuccess();
            return result;
        } catch (error) {
            this.circuitBreaker.onFailure(error);
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCircuitBreakerState() {
        return this.circuitBreaker.getState();
    }

    resetCircuitBreaker() {
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = [];
        this.logger.info('Circuit breaker reset');
    }
}

class TransactionRetryManager extends RetryManager {
    constructor(logger, config = {}) {
        super(logger, {
            retry: {
                maxRetries: config.maxRetries || 5,
                baseDelay: config.baseDelay || 2000,
                maxDelay: config.maxDelay || 60000,
                exponentialBase: config.exponentialBase || 2,
                jitter: config.jitter || 0.2
            },
            circuitBreaker: {
                failureThreshold: config.failureThreshold || 3,
                recoveryTimeout: config.recoveryTimeout || 120000,
                monitoringPeriod: config.monitoringPeriod || 600000
            }
        });
    }

    async executeTransaction(transactionFunction, context = {}) {
        return this.executeWithRetry(async () => {
            return await transactionFunction();
        }, {
            ...context,
            operation: 'transaction_execution'
        });
    }

    async executeBundle(bundleFunction, context = {}) {
        return this.executeWithRetry(async () => {
            return await bundleFunction();
        }, {
            ...context,
            operation: 'bundle_execution'
        });
    }
}

module.exports = {
    RetryConfig,
    CircuitBreaker,
    ErrorHandler,
    RetryManager,
    TransactionRetryManager
};
