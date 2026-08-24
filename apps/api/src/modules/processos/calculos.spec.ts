import { calcularProgresso } from './calculos';
describe('progresso da implantação', () => {
  it('pondera os três pilares sem aceitar percentual geral manual', () => {
    expect(calcularProgresso([
      { pilar: 'sistema', peso: 1, situacao: 'concluido', percentualAceito: 0 },
      { pilar: 'automacao', peso: 1, situacao: 'em_andamento', percentualAceito: 40 },
      { pilar: 'agentes_ia', peso: 1, situacao: 'nao_iniciado', percentualAceito: 0 },
    ]).geral).toBe(70);
  });
  it('remove entregas canceladas do denominador', () => {
    expect(calcularProgresso([
      { pilar: 'sistema', peso: 1, situacao: 'concluido', percentualAceito: 0 },
      { pilar: 'sistema', peso: 99, situacao: 'cancelado', percentualAceito: 0 },
    ]).pilares.sistema).toBe(100);
  });
});
