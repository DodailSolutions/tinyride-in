import { validateEnv } from './env.config';

describe('validateEnv', () => {
  const validConfig = {
    NODE_ENV: 'test',
    PORT: '3000',
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key-that-is-at-least-20-chars-long',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-that-is-at-least-20-chars-long',
  };

  it('should successfully validate valid environment config', () => {
    const result = validateEnv(validConfig);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('test');
    expect(result.SUPABASE_URL).toBe('https://test-project.supabase.co');
    expect(result.API_PREFIX).toBe('api/v1');
    expect(result.CORS_ORIGINS).toBe('*');
  });

  it('should throw an error if SUPABASE_URL is not a valid URL', () => {
    expect(() => {
      validateEnv({ ...validConfig, SUPABASE_URL: 'invalid-url' });
    }).toThrow(/Invalid environment configuration/);
  });

  it('should throw an error if SUPABASE_SERVICE_ROLE_KEY is missing or too short', () => {
    expect(() => {
      validateEnv({ ...validConfig, SUPABASE_SERVICE_ROLE_KEY: 'short' });
    }).toThrow(/Invalid environment configuration/);
  });
});
