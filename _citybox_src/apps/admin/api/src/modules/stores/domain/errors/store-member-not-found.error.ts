export class StoreMemberNotFoundError extends Error {
  constructor(context: string, memberId: string) {
    super(`[${context}] Store member not found: ${memberId}`);
    this.name = 'StoreMemberNotFoundError';
  }
}
