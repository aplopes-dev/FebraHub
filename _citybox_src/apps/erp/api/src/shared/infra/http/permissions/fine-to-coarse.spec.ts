import {
  resolveCoarseFromFine,
  SYSTEM_PERMISSION_PROFILES,
  SYSTEM_PROFILE_FINANCEIRO,
} from './fine-to-coarse';

describe('resolveCoarseFromFine', () => {
  describe('permissão de leitura não concede escrita (SEC-1)', () => {
    it('estoque.*.view concede apenas org.view', () => {
      const coarse = resolveCoarseFromFine(['estoque.inventarios.view']);

      expect(coarse.has('org.view')).toBe(true);
      expect(coarse.has('store.stock.manage')).toBe(false);
    });

    it('vale para todos os módulos, não só estoque', () => {
      const cases: Array<[string, string]> = [
        ['produtos.produtos.view', 'store.catalog.manage'],
        ['vendas.pedidos.view', 'store.sales.manage'],
        ['financas.lancamentos.view', 'store.finance.manage'],
        ['clientes.clientes.view', 'org.customers.manage'],
        ['estoque.fornecedores.view', 'org.suppliers.manage'],
      ];

      for (const [fine, forbiddenCoarse] of cases) {
        const coarse = resolveCoarseFromFine([fine]);
        expect(coarse.has('org.view')).toBe(true);
        expect(coarse.has(forbiddenCoarse)).toBe(false);
      }
    });
  });

  describe('permissões de escrita continuam concedendo a capability', () => {
    it.each(['create', 'update', 'delete'])(
      'estoque.inventarios.%s concede store.stock.manage',
      (action) => {
        const coarse = resolveCoarseFromFine([`estoque.inventarios.${action}`]);
        expect(coarse.has('store.stock.manage')).toBe(true);
      },
    );

    it('a regra mais específica ganha: fornecedores não vira store.stock.manage', () => {
      const coarse = resolveCoarseFromFine(['estoque.fornecedores.create']);

      expect(coarse.has('org.suppliers.manage')).toBe(true);
      expect(coarse.has('store.stock.manage')).toBe(false);
    });
  });

  describe('perfil de sistema Financeiro (caso concreto do achado)', () => {
    const financeiro = SYSTEM_PERMISSION_PROFILES.find(
      (seed) => seed.systemKey === SYSTEM_PROFILE_FINANCEIRO,
    );

    it('existe no seed', () => {
      expect(financeiro).toBeDefined();
    });

    it('não concede escrita de estoque', () => {
      const coarse = resolveCoarseFromFine(financeiro!.permissionIds);

      expect(coarse.has('store.stock.manage')).toBe(false);
      expect(coarse.has('store.catalog.manage')).toBe(false);
      expect(coarse.has('store.sales.manage')).toBe(false);
    });

    it('mantém o que o perfil realmente precisa', () => {
      const coarse = resolveCoarseFromFine(financeiro!.permissionIds);

      expect(coarse.has('store.finance.manage')).toBe(true);
      expect(coarse.has('org.view')).toBe(true);
    });
  });
});
