import { CalmApiError } from '../../../errors/CalmApiError';
import { CALM_API_ERROR_CODES } from '../../../errors/codes';

describe('CalmApiError', () => {
  test('fromOData carries status, service code, and message', () => {
    const err = CalmApiError.fromOData(400, {
      code: 'INVALID_INPUT',
      message: "Field 'title' is required",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CalmApiError);
    expect(err.code).toBe(CALM_API_ERROR_CODES.ODATA_ERROR);
    expect(err.status).toBe(400);
    expect(err.serviceCode).toBe('INVALID_INPUT');
    expect(err.message).toContain('INVALID_INPUT');
    expect(err.message).toContain("Field 'title' is required");
  });

  test('fromHttp truncates long bodies', () => {
    const body = 'x'.repeat(500);
    const err = CalmApiError.fromHttp(404, body);
    expect(err.code).toBe(CALM_API_ERROR_CODES.HTTP_ERROR);
    expect(err.status).toBe(404);
    expect(err.message.length).toBeLessThan(250);
  });

  test('fromJsonParse preserves cause', () => {
    const cause = new SyntaxError('unexpected token');
    const err = CalmApiError.fromJsonParse(cause, '{broken');
    expect(err.code).toBe(CALM_API_ERROR_CODES.JSON_PARSE);
    expect((err as Error & { cause?: unknown }).cause).toBe(cause);
  });

  test('fromNetwork carries cause and default message', () => {
    const cause = new Error('ECONNREFUSED');
    const err = CalmApiError.fromNetwork(cause);
    expect(err.code).toBe(CALM_API_ERROR_CODES.NETWORK);
    expect(err.message).toBe('Network request failed');
    expect((err as Error & { cause?: unknown }).cause).toBe(cause);
  });

  test('name is CalmApiError for instanceof/toString checks', () => {
    const err = CalmApiError.fromHttp(500, 'boom');
    expect(err.name).toBe('CalmApiError');
    expect(String(err)).toContain('CalmApiError');
  });
});
