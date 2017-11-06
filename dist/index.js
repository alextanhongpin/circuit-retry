"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorMaxRetryExceeded = new Error('max retry exceeded');
function Timeout(type, interval) {
    const timeoutType = {
        exponential: (i) => (Math.pow(2, i) + 1) * interval,
        linear: (i) => (i + 1) * interval,
        constant: () => interval
    };
    return timeoutType[type] ? timeoutType[type] : timeoutType['constant'];
}
function Retry({ max = 3, logError = false, timeout = 'exponential', timeoutInterval = 300 }) {
    let tries = 0;
    const timeoutType = Timeout(timeout, timeoutInterval);
    const _do = (p, opts) => {
        return p(opts)
            .then((result) => {
            tries = 0;
            return result;
        })
            .catch((error) => {
            tries += 1;
            if (logError) {
                console.log(`tries=${tries} retrying=${opts} error=${error.message}`);
            }
            if (tries > max) {
                return Promise.reject(errorMaxRetryExceeded);
            }
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(_do(p, opts));
                }, timeoutType(tries));
            });
        });
    };
    return {
        do: _do
    };
}
exports.default = Retry;
//# sourceMappingURL=index.js.map