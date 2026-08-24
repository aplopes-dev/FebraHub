/** Delay simulado para operações assíncronas (mock de rede). */
export function simulateDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
