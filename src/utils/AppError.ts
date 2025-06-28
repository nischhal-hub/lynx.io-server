class AppError extends Error {
  statusCode: number;
  status: 'fail' | 'error';
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Maintains proper stack trace for where the error was thrown (only in V8)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
