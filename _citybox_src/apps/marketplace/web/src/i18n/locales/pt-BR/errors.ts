export default {
  loadData: 'Não foi possível carregar os dados. Verifique a conexão com a API.',
  placeOrder: 'Não foi possível finalizar o pedido. Tente novamente.',
  login: {
    credentialsRequired: 'Preencha e-mail e senha',
    passwordMinLength: 'Senha deve ter ao menos 4 caracteres',
    invalid: 'E-mail ou senha incorretos',
    serverConnection: 'Não foi possível conectar ao servidor. Verifique a conexão com a API.',
    googleConnection: 'Não foi possível conectar com Google',
  },
  register: {
    nameRequired: 'Informe seu nome',
    invalidEmail: 'E-mail inválido',
    phoneRequired: 'Informe seu telefone',
    passwordMinLength: 'Senha deve ter ao menos 6 caracteres',
    passwordMismatch: 'As senhas não coincidem',
    emailTaken: 'Já existe uma conta com este e-mail',
    failed: 'Não foi possível criar a conta',
  },
  hook: {
    toast: 'useToast deve ser usado dentro de <ToastProvider>',
    appProvider: '{{hook}} deve ser usado dentro de <AppProvider>',
  },
} as const;
