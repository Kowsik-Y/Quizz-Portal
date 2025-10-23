export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
}

export interface ErrorResponse {
  title: string;
  message: string;
  action: 'retry' | 'login' | 'dismiss' | 'contact';
  canRetry: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const ERROR_MESSAGES: Record<string, ErrorResponse> = {
  NETWORK_ERROR: {
    title: 'No Internet Connection',
    message: 'Please check your network and try again.',
    action: 'retry',
    canRetry: true,
    severity: 'high'
  },
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please login again.',
    action: 'login',
    canRetry: false,
    severity: 'critical'
  },
  FORBIDDEN: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'dismiss',
    canRetry: false,
    severity: 'medium'
  },
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested item was not found.',
    action: 'dismiss',
    canRetry: false,
    severity: 'low'
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'retry',
    canRetry: true,
    severity: 'high'
  },
  TIMEOUT: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    action: 'retry',
    canRetry: true,
    severity: 'medium'
  },
  VALIDATION_ERROR: {
    title: 'Invalid Data',
    message: 'Please check your input and try again.',
    action: 'dismiss',
    canRetry: false,
    severity: 'low'
  },
  DUPLICATE_ERROR: {
    title: 'Duplicate Entry',
    message: 'This item already exists.',
    action: 'dismiss',
    canRetry: false,
    severity: 'low'
  }
};

export const handleApiError = (error: any): ErrorResponse => {
  // Network errors
  if (!error.response && error.message === 'Network Error') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // HTTP status code errors
  if (error.response) {
    const statusCode = error.response.status;
    
    switch (statusCode) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 408:
        return ERROR_MESSAGES.TIMEOUT;
      case 422:
        return {
          ...ERROR_MESSAGES.VALIDATION_ERROR,
          message: error.response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR.message
        };
      case 409:
        return {
          ...ERROR_MESSAGES.DUPLICATE_ERROR,
          message: error.response.data?.message || ERROR_MESSAGES.DUPLICATE_ERROR.message
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return {
          title: 'Error',
          message: error.response.data?.message || 'An unexpected error occurred.',
          action: 'retry',
          canRetry: true,
          severity: 'medium'
        };
    }
  }

  // Custom error codes
  const errorCode = error.code || 'UNKNOWN';
  return ERROR_MESSAGES[errorCode] || {
    title: 'Unexpected Error',
    message: error.message || 'Something went wrong. Please try again.',
    action: 'retry',
    canRetry: true,
    severity: 'medium'
  };
};

export const getErrorIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
    default:
      return '❌';
  }
};

export const logError = (error: any, context?: string) => {
  if (__DEV__) {
    console.error(`[ERROR]${context ? ` ${context}:` : ''}`, error);
  }
  
  // In production, send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error, { tags: { context } });
};
