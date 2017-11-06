export interface RetryOptions {
    max: number;
    logError: boolean;
    timeout: string;
    timeoutInterval: number;
}
export interface TimeoutFunc {
    (i: number): number;
}
export interface TimeoutFactory {
    [index: string]: TimeoutFunc;
}
declare function Retry({max, logError, timeout, timeoutInterval}: RetryOptions): any;
export default Retry;
