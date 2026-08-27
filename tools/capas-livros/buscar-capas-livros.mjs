/**
 * Script para buscar capas reais de livros via Google Books API
 * e gerar SQL de UPDATE para aplicar no banco homolog.
 *
 * Uso: node tools/capas-livros/buscar-capas-livros.mjs [--commit]
 *   --commit  aplica o SQL no banco (via docker exec na VPS 66)
 */

import { execSync } from 'child_process';

// ─── Lista de livros extraída do banco (id, nome) ─────────────────────────────
const livros = [
  { id: 'b055c26e-528e-4237-9f09-823d23df3d0b', nome: '12 PRINCÍPIOS PARA UMA VIDA EXTRAORDINÁRIA' },
  { id: '4c286c87-41ba-451f-bedd-90398d54fd65', nome: '5 DESAFIOS DAS EQUIPES, OS - SEXTANTE' },
  { id: 'de2eaeac-60f8-40b1-9d74-497e75c2b812', nome: '7 HÁBITOS DAS PESSOAS ALTAMENTE EFICAZES - BEST SELLER' },
  { id: 'd4bc96ca-3562-49cd-aa76-66678909985e', nome: 'ALCANÇANDO EXCELÊNCIA EM VENDAS SPIN SELLING' },
  { id: '23e5af75-7af1-48cb-865d-c6c93ba90195', nome: 'AGRADEÇA E SEJA FELIZ' },
  { id: '936bbd97-3182-448c-9aba-9bdaa2c95db2', nome: 'ARMAS DA PERSUASÃO 2.0' },
  { id: '9a043ec3-3beb-4032-a2d4-b28a82f790ef', nome: 'ARMAS DA PERSUASÃO' },
  { id: '827fd8e6-0906-4d90-9fde-99079214feaf', nome: 'ARRUME SUA CAMA - MAKE YOUR BED' },
  { id: '04e5dd1e-3063-497d-9dd2-0c4e1ddb07b1', nome: 'A ARTE DA IMPERFEIÇÃO' },
  { id: 'ed9ae9d7-7e28-4043-9ccb-660c39082ff1', nome: 'ATIVE SEU CÉREBRO' },
  { id: '255e5434-b805-4463-aa80-439e805f4f7e', nome: 'A AUTOESTIMA DO SEU FILHO' },
  { id: '920942ee-831a-4b71-8bec-e50c0cbc3351', nome: 'BÍBLIA 365 PARA CORAJOSAS NVT' },
  { id: '4cd6d4f4-380a-4c63-8763-a1c5becfef7d', nome: 'BÍBLIA C.S. LEWIS NVI' },
  { id: 'b4ea1e4a-5963-4bcb-9818-4f89085abbd8', nome: 'BÍBLIA DE ESTUDO JOYCE MEYER DOURADA' },
  { id: '9658618d-8bab-4a02-9c1b-942841321c98', nome: 'BÍBLIA DE ESTUDO JOYCE MEYER MOSTARDA' },
  { id: '1d0f362c-e63e-4d55-a92a-383852bbce1e', nome: 'BÍBLIA DE ESTUDO JOYCE MEYER ROSA' },
  { id: 'd40c9b54-9089-4a95-980d-10055ae2e717', nome: 'BÍBLIA DE ESTUDO JOYCE MEYER NUDE' },
  { id: '8b69415c-dee4-4ea0-b860-e2d15de502d4', nome: 'BÍBLIA DE ESTUDO JOYCE MEYER FLORAL ROSA' },
  { id: 'de8dbfc4-8b60-46b2-b02a-b2e58fcfb311', nome: 'BÍBLIA EM AÇÃO VERSÃO MENSAGEM CINZA' },
  { id: 'bc50ea62-cac0-4ac1-9a91-5c328a4ea726', nome: 'BÍBLIA EM AÇÃO VERSÃO MENSAGEM VERMELHA' },
  { id: '40e3f7f5-3be7-44bd-8f39-eefaa20a4dbe', nome: 'BÍBLIA EM AÇÃO VERSÃO MENSAGEM ESPECIAL' },
  { id: '10b57751-41e8-4b41-9fcf-bef1733a7042', nome: 'BÍBLIA ESTUDO JOYCE MEYER CINZA LETRA GRANDE' },
  { id: '5addb73f-82e9-4690-9e08-4072508ba4dd', nome: 'BÍBLIA SAGRADA MARROM THOMAS NELSON' },
  { id: 'c833a4d7-d295-44c9-94dc-61b5302b859c', nome: 'A BOA SORTE - SEXTANTE' },
  { id: 'd1c30edb-e5a0-4283-9124-125b1b27de55', nome: '22 PRINCÍPIOS DO POVO JUDEU' },
  { id: '51636f41-d52b-45f0-8751-082639f699b1', nome: 'CARDS CAMILA VIEIRA FRASES QUE EDIFICAM' },
  { id: 'ac85c6a9-c4e0-4d98-a141-83706c2640e4', nome: 'CARDS PAULO VIEIRA FRASES DE GIGANTES' },
  { id: '49d7390e-3c0a-48ad-8368-aa2a74f09474', nome: 'CARDS PROMESSAS CAMILA VIEIRA' },
  { id: '9c5cbed4-9ec2-47d4-bc34-ddae6e067f3a', nome: 'CARDS PROMESSAS PAULO VIEIRA' },
  { id: '5aeba27e-50dd-4c0b-8ea6-ed944fdf899b', nome: 'AS CARTAS DE BEZOS' },
  { id: '2d900da2-5b40-41ce-90ec-45ecdc4df98f', nome: 'CASAIS INTELIGENTES ENRIQUECEM JUNTOS' },
  { id: '53fe9792-b84b-4a4a-9b2e-72be27415125', nome: 'O CAVALEIRO PRESO NA ARMADURA' },
  { id: '19eee472-8850-4f2a-b051-5f3057672085', nome: 'CHAVES PARA A ECONOMIA DO CÉU' },
  { id: 'fafaa681-28f7-41ad-8be1-a0501d2fc992', nome: 'AS CINCO LINGUAGENS DO AMOR DAS CRIANÇAS' },
  { id: '3efe2553-f333-408b-89ac-042e1087f015', nome: 'AS CINCO LINGUAGENS DO AMOR NA PRÁTICA' },
  { id: 'b27cf5c1-811c-452b-b7d7-e145c8beb706', nome: 'AS CINCO LINGUAGENS DO AMOR PARA HOMENS' },
  { id: '5e162dd8-158c-4d32-9599-198476fb67be', nome: 'AS CINCO LINGUAGENS DO AMOR' },
  { id: 'dbbdfb23-3a0e-41e3-9408-fd3a34cfce99', nome: 'AS CINCO LINGUAGENS DO PERDÃO' },
  { id: '8d6e376d-4867-43a5-9019-403c8cef2c39', nome: 'COMECE PELO PORQUÊ - SEXTANTE' },
  { id: '056b76b7-7efa-48dc-842b-addbd4e47d4f', nome: 'COMO AS GIGANTES CAEM' },
  { id: '6d3bd403-57e3-4f8d-a283-d3aeae7990ce', nome: 'COMO CONVENCER ALGUÉM EM 90 SEGUNDOS' },
  { id: '25fbdd51-5c05-44d4-b4c8-2df767cc9817', nome: 'COMO EVITAR PREOCUPAÇÕES E COMEÇAR A VIVER' },
  { id: 'bfe7c843-01c0-4061-84e7-6a928c9144bd', nome: 'COMO FALAR CORRETAMENTE E SEM INIBIÇÕES' },
  { id: 'e32112eb-ed9d-473f-b97b-f50ad903447b', nome: 'COMO FLECHAS' },
  { id: 'ac537590-dd46-44ef-8dc7-3373df555b08', nome: 'CORAÇÃO SELVAGEM - JOHN ELDREDGE' },
  { id: 'f992d831-a834-4228-ad51-5a2e645f4499', nome: 'A CORAGEM DE SER IMPERFEITO' },
  { id: '34720959-6d61-4133-a1e0-6ef8426dbe15', nome: 'CULTURA DA HONRA' },
  { id: '6c881a92-3387-4794-b0e3-364d35a6f99f', nome: 'A DAMA SEU AMADO E SEU SENHOR' },
  { id: 'c6392047-bc13-4848-9480-769d078af51d', nome: 'DAR E RECEBER - ADAM GRANT' },
  { id: 'a2e852b6-4467-4481-aa2e-d2c13472ee13', nome: 'DECIFRE E INFLUENCIE PESSOAS' },
  { id: 'eba0be62-3b66-473f-95c3-208de0814af8', nome: 'DESCUBRA O SEU DESTINO' },
  { id: 'a2982b56-3843-440d-bbd8-64105f0266a5', nome: 'O DESPERTAR DA LEOA' },
  { id: '552a2f7d-e1a8-45bc-a79c-be25e9531aa8', nome: 'DESPERTE O PODER DENTRO DE VOCÊ - TONY ROBBINS' },
  { id: '0681b821-4f6e-4a16-b08c-fabb87f7c243', nome: 'DESPERTE SEU GIGANTE INTERIOR - TONY ROBBINS' },
  { id: 'e0268ed5-82a1-497a-9dbd-154611caccaa', nome: 'DEVOCIONAL MULHERES CAPA LARANJA' },
  { id: 'ef31711c-9fab-45f8-bb57-4d52731964c6', nome: 'DEVOCIONAL MULHERES' },
  { id: '7ff2fa72-94f8-4a1b-8d4d-e0acdb6c08ba', nome: 'EMPATIA ASSERTIVA - ALTA BOOKS' },
  { id: '66fbe0a8-eb1d-41e8-a289-c511e5e602b4', nome: 'EMPRESAS FEITAS PARA VENCER' },
  { id: '2fb62840-ce27-4462-9619-52412bd86e98', nome: 'EMPRESAS HUMANIZADAS' },
  { id: '124ba42d-a8b8-410a-bb00-8a35244048c2', nome: 'EMPRESAS QUE CURAM' },
  { id: '8a73be26-3ac5-4bcc-984f-2f84f5cb993b', nome: 'ENCONTRE SEU PORQUÊ - SEXTANTE' },
  { id: 'ad40b415-8301-4dc0-8a2d-26a29a44b80b', nome: 'ESPECIALISTA EM PESSOAS' },
  { id: '7985f7e2-6100-4421-9e25-31650e7aa7b7', nome: 'ESSENCIALISMO - GREG MCKEOWN' },
  { id: '235911c6-ea8a-4101-90c0-f9f7863b22c8', nome: 'EXECUÇÃO - RAM CHARAN' },
  { id: '5399049e-9872-48d3-8eef-8398a31483ae', nome: 'FEITAS PARA DURAR - JIM COLLINS' },
  { id: 'b1e73188-fb1e-4092-81ff-c71d3ff5d0c3', nome: 'FORTE - JOYCE MEYER' },
  { id: 'bc1234ff-eb57-42b9-9449-eafdc91a444a', nome: 'O GERENTE MINUTO' },
  { id: 'b412a929-90da-44b4-861c-81da266aebcb', nome: 'HÁBITOS ATÔMICOS - JAMES CLEAR' },
  { id: '726f7c0c-41f7-4c24-bd1a-97cf55cc2b06', nome: 'HIPERCRESCIMENTO' },
  { id: '54be83b2-8b01-4dbe-8b03-ba59a02fde5a', nome: 'O HOMEM COMPLETO' },
  { id: '8d596335-7b67-43b8-bf14-a5ecad327ea6', nome: 'HOMEM DO REINO' },
  { id: '39587b0a-5bc3-436f-83d2-da68d7f3e960', nome: 'O HOMEM MAIS RICO DA BABILÔNIA' },
  { id: '374ab96a-b33b-4e26-9fce-b72842f54cf3', nome: 'O JEITO DISNEY DE ENCANTAR OS CLIENTES' },
  { id: 'b46dbfa8-b0c6-45b1-8335-be552cd00cc2', nome: 'O JEITO HARVARD DE SER FELIZ' },
  { id: 'b73cf964-b662-4448-a51c-792410b0823d', nome: 'JOGAR PARA VENCER' },
  { id: '9f6b409f-4db2-4f35-a23b-59d07bffc7f2', nome: '12 PRINCÍPIOS PARA UMA VIDA EXTRAORDINÁRIA - PAULO VIEIRA' },
  { id: 'c4424b1f-73d4-42bd-96ae-0231eabc662f', nome: '180 PERGUNTAS PARA MUDAR SUA VIDA' },
  { id: '9bd3b001-7cc9-4d9d-92f1-71be80d2ba17', nome: '70 VERSOS E PROSA' },
  { id: 'cf5fb1f5-b3f1-4a28-8652-bc8301354a8b', nome: 'A ARTE DE FALAR EM PÚBLICO' },
  { id: '5489b128-13d6-4a71-9881-6ba6afc339d0', nome: 'ABRE A BOCA, FECHA A BOCA' },
  { id: 'f8118577-9b86-4647-b718-f95d93e2590a', nome: 'COACHING INTEGRAL SISTÊMICO' },
  { id: '079e76f8-d3ef-4456-99a3-200370ca2476', nome: 'CONTA LÁ QUE EU CONTO CÁ' },
  { id: 'f273d82a-7766-489a-9532-27c2ea6534ca', nome: 'CRIAÇÃO DE RIQUEZA' },
  { id: '417dc2b4-aff3-465b-8999-5f4813a8894d', nome: 'DECIFRE SEU TALENTO' },
  { id: '122e7eae-f4ac-4f70-8255-ee43dbacf4a0', nome: 'EDUCAR, AMAR E DAR LIMITES' },
  { id: '474fb5b0-9559-43c8-a64b-24564e601a7a', nome: 'EM VEZ DE CHORAR DECIDI SORRIR' },
  { id: '3bb1c08e-f4e5-4927-81cd-e5d3bc9a465c', nome: 'EU LÍDER EFICAZ' },
  { id: '314360dc-b812-41b2-8a2c-cee8746a900c', nome: 'EXECUÇÃO PREMIUM' },
  { id: '4e4dab67-de9c-48cd-8741-065e3b2f585b', nome: 'FEITAS PARA DURAR EMPRESAS VISIONÁRIAS' },
  { id: '3bed5384-0c74-4657-b5e7-5c26cccfc9d5', nome: 'FERNÃO CAPELO GAIVOTA' },
  { id: 'be3a14bd-4619-4dba-920c-55f97975322c', nome: 'FOCO NA PRÁTICA' },
  { id: 'e95ea47d-78ca-4b89-9a55-67e51f68bf51', nome: 'INVESTIMENTOS INTELIGENTES' },
  { id: '41c40025-d0b7-49ff-a3ff-c01fbd688737', nome: 'KIM JUVENIL' },
  { id: '87cf58ea-cbb6-45a6-8156-79cef6d16fe9', nome: 'LUIZ O GIZ DE CERA' },
  { id: '5c4f112f-8a11-482e-b920-876cc6a4a36d', nome: 'MODERNAS TÉCNICAS DE PERSUASÃO' },
  { id: '9e05e085-606f-4625-abd1-baea43a05744', nome: 'NÃO SE AFOBE' },
  { id: 'cf91833c-4e24-4373-bf6b-fe49a566019c', nome: 'LUCRO PRIMEIRO - MIKE MICHALOWICZ' },
  { id: 'd9ff5d68-cb02-4797-9512-37a560ecf6cf', nome: 'O MAIOR VENDEDOR DO MUNDO' },
  { id: '3a1118a5-e2e2-427b-bd2a-8bccb75e5069', nome: 'MAIS FORTE E CORAJOSA' },
  { id: '0024f236-b15c-49cb-8999-7fd6691ad2a4', nome: 'METANOIA 21 DIAS DE MENTORIA' },
  { id: '5a0351cb-9b19-4841-bcd9-435afb0e1847', nome: 'O MILAGRE DA MANHÃ PARA SE TORNAR UM MILIONÁRIO' },
  { id: '5841eb34-b939-44a0-bd05-15bb1019af5e', nome: 'O MILAGRE DA MANHÃ - HAL ELROD' },
  { id: 'fce65638-2bc3-43aa-bf44-981f32a3f62e', nome: 'O MILAGRE DA MANHÃ DIÁRIO' },
  { id: '5868cd41-4ca2-49d5-897b-3f51b7a60192', nome: 'MULHERES COM ESPADAS' },
  { id: '1244da9a-9a63-4a54-a5d0-402cb971fa29', nome: 'MULHERES ENRAIZADAS' },
  { id: 'f4958610-765d-4f77-892b-8bb2c8c5eddb', nome: 'MULHERES IMPROVÁVEIS CAPA DURA' },
  { id: '2701c6c7-c491-4cca-bf23-56673e119405', nome: 'MULHERES IMPROVÁVEIS' },
  { id: '12148703-5945-4764-97e6-5c48fdccc005', nome: 'NEGÓCIOS DE HONRA' },
  { id: 'e04142ab-e504-4a11-af61-4d78ab812ea8', nome: 'O NOVO CÓDIGO DA CULTURA' },
  { id: '13c905be-f45a-41cd-8076-38bc3cb7b491', nome: 'NOVOS FRUTOS' },
  { id: '355e8d19-2c06-4ad9-8cbe-916345cc2bfa', nome: 'OUSE GOVERNAR' },
  { id: '5e32357e-d0fa-40e9-8ac3-73b05690e2c6', nome: 'PAIXÃO POR VENCER - JACK WELCH' },
  { id: '93cf1f34-ceb5-4a92-8f43-cf7a0c4bab33', nome: 'PARE DE SE SABOTAR E DÊ A VOLTA POR CIMA' },
  { id: 'c57461fb-a62d-4540-934a-7487ae141a24', nome: 'PENSE E ENRIQUEÇA - NAPOLEON HILL' },
  { id: '6200af27-4cb2-4d79-a130-b07a1167df5f', nome: 'PICOS E VALES - SPENCER JOHNSON' },
  { id: '6886b209-9451-40b9-b24f-451388be8164', nome: 'PLANNER EVA' },
  { id: 'f56c27b8-d161-4347-99e4-1f347cfa22a4', nome: 'PLANNER IDENTIDADE PROPÓSITO E UM FUTURO' },
  { id: '098af1e6-f67b-416d-bbd2-c7c3892e44a0', nome: 'PLANNER JULIA VIEIRA CAPA AREIA' },
  { id: '31b1f505-bf7c-43e4-9c5c-af3d9e36c85d', nome: 'PLANNER JULIA VIEIRA CAPA PRETA' },
  { id: '5f4f32e3-b6bc-466c-8a9e-d3e7adfda732', nome: 'PLANNER JULIA VIEIRA BRANCO' },
  { id: '6e4ed706-d398-425d-addc-50e528abe6ff', nome: 'PLANNER JULIA VIEIRA VERMELHO' },
  { id: '75c07d0f-a057-4e75-8bf4-be6b10e2da78', nome: 'PLANNER CAMILA VIEIRA VERDE PLENITUDE' },
  { id: 'd6b957ec-513b-46be-8791-ab9182ffa4ff', nome: 'O PODER DA AÇÃO NAS FINANÇAS - PAULO VIEIRA' },
  { id: 'e351111a-29db-4eb3-a1f5-9b2c32986b8c', nome: 'O PODER DA AÇÃO PARA CRIANÇAS' },
  { id: 'ac43f4e1-c631-4977-a3bd-caceec0a2e1c', nome: 'O PODER DA AÇÃO EDIÇÃO LUXO - PAULO VIEIRA' },
  { id: '9956adce-4f1c-4059-aa85-a9c310b5b81e', nome: 'O PODER DA PACIÊNCIA' },
  { id: '026e8ee2-54b0-46a2-b0f1-8f624ea63ff2', nome: 'O PODER DA PRESENÇA' },
  { id: 'd799b516-71ec-4495-b137-812817a7a662', nome: 'O PODER DOS QUIETOS - SUSAN CAIN' },
  { id: 'e49a824e-91ad-4aad-bf0b-4418bd3d0200', nome: 'PODER SEM LIMITES - TONY ROBBINS' },
  { id: '78684f0a-e6d6-4485-8cd8-c309c9ad911f', nome: 'PRECISO SABER SE ESTOU INDO BEM' },
  { id: 'e83f35b6-b232-4754-a46a-f96529913e0b', nome: 'PRINCÍPIOS - RAY DALIO' },
  { id: 'bef6d68a-0ea6-44b9-ae57-01d2c6cb6f3a', nome: 'PRINCÍPIOS MILENARES' },
  { id: 'b37ba047-142c-43e1-a726-442aca1b70e6', nome: 'A PSICOLOGIA FINANCEIRA - MORGAN HOUSEL' },
  { id: '2eceb846-6257-4419-9281-8942332118c5', nome: 'QUADRO PLANNER EXTRAORDINÁRIO' },
  { id: '1be5b4c2-0ea8-4be8-91b6-950fca464647', nome: 'A QUARTA DIMENSÃO' },
  { id: '2816e890-b67e-46b7-bce7-99aed63c0eb4', nome: 'O QUE TODO CORPO FALA' },
  { id: '0c8a131b-d41e-4c31-a84c-de5a6ac518ed', nome: 'QUEM MEXEU NO MEU QUEIJO' },
  { id: '86eba1fc-a768-431c-b0b3-15f48c2c8c99', nome: 'SALOMÃO O HOMEM MAIS RICO QUE JÁ EXISTIU' },
  { id: 'b85255bc-b6c0-4542-ac9e-d1e3462ec058', nome: 'SCRUM A ARTE DE FAZER O DOBRO NA METADE DO TEMPO' },
  { id: '0b32ab96-6904-482d-97a8-ad4173449b3d', nome: 'OS SEGREDOS DA MENTE MILIONÁRIA' },
  { id: '4d3e012b-3baf-434f-8aeb-356a9942ab56', nome: 'OS SEGREDOS DAS APRESENTAÇÕES PODEROSAS' },
  { id: '5fe3490e-0437-47be-884d-64ecda7c27f7', nome: 'SEM ESFORÇO - GREG MCKEOWN' },
  { id: 'ad98280d-0050-4ba9-a58a-1f2b9dd6a3ca', nome: 'SEM RIVAIS' },
  { id: '9155c8c3-c160-4cfa-958c-ee3c2a69371d', nome: 'SEU PERFEITO VOCÊ' },
  { id: '6462878d-97b0-43d6-b3c0-ac373ca0137e', nome: 'TED FALAR CONVENCER EMOCIONAR' },
  { id: 'a150a091-fe9f-4dcb-ba09-7e268c91a46f', nome: 'ULTRACORAJOSO' },
  { id: '7ead7ff6-97e1-4c33-a706-b6b06c8fbb5e', nome: 'UMA VIDA COM PROPÓSITOS' },
  { id: '962c12b3-ce6e-4978-9e0b-e736ea1b4473', nome: 'O VENDEDOR MINUTO' },
  { id: '6d6e3853-481f-4ab3-8776-71d185e6167e', nome: 'O VINHO NOVO E MELHOR' },
  { id: 'd576edf4-0b85-47a7-ac2d-e35a19610435', nome: 'VIVA A SUA REAL IDENTIDADE' },
  { id: '952e816c-16a9-4233-812d-9c49a6cf3f00', nome: 'VOCÊ AGUENTA SER FELIZ' },
  { id: '5d1d27e2-9d24-46c0-83a2-455f60f6397d', nome: 'VOCÊ PODE CURAR SUA VIDA' },
  { id: '9838f8d9-a5e7-41ac-91bd-e318f2a7bf60', nome: 'A ARTE DA GUERRA - PREFÁCIO PAULO VIEIRA' },
  { id: '3d6e3362-eec6-4e2a-8af0-c74a12f6e700', nome: 'A BÍBLIA DE VENDAS' },
  { id: '8d8c3c3c-de9c-4d27-b055-59dbe86a241a', nome: 'A CIÊNCIA DE FICAR RICO - PREFÁCIO PAULO VIEIRA' },
  { id: 'a5f9b7fc-d518-4f57-9350-86e5b36619ea', nome: 'A ÚLTIMA PÉROLA' },
  { id: '27796f07-4a71-4c3d-ac6c-9d8160def2d5', nome: 'AINDA SOMOS UMA FAMÍLIA' },
  { id: 'c90191a1-99e6-437b-a2b1-10758e252c8e', nome: 'APAIXONADO PELA VIDA' },
  { id: '69a94b26-f0e9-4043-9643-fe178611611f', nome: 'BAÚ DE TESOUROS' },
  { id: '1e24285a-c433-4bb6-a2dd-6c9cf9e535d7', nome: 'BULLETPROOF A DIETA À PROVA DE BALAS' },
  { id: '19ffa95c-4d39-46d0-ba21-7b2cb38b7dd1', nome: 'CAÇA-CADA-CALA-PALAVRAS' },
  { id: 'a695be3a-ec54-4f2c-ab37-2ae97907f03a', nome: 'CADÊ OS ANIMAIS' },
  { id: 'c12f5378-9e1b-4103-8ea8-e1e1db3a5570', nome: 'CAETANO E TODOS OS SUPERPODERES' },
  { id: 'cf835fbe-7fe9-4423-bf81-99178f18d130', nome: 'CAMPO DE BATALHA DA MENTE - JOYCE MEYER' },
  { id: '8273d098-9777-47bc-b11c-9159cc59395a', nome: 'COMO CHEGAR AO SIM - NEGOCIAÇÃO' },
  { id: 'fd2bc9cb-0b9e-4914-b5e0-c849c5221d10', nome: 'DA POBREZA AO PODER - PREFÁCIO PAULO VIEIRA' },
  { id: '351d8247-3dd1-4252-99f7-8bf5db3d7ee1', nome: 'O LIVRO DE OURO DA LIDERANÇA' },
  { id: '49f97593-db26-4a88-b047-aa702b2a4312', nome: 'LIVRO DE PROVÉRBIOS' },
  { id: '5884d19d-373b-4e18-a2c3-93f4b30a5072', nome: 'DECIFRE E FORTALEÇA SEU FILHO' },
  { id: '25f6c7a4-3727-405f-a99d-90ac3c7caa8b', nome: 'DESPERTE O PODER DENTRO DE VOCÊ - PAULO VIEIRA' },
  { id: 'ccce12ee-775f-4d51-a94c-1b6793d0f141', nome: 'DINOSSAUROS E CARROS VOADORES' },
  { id: '7f935bf4-bc4e-456c-9d7d-1a2db21c2a1a', nome: 'DOBRE SEUS LUCROS' },
  { id: 'fd4e84ea-6276-4d9e-8663-6bf5939b1c47', nome: 'DOS PROVÉRBIOS DE SALOMÃO - MARTIN CLARET' },
  { id: '5d001025-2975-4cb3-9de5-3e7ea91aa290', nome: 'EU E MINHA BOCA GRANDE' },
  { id: '3f866737-cba7-4a30-a3c6-d6f432fe7e6a', nome: 'HUMILDADE - PREFÁCIO PAULO VIEIRA' },
  { id: '743a9224-0a7b-4aac-a0b3-9541407883cc', nome: 'NAÇÃO DOPAMINA' },
  { id: 'ad681873-2a0c-446d-a425-46bf4a74276b', nome: 'O HOMEM É AQUILO QUE PENSA - PREFÁCIO PAULO VIEIRA' },
  { id: '0beb142a-b871-4f38-a6ad-c9a58ae086a8', nome: 'O MENINO QUE NÃO QUERIA DORMIR' },
  { id: 'ccbe918b-bf20-4f4c-86a4-0b94e6b9eb7f', nome: 'O MENINO QUE QUERIA VOAR' },
  { id: '44b1fa96-1919-4ea8-a89d-c55aa0b78475', nome: 'O MILIONÁRIO MORA AO LADO' },
  { id: 'aadbe385-06eb-40e2-b6cf-8746478ba28c', nome: 'O VOVÔ COMBINA COM' },
  { id: '4dfbb559-ab94-4ad1-b3e1-e27d2bed4889', nome: 'PIRATA LULUC' },
  { id: 'fbc995bb-c967-4280-848e-db3c734b66de', nome: 'PODER E RIQUEZA' },
  { id: 'e580396a-9b0b-4fed-bdff-59430777227d', nome: 'RESGATE DA RIQUEZA' },
  { id: '3054647d-364d-421b-ae0f-f3bd9f77e0d9', nome: 'SUPERE AS TURBULÊNCIAS DA VIDA - PREFÁCIO PAULO VIEIRA' },
  { id: '3c15e176-ff3b-41c5-ad54-176e83e2e87c', nome: 'UMA EMOÇÃO ATRÁS DA OUTRA' },
  { id: 'a2f2c855-d3a4-49ef-a0fd-e132fd19d6ae', nome: 'VENCEDORAS POR OPÇÃO' },
  { id: '93508649-bbb1-47a4-a0df-5365e869f0ae', nome: 'VENDA A MENTE NÃO AO CLIENTE' },
  { id: 'fed05dda-a71e-4f43-b005-5ff832477843', nome: 'LIVROS' },
];

