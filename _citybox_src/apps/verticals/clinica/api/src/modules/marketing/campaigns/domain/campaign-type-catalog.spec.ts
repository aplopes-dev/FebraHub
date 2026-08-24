import {
  assertValidSegmentTypePair,
  defaultChannelForStrategy,
  defaultChannelForType,
  getCatalogEntry,
  listCampaignTypes,
  listCampaignTypesGroupedBySegment,
  resolveStrategy,
} from './campaign-type-catalog';
import { CampaignInvalidSegmentTypeError } from './errors/campaign-invalid-segment-type.error';

describe('campaign-type-catalog', () => {
  it('lists exactly 6 product types', () => {
    expect(listCampaignTypes()).toHaveLength(6);
  });

  it('covers all three segments with the expected types', () => {
    const grouped = listCampaignTypesGroupedBySegment();
    expect(grouped.map((g) => g.segment)).toEqual([
      'captacao_leads',
      'operacional_atendimento',
      'relacionamento_pos_venda',
    ]);
    expect(grouped[0].types.map((t) => t.type)).toEqual(['form_lead', 'mgm']);
    expect(grouped[1].types.map((t) => t.type)).toEqual([
      'debito_atraso',
      'retorno_tratamento',
    ]);
    expect(grouped[2].types.map((t) => t.type)).toEqual(['aniversario', 'nps']);
  });

  it('derives strategy from type', () => {
    expect(resolveStrategy('form_lead')).toBe('PAGE');
    expect(resolveStrategy('mgm')).toBe('BROADCAST');
    expect(resolveStrategy('debito_atraso')).toBe('BROADCAST');
    expect(resolveStrategy('retorno_tratamento')).toBe('BROADCAST');
    expect(resolveStrategy('aniversario')).toBe('BROADCAST');
    expect(resolveStrategy('nps')).toBe('AUTOMATION');
  });

  it('marks form_lead and aniversario as implemented', () => {
    const implemented = listCampaignTypes()
      .filter((item) => item.implemented)
      .map((item) => item.type);
    expect(implemented).toEqual(['form_lead', 'aniversario']);
  });

  it('returns default channel per type and strategy', () => {
    expect(defaultChannelForType('form_lead')).toBe('web');
    expect(defaultChannelForType('nps')).toBe('whatsapp');
    expect(defaultChannelForStrategy('PAGE')).toBe('web');
    expect(defaultChannelForStrategy('BROADCAST')).toBe('whatsapp');
    expect(defaultChannelForStrategy('AUTOMATION')).toBe('whatsapp');
  });

  it('accepts valid segment/type pairs', () => {
    const entry = assertValidSegmentTypePair('captacao_leads', 'form_lead');
    expect(entry.type).toBe('form_lead');
    expect(getCatalogEntry('form_lead')).toEqual(entry);
  });

  it('rejects mismatched segment/type pairs', () => {
    expect(() =>
      assertValidSegmentTypePair('operacional_atendimento', 'form_lead'),
    ).toThrow(CampaignInvalidSegmentTypeError);

    expect(() =>
      assertValidSegmentTypePair('captacao_leads', 'nps'),
    ).toThrow(CampaignInvalidSegmentTypeError);
  });
});
