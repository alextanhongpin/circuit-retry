export interface RetryOptions {
    maxRetry?: number;
    enableLogging?: boolean;
    verbose?: boolean;
    timeout?: string;
    timeoutInterval?: string;
}
export interface TimeoutFunc {
    (i: number): number;
}
export interface TimeoutFactory {
    [index: string]: TimeoutFunc;
}
export declare function delay(duration: number): Promise<any>;
export default function Retry(options: RetryOptions): any;
