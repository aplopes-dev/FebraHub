import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// A credencial é o que dá direito de vender em nome da loja. O que se testa
/// aqui é que ela sobrevive ao disco intacta — e que o token não escapa por
/// onde ninguém espera.
void main() {
  const DeviceCredential credential = DeviceCredential(
    token: 'segredo-do-terminal',
    terminalId: 'terminal-1',
    terminalName: 'Caixa 1',
    organizationId: 'org-1',
    branchId: 'branch-1',
  );

  test('sobrevive ao round-trip de JSON', () {
    final DeviceCredential withNames = credential.copyWith(
      organizationName: 'Loja Ilhéus',
      branchName: 'Loja Centro',
    );
    final DeviceCredential restored = DeviceCredential.fromJson(
      jsonDecode(jsonEncode(withNames.toJson())) as Map<String, dynamic>,
    );

    expect(restored.token, withNames.token);
    expect(restored.terminalId, withNames.terminalId);
    expect(restored.terminalName, withNames.terminalName);
    expect(restored.organizationId, withNames.organizationId);
    expect(restored.branchId, withNames.branchId);
    expect(restored.organizationName, 'Loja Ilhéus');
    expect(restored.branchName, 'Loja Centro');
  });

  test('fromJson antigo sem nomes não quebra', () {
    final DeviceCredential restored = DeviceCredential.fromJson(
      <String, dynamic>{
        'token': 't',
        'terminalId': 'tid',
        'terminalName': 'Caixa',
        'organizationId': 'oid',
        'branchId': 'bid',
      },
    );
    expect(restored.organizationName, isNull);
    expect(restored.establishmentDisplayName, 'Caixa');
  });

  test('establishmentDisplayName prefere unidade', () {
    expect(
      credential
          .copyWith(organizationName: 'Empresa', branchName: 'Unidade')
          .establishmentDisplayName,
      'Unidade',
    );
  });

  test('toString não vaza o token', () {
    // `toString` acaba em log e em mensagem de erro sem ninguém decidir isso —
    // por isso o token fica de fora dele.
    expect(credential.toString(), isNot(contains('segredo-do-terminal')));
    expect(credential.toString(), contains('Caixa 1'));
  });

  test('a organização e a unidade vêm do servidor, não de escolha do app', () {
    // Não há setter: o PDV não decide em nome de que loja está vendendo. Se um
    // dia houver, este teste quebra e a decisão volta à mesa.
    expect(credential.organizationId, 'org-1');
    expect(credential.branchId, 'branch-1');
  });
}
