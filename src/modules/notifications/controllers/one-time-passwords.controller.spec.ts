import { Test, TestingModule } from '@nestjs/testing';
import { OneTimePasswordsController } from './one-time-passwords.controller';

describe('OneTimePasswordsController', () => {
  let controller: OneTimePasswordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OneTimePasswordsController],
    }).compile();

    controller = module.get<OneTimePasswordsController>(OneTimePasswordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