// ─── Função para buscar capa no Google Books ──────────────────────────────────
async function buscarCapaGoogleBooks(titulo) {
  const q = encodeURIComponent(titulo);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=pt&printType=books`;
  
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data.items || data.items.length === 0) return null;
    
    // Pegar o primeiro resultado com thumbnail
    for (const item of data.items) {
      const img = item.volumeInfo?.imageLinks;
      if (img) {
        // Preferir imagem maior, usar HTTPS
        const url = (img.thumbnail || img.smallThumbnail || '').replace('http://', 'https://');
        // Aumentar tamanho: zoom=1 → zoom=2 ou usar &fife=w400
        const urlMelhor = url.replace('&zoom=1', '&zoom=2').replace('zoom=1&', 'zoom=2&') + '&fife=w400';
        return { url: urlMelhor, titulo: item.volumeInfo?.title || '' };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ─── Função para buscar capa no Open Library ─────────────────────────────────
async function buscarCapaOpenLibrary(titulo) {
  const q = encodeURIComponent(titulo);
  const searchUrl = `https://openlibrary.org/search.json?q=${q}&language=por&limit=3&fields=key,title,cover_i,isbn`;
  
  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data.docs || data.docs.length === 0) return null;
    
    for (const doc of data.docs) {
      if (doc.cover_i) {
        return {
          url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          titulo: doc.title || ''
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ─── Normaliza texto para comparação ─────────────────────────────────────────
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Valida se o resultado contém palavras relevantes do título ───────────────
function validarCorrespondencia(nomeBusca, tituloResultado) {
  const n = normalizar(nomeBusca);
  const t = normalizar(tituloResultado);
  
  // Extrair palavras significativas (len > 3, excluindo stopwords)
  const stopwords = new Set(['para', 'como', 'seus', 'suas', 'uma', 'uns', 'das', 'dos', 'nas', 'nos', 'com', 'sem', 'por', 'que', 'nao', 'mais', 'cada', 'esse', 'esta', 'este', 'voce', 'meu', 'minha', 'seu', 'sua', 'muito', 'pelo', 'pela', 'the', 'and', 'for', 'you', 'your', 'our', 'their']);
  
  const palavras = n.split(' ').filter(p => p.length > 3 && !stopwords.has(p));
  if (palavras.length === 0) return true; // não consegue validar
  
  const matches = palavras.filter(p => t.includes(p));
  return matches.length / palavras.length >= 0.4; // pelo menos 40% das palavras batem
}

// ─── Principal ────────────────────────────────────────────────────────────────
const commit = process.argv.includes('--commit');
const updates = [];
const falhas = [];

console.log(`🔍 Buscando capas para ${livros.length} livros...\n`);

for (const livro of livros) {
  process.stdout.write(`  • ${livro.nome.substring(0, 60).padEnd(60)} → `);
  
  let resultado = null;
  
  // 1. Tentar Google Books
  resultado = await buscarCapaGoogleBooks(livro.nome);
  
  if (resultado && validarCorrespondencia(livro.nome, resultado.titulo)) {
    console.log(`✅ Google [${resultado.titulo.substring(0, 40)}]`);
    updates.push({ id: livro.id, nome: livro.nome, url: resultado.url, fonte: 'google' });
    continue;
  }
  
  // 2. Tentar Open Library
  resultado = await buscarCapaOpenLibrary(livro.nome);
  
  if (resultado && validarCorrespondencia(livro.nome, resultado.titulo)) {
    console.log(`✅ OpenLib [${resultado.titulo.substring(0, 40)}]`);
    updates.push({ id: livro.id, nome: livro.nome, url: resultado.url, fonte: 'openlibrary' });
    continue;
  }
  
  // 3. Tentar Google Books com query mais simples (só primeiras palavras)
  const nomeSimples = livro.nome.split(' - ')[0].split(',')[0].trim();
  if (nomeSimples !== livro.nome) {
    resultado = await buscarCapaGoogleBooks(nomeSimples);
    if (resultado && validarCorrespondencia(nomeSimples, resultado.titulo)) {
      console.log(`✅ Google-simple [${resultado.titulo.substring(0, 40)}]`);
      updates.push({ id: livro.id, nome: livro.nome, url: resultado.url, fonte: 'google-simple' });
      continue;
    }
  }
  
  console.log(`❌ Não encontrado`);
  falhas.push(livro.nome);
  
  // Pequeno delay para não sobrecarregar a API
  await new Promise(r => setTimeout(r, 300));
}

console.log(`\n📊 Resultado: ${updates.length} capas encontradas, ${falhas.length} não encontradas\n`);

// ─── Gerar SQL ────────────────────────────────────────────────────────────────
if (updates.length > 0) {
  const linhasSQL = updates.map(u => 
    `UPDATE loja_produtos SET imagem_url = '${u.url.replace(/'/g, "''")}' WHERE id = '${u.id}';`
  );
  
  const sql = `-- Atualização de capas de livros
-- Gerado em: ${new Date().toISOString()}
-- Total: ${updates.length} livros

${linhasSQL.join('\n')}
`;
  
  // Salvar SQL
  import('fs').then(fs => fs.writeFileSync('/tmp/update-capas-livros.sql', sql, 'utf8'));
  console.log(`\n💾 SQL salvo em /tmp/update-capas-livros.sql`);
  
  if (commit) {
    console.log('\n🚀 Aplicando SQL no banco homolog...');
    try {
      execSync(`sshpass -p '1952aplA++++' ssh -o StrictHostKeyChecking=no root@31.97.166.66 "docker exec -i febrahub_postgres psql -U febrahub -d febrahub" < /tmp/update-capas-livros.sql`, { stdio: 'inherit' });
      console.log('✅ SQL aplicado com sucesso!');
    } catch (e) {
      console.error('❌ Erro ao aplicar SQL:', e.message);
    }
  }
}

if (falhas.length > 0) {
  console.log('\n❌ Livros sem capa encontrada:');
  falhas.forEach(f => console.log(`  - ${f}`));
}
