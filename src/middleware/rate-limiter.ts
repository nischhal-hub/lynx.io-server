import { Request, Response, NextFunction } from 'express';

interface LeakyBucketOptions {
  capacity: number;
  leakRate: number;
}

class LeakyBucket {
  private capacity: number;
  private leakRate: number;
  private tokens: number = 0;
  private lastCheck: number = Date.now();

  constructor(options: LeakyBucketOptions) {
    this.capacity = options.capacity;
    this.leakRate = options.leakRate;
  }

  allowRequest(): boolean {
    const now = Date.now();
    const leaked = (now - this.lastCheck) * this.leakRate;
    this.tokens = Math.max(0, this.tokens - leaked);
    this.lastCheck = now;

    if (this.tokens < this.capacity) {
      this.tokens += 1;
      return true;
    } else {
      return false;
    }
  }
}

export function leakyBucketMiddleware(options: LeakyBucketOptions) {
  const bucketMap: Map<string, LeakyBucket> = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    if (!bucketMap.has(ip)) {
      bucketMap.set(ip, new LeakyBucket(options));
    }

    const bucket = bucketMap.get(ip)!;

    if (bucket.allowRequest()) {
      next();
    } else {
      res
        .status(429)
        .json({ message: 'Too many requests, please try again later.' });
    }
  };
}
