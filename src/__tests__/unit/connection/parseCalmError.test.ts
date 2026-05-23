import { calmErrorFromBody } from '../../../connection/parseCalmError';
import { CalmApiError } from '../../../errors/CalmApiError';

describe('calmErrorFromBody', () => {
  it('maps an OData error envelope to a CalmApiError(ODATA_ERROR)', () => {
    const body = { error: { code: 'SY/530', message: 'boom' } };
    const err = calmErrorFromBody(400, body);
    expect(err).toBeInstanceOf(CalmApiError);
    expect(err.code).toBe('ODATA_ERROR');
    expect(err.status).toBe(400);
    expect(err.serviceCode).toBe('SY/530');
  });

  it('maps a plain string body to a CalmApiError(HTTP_ERROR)', () => {
    const err = calmErrorFromBody(404, 'Not Found');
    expect(err.code).toBe('HTTP_ERROR');
    expect(err.status).toBe(404);
    expect(err.message).toContain('404');
  });

  it('stringifies a non-OData object body for HTTP_ERROR', () => {
    const err = calmErrorFromBody(500, { message: 'x', status: 500 });
    expect(err.code).toBe('HTTP_ERROR');
    expect(err.status).toBe(500);
  });
});
