import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { SentryExceptionFilter } from './sentry-exception.filter';
import * as Sentry from '@sentry/nestjs';

// Mock Sentry
jest.mock('@sentry/nestjs');

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    filter = new SentryExceptionFilter();

    mockRequest = {
      url: '/test-url',
      method: 'POST',
      ip: '127.0.0.1',
      body: { test: 'data' },
      query: { param: 'value' },
      params: { id: '123' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with 400 status (client error)', () => {
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test-url',
        message: 'Bad Request',
      });
    });

    it('should report HttpException with 500 status to Sentry', () => {
      const exception = new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);

      filter.catch(exception, mockArgumentsHost);

      expect(Sentry.captureException).toHaveBeenCalledWith(exception, {
        tags: {
          path: '/test-url',
          method: 'POST',
        },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/test-url',
        message: 'Internal Server Error',
      });
    });

    it('should report non-HttpException to Sentry', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockArgumentsHost);

      expect(Sentry.captureException).toHaveBeenCalledWith(exception, {
        tags: {
          path: '/test-url',
          method: 'POST',
        },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/test-url',
        message: 'Internal server error',
      });
    });

    it('should handle HttpException with object message', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['Field is required'] },
        HttpStatus.UNPROCESSABLE_ENTITY
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 422,
        timestamp: expect.any(String),
        path: '/test-url',
        message: 'Validation failed',
      });
    });

    it('should not report 404 errors to Sentry', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});