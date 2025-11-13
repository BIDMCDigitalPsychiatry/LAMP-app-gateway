import { Test, TestingModule } from '@nestjs/testing';
import { OtpStorageService } from './otp-storage.service';
import dynamoOtpConfig from '../../config/dynamo-otp.config';
import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

jest.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = jest.fn();
  return {
    DynamoDBClient: jest.fn(() => ({
      send: mockSend,
    })),
    GetItemCommand: jest.fn(),
    PutItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
  };
});

describe('OtpStorageService', () => {
  let service: OtpStorageService;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpStorageService,
        {
          provide: dynamoOtpConfig.KEY,
          useValue: {
            region: 'us-east-2',
            table: 'test-otp-table',
          },
        },
      ],
    }).compile();

    service = module.get<OtpStorageService>(OtpStorageService);
    mockSend = (service as any).client.send;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should save OTP to DynamoDB with PutItemCommand', async () => {
      const identifier = 'test@example.com';
      const hash = 'test-hash-value';
      const exp = Date.now() + 15 * 60 * 1000;

      mockSend.mockResolvedValue({});

      await service.save(identifier, hash, exp);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutItemCommand));
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetch', () => {
    it('should return hash when valid OTP exists', async () => {
      const identifier = 'test@example.com';
      const hash = 'test-hash-value';
      const futureExp = Math.floor((Date.now() + 10 * 60 * 1000) / 1000);

      mockSend.mockResolvedValue({
        Item: {
          Identifier: { S: identifier },
          Hash: { S: hash },
          ExpiresAt: { N: futureExp.toString() },
        },
      });

      const result = await service.fetch(identifier);

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetItemCommand));
      expect(result).toBe(hash);
    });

    it('should return undefined when OTP does not exist', async () => {
      const identifier = 'nonexistent@example.com';

      mockSend.mockResolvedValue({});

      const result = await service.fetch(identifier);

      expect(result).toBeUndefined();
    });

    it('should return undefined when OTP is expired', async () => {
      const identifier = 'test@example.com';
      const hash = 'test-hash-value';
      const pastExp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000);

      mockSend.mockResolvedValue({
        Item: {
          Identifier: { S: identifier },
          Hash: { S: hash },
          ExpiresAt: { N: pastExp.toString() },
        },
      });

      const result = await service.fetch(identifier);

      expect(result).toBeUndefined();
    });

    it('should return undefined when Item exists but Hash is missing', async () => {
      const identifier = 'test@example.com';
      const futureExp = Math.floor((Date.now() + 10 * 60 * 1000) / 1000);

      mockSend.mockResolvedValue({
        Item: {
          Identifier: { S: identifier },
          ExpiresAt: { N: futureExp.toString() },
        },
      });

      const result = await service.fetch(identifier);

      expect(result).toBeUndefined();
    });

    it('should return undefined when Item exists but ExpiresAt is missing', async () => {
      const identifier = 'test@example.com';
      const hash = 'test-hash-value';

      mockSend.mockResolvedValue({
        Item: {
          Identifier: { S: identifier },
          Hash: { S: hash },
        },
      });

      const result = await service.fetch(identifier);

      expect(result).toBeUndefined();
    });
  });

  describe('removeAllFor', () => {
    it('should delete OTP from DynamoDB with DeleteItemCommand', async () => {
      const identifier = '+12345678901';

      mockSend.mockResolvedValue({});

      await service.removeAllFor(identifier);

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
