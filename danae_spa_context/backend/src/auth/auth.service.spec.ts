import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return a demo access token containing the email', async () => {
      const email = 'test@example.com';
      const result = await service.login({ email });

      expect(result.access_token).toBe(`demo-token:${email}`);
      expect(result.expires_in).toBe(3600);
      expect(result.refresh_token).toBeDefined();
    });
  });
});
