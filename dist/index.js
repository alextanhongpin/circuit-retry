"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorMaxRetryExceeded = new Error('max retry exceeded');
const ms = require("ms");
function Timeout(type, interval) {
    if (interval <= 0) {
        console.error('Interval cannot be less than zero. Defaults to 300ms.');
        interval = 300;
    }
    const timeoutType = {
        exponential: (i) => (Math.pow(2, i) + 1) * interval,
        linear: (i) => (i + 1) * 2 * interval,
        constant: () => interval
    };
    if (!timeoutType[type]) {
        console.error('Timeout can only be either exponential, linear, or constant. Defaults to constant.');
        return timeoutType['constant'];
    }
    return timeoutType[type];
}
function delay(duration) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, duration));
    });
}
exports.delay = delay;
class CircuitRetry {
    constructor({ maxRetry = 3, enableLogging = false, timeout = 'exponential', timeoutInterval = '300ms', verbose = false }) {
        this.counter = 0;
        if (maxRetry < 0) {
            console.error('maxRetry must be greater than or equal 0. Defaults to 0.');
            maxRetry = 0;
        }
        this.maxRetry = maxRetry;
        this.enableLogging = enableLogging;
        this.verbose = verbose;
        this.timeout = Timeout(timeout, ms(timeoutInterval));
    }
    reset() {
        this.counter = 0;
    }
    increment() {
        this.counter += 1;
    }
    get thresholdExceeded() {
        return this.counter > this.maxRetry;
    }
    get duration() {
        return this.timeout(this.counter);
    }
    retry(promise, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const done = yield promise(opts);
                this.reset();
                return done;
            }
            catch (error) {
                this.increment();
                if (this.enableLogging && this.verbose) {
                    console.error(error);
                }
                else if (this.enableLogging) {
                    console.log(`count=${this.counter} error=${error.message}`);
                }
                if (this.thresholdExceeded) {
                    return errorMaxRetryExceeded;
                }
                yield delay(this.duration);
                return this.retry(promise, opts);
            }
        });
    }
    do(promise, opts) {
        return this.retry(promise, opts);
    }
    extrapolate({ type = 'exponential', interval = '300ms', times = 10 }) {
        if (times <= 0) {
            console.error('times must be more than 0');
            times = 10;
        }
        const timeout = Timeout(type, ms(interval));
        return Array(times).fill(0).map((_, i) => [i + 1, ms(timeout(i))]);
    }
    get count() {
        return this.counter;
    }
}
function Retry(options) {
    return new CircuitRetry(options);
}
exports.default = Retry;
//# sourceMappingURL=index.js.map