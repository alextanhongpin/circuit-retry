export interface RetryOptions {
    maxRetry?: number;
    timeout?: string;
    timeoutInterval?: string;
}
export declare function delay(duration: number): Promise<any>;
export default function Retry(options: RetryOptions): any;
