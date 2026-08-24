import { OrganizationPresenter } from './organization.presenter';
import { makeOrganization } from '../../../../tests/tenancy-test-factory';

describe('OrganizationPresenter', () => {
  it('expõe platformStoreId quando presente (necessário para provisionar o Emitente fiscal)', () => {
    const storeId = '018f6c2a-0000-7000-8000-000000000abc';
    const organization = makeOrganization({ platformStoreId: storeId });

    const http = OrganizationPresenter.toHttp(organization);

    expect(http).toHaveProperty('platformStoreId', storeId);
  });

  it('expõe platformStoreId como null quando a organização não foi provisionada pela plataforma', () => {
    const organization = makeOrganization({ platformStoreId: null });

    const http = OrganizationPresenter.toHttp(organization);

    expect(http.platformStoreId).toBeNull();
  });

  it('toHttpSingle envelopa em { data } preservando platformStoreId', () => {
    const storeId = '018f6c2a-0000-7000-8000-000000000def';
    const organization = makeOrganization({ platformStoreId: storeId });

    const { data } = OrganizationPresenter.toHttpSingle(organization);

    expect(data.platformStoreId).toBe(storeId);
  });
});
