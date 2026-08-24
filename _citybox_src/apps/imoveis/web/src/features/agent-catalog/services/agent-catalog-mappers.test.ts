import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPublicListingsQuery,
  mapPublicAgentToAgent,
  mapPublicListingToCatalogListing,
  publicListingsPath,
  toNextAgentPhotoProxy,
  toNextPropertyPhotoProxy,
} from './agent-catalog-mappers';

describe('agent-catalog-mappers', () => {
  it('maps public agent with photo proxy', () => {
    const agent = mapPublicAgentToAgent({
      slug: 'ana-helena',
      name: 'Ana Helena',
      headline: 'Corretora',
      email: 'ana@example.com',
      phone: '(73) 99999-0000',
      region: 'Ilhéus, BA',
      creci: 'CRECI 123',
      initials: 'AH',
      accentColorId: 'blue',
      photoUrl: '/v1/public/stores/store/agents/ana-helena/photo',
    });

    assert.equal(agent.slug, 'ana-helena');
    assert.equal(agent.photoUrl, toNextAgentPhotoProxy('ana-helena'));
    assert.equal(agent.city, 'Ilhéus');
    assert.equal(agent.state, 'BA');
    assert.equal(agent.bio, '');
    assert.equal(agent.accentColorId, 'blue');
    assert.equal(agent.whatsappCatalogEnabled, true);
    assert.equal(agent.leadFormCatalogEnabled, true);
  });

  it('leaves accent undefined when an older API omits it', () => {
    const agent = mapPublicAgentToAgent({
      slug: 'ana-helena',
      name: 'Ana Helena',
      headline: 'Corretora',
      email: 'ana@example.com',
      phone: '(73) 99999-0000',
      region: 'Ilhéus, BA',
      creci: 'CRECI 123',
      initials: 'AH',
    });

    assert.equal(agent.accentColorId, undefined);
  });

  it('respects whatsappCatalogEnabled false from API', () => {
    const agent = mapPublicAgentToAgent({
      slug: 'ana-helena',
      name: 'Ana Helena',
      headline: 'Corretora',
      email: 'ana@example.com',
      phone: '(73) 99999-0000',
      region: 'Ilhéus, BA',
      creci: 'CRECI 123',
      initials: 'AH',
      whatsappCatalogEnabled: false,
    });
    assert.equal(agent.whatsappCatalogEnabled, false);
  });

  it('respects leadFormCatalogEnabled false from API', () => {
    const agent = mapPublicAgentToAgent({
      slug: 'ana-helena',
      name: 'Ana Helena',
      headline: 'Corretora',
      email: 'ana@example.com',
      phone: '(73) 99999-0000',
      region: 'Ilhéus, BA',
      creci: 'CRECI 123',
      initials: 'AH',
      leadFormCatalogEnabled: false,
    });
    assert.equal(agent.leadFormCatalogEnabled, false);
  });

  it('maps listing with empty description when API omits text', () => {
    const listing = mapPublicListingToCatalogListing({
      id: 'prop-2',
      title: 'Casa Centro',
      purpose: 'sale',
      type: 'house',
      price: 300000,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 1,
      area: 90,
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    });

    assert.equal(listing.description, '');
  });

  it('maps listing cover photo to Next proxy path', () => {
    const listing = mapPublicListingToCatalogListing({
      id: 'prop-1',
      title: 'Apartamento Centro',
      purpose: 'sale',
      type: 'apartment',
      price: 500000,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 1,
      area: 70,
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
      coverPhotoUrl: '/v1/public/stores/store/listings/prop-1/photos/photo-1',
    });

    assert.equal(
      listing.coverPhotoUrl,
      toNextPropertyPhotoProxy(
        '/v1/public/stores/store/listings/prop-1/photos/photo-1',
        'prop-1',
      ),
    );
  });

  it('maps listing photoUrls gallery to Next proxy paths', () => {
    const listing = mapPublicListingToCatalogListing({
      id: 'prop-1',
      title: 'Apartamento Centro',
      purpose: 'sale',
      type: 'apartment',
      price: 500000,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 1,
      area: 70,
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
      photoUrls: [
        '/v1/public/stores/store/listings/prop-1/photos/photo-1',
        '/v1/public/stores/store/listings/prop-1/photos/photo-2',
      ],
    });

    assert.equal(listing.photoUrls?.length, 2);
    assert.equal(
      listing.photoUrls?.[0],
      '/api/public/properties/prop-1/photos/photo-1',
    );
    assert.equal(listing.coverPhotoUrl, listing.photoUrls?.[0]);
  });

  it('maps mapCoordinate on listing detail', () => {
    const listing = mapPublicListingToCatalogListing({
      id: 'prop-1',
      title: 'Casa Praia',
      purpose: 'sale',
      type: 'house',
      price: 500000,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 1,
      area: 70,
      neighborhood: 'Praia',
      city: 'Ilhéus',
      state: 'BA',
      mapCoordinate: '-14.8142, -39.0340',
    });
    assert.equal(listing.mapCoordinate, '-14.8142, -39.0340');
  });

  it('builds listings query with filters', () => {
    const q = buildPublicListingsQuery({
      page: 2,
      perPage: 12,
      search: 'centro',
      purpose: 'rent',
      type: 'apartment',
    });

    assert.equal(q.get('page'), '2');
    assert.equal(q.get('perPage'), '12');
    assert.equal(q.get('search'), 'centro');
    assert.equal(q.get('purpose'), 'rent');
    assert.equal(q.get('type'), 'apartment');
  });

  it('omits all-purpose and all-type from query', () => {
    const q = buildPublicListingsQuery({
      purpose: 'all',
      type: 'all',
    });

    assert.equal(q.has('purpose'), false);
    assert.equal(q.has('type'), false);
  });

  it('builds public listings path', () => {
    const path = publicListingsPath('ana-helena', {
      page: 1,
      search: 'praia',
    });

    assert.match(path, /^\/v1\/public\/agents\/ana-helena\/listings\?/);
    assert.match(path, /page=1/);
    assert.match(path, /search=praia/);
  });
});
