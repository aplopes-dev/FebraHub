import { splitName, usernameFromEmail } from './store-owner-credentials';

describe('store-owner-credentials', () => {
  describe('splitName', () => {
    it('não inventa sobrenome quando só há um nome', () => {
      expect(splitName('Carlos')).toEqual({
        firstName: 'Carlos',
        lastName: '',
      });
      expect(splitName('Danillo')).toEqual({
        firstName: 'Danillo',
        lastName: '',
      });
    });

    it('preserva nome composto no sobrenome', () => {
      expect(splitName('Carlos Mendes')).toEqual({
        firstName: 'Carlos',
        lastName: 'Mendes',
      });
    });
  });

  describe('usernameFromEmail', () => {
    it('usa o e-mail completo como username', () => {
      expect(usernameFromEmail('carlos@example.com')).toBe(
        'carlos@example.com',
      );
    });
  });
});
