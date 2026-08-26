/**
 * Script para buscar capas reais de livros via Open Library Search API.
 * Valida se a imagem encontrada corresponde ao livro pelo título.
 * Gera SQL de UPDATE e opcionalmente aplica no banco homolog.
 *
 * Uso:
 *   node scripts/buscar-capas-livros-v2.mjs            # só gera o SQL
 *   node scripts/buscar-capas-livros-v2.mjs --commit   # gera + aplica no banco
 */

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

// ─── Lista completa de livros (id do banco homolog, nome para busca) ──────────
const livros = [
  { id: 'b055c26e-528e-4237-9f09-823d23df3d0b', q: '12 Princípios para uma Vida Extraordinária Paulo Vieira' },
  { id: '9f6b409f-4db2-4f35-a23b-59d07bffc7f2', q: '12 Princípios para uma Vida Extraordinária Paulo Vieira' },
  { id: '4c286c87-41ba-451f-bedd-90398d54fd65', q: 'Os 5 Desafios das Equipes Patrick Lencioni' },
  { id: 'de2eaeac-60f8-40b1-9d74-497e75c2b812', q: 'Os 7 Hábitos das Pessoas Altamente Eficazes Stephen Covey' },
  { id: 'd4bc96ca-3562-49cd-aa76-66678909985e', q: 'Alcançando Excelência em Vendas Spin Selling Neil Rackham' },
  { id: '23e5af75-7af1-48cb-865d-c6c93ba90195', q: 'Agradeça e Seja Feliz Robert Holden' },
  { id: '936bbd97-3182-448c-9aba-9bdaa2c95db2', q: 'Armas da Persuasão 2.0 Robert Cialdini' },
  { id: '9a043ec3-3beb-4032-a2d4-b28a82f790ef', q: 'Armas da Persuasão Robert Cialdini' },
  { id: '827fd8e6-0906-4d90-9fde-99079214feaf', q: 'Arrume sua Cama William McRaven' },
  { id: '04e5dd1e-3063-497d-9dd2-0c4e1ddb07b1', q: 'A Arte da Imperfeição Brené Brown' },
  { id: 'ed9ae9d7-7e28-4043-9ccb-660c39082ff1', q: 'Ative seu Cérebro Caroline Leaf' },
  { id: '255e5434-b805-4463-aa80-439e805f4f7e', q: 'A Autoestima do seu Filho Ross Campbell' },
  { id: '920942ee-831a-4b71-8bec-e50c0cbc3351', q: 'Bíblia 365 para Corajosas NVT' },
  { id: '4cd6d4f4-380a-4c63-8763-a1c5becfef7d', q: 'Bíblia CS Lewis NVI Thomas Nelson' },
  { id: 'b4ea1e4a-5963-4bcb-9818-4f89085abbd8', q: 'Bíblia de Estudo Joyce Meyer Dourada Letra Grande' },
  { id: '9658618d-8bab-4a02-9c1b-942841321c98', q: 'Bíblia de Estudo Joyce Meyer Mostarda Letra Grande' },
  { id: '1d0f362c-e63e-4d55-a92a-383852bbce1e', q: 'Bíblia de Estudo Joyce Meyer Rosa Letra Grande' },
  { id: 'd40c9b54-9089-4a95-980d-10055ae2e717', q: 'Bíblia de Estudo Joyce Meyer Nude' },
  { id: '8b69415c-dee4-4ea0-b860-e2d15de502d4', q: 'Bíblia de Estudo Joyce Meyer Floral Rosa Bello' },
  { id: 'de8dbfc4-8b60-46b2-b02a-b2e58fcfb311', q: 'Bíblia em Ação Versão Mensagem Cinza Geográfica' },
  { id: 'bc50ea62-cac0-4ac1-9a91-5c328a4ea726', q: 'Bíblia em Ação Versão Mensagem Vermelha Geográfica' },
  { id: '40e3f7f5-3be7-44bd-8f39-eefaa20a4dbe', q: 'Bíblia em Ação Versão Mensagem Especial Geográfica' },
  { id: '10b57751-41e8-4b41-9fcf-bef1733a7042', q: 'Bíblia Estudo Joyce Meyer Cinza Letra Grande Bello' },
  { id: '5addb73f-82e9-4690-9e08-4072508ba4dd', q: 'Bíblia Sagrada Thomas Nelson' },
  { id: 'c833a4d7-d295-44c9-94dc-61b5302b859c', q: 'A Boa Sorte Alex Rovira' },
  { id: 'd1c30edb-e5a0-4283-9124-125b1b27de55', q: '22 Princípios do Povo Judeu Blech' },
  { id: '51636f41-d52b-45f0-8751-082639f699b1', q: 'Cards Camila Vieira Frases que Edificam' },
  { id: 'ac85c6a9-c4e0-4d98-a141-83706c2640e4', q: 'Cards Paulo Vieira Frases de Gigantes' },
  { id: '49d7390e-3c0a-48ad-8368-aa2a74f09474', q: 'Cards Promessas Camila Vieira' },
  { id: '9c5cbed4-9ec2-47d4-bc34-ddae6e067f3a', q: 'Cards Promessas Paulo Vieira' },
  { id: '5aeba27e-50dd-4c0b-8ea6-ed944fdf899b', q: 'As Cartas de Bezos Steve Anderson' },
  { id: '2d900da2-5b40-41ce-90ec-45ecdc4df98f', q: 'Casais Inteligentes Enriquecem Juntos Gustavo Cerbasi' },
  { id: '53fe9792-b84b-4a4a-9b2e-72be27415125', q: 'O Cavaleiro Preso na Armadura Robert Fisher' },
  { id: '19eee472-8850-4f2a-b051-5f3057672085', q: 'Chaves para a Economia do Céu Bill Johnson' },
  { id: 'fafaa681-28f7-41ad-8be1-a0501d2fc992', q: 'As Cinco Linguagens do Amor das Crianças Gary Chapman' },
  { id: '3efe2553-f333-408b-89ac-042e1087f015', q: 'As Cinco Linguagens do Amor na Prática Gary Chapman' },
  { id: 'b27cf5c1-811c-452b-b7d7-e145c8beb706', q: 'As Cinco Linguagens do Amor para Homens Gary Chapman' },
  { id: '5e162dd8-158c-4d32-9599-198476fb67be', q: 'As Cinco Linguagens do Amor Gary Chapman' },
  { id: 'dbbdfb23-3a0e-41e3-9408-fd3a34cfce99', q: 'As Cinco Linguagens do Perdão Gary Chapman' },
  { id: '8d6e376d-4867-43a5-9019-403c8cef2c39', q: 'Comece pelo Porquê Simon Sinek' },
  { id: '056b76b7-7efa-48dc-842b-addbd4e47d4f', q: 'Como as Gigantes Caem Jim Collins' },
  { id: '6d3bd403-57e3-4f8d-a283-d3aeae7990ce', q: 'Como Convencer Alguém em 90 Segundos Nicholas Boothman' },
  { id: '25fbdd51-5c05-44d4-b4c8-2df767cc9817', q: 'Como Evitar Preocupações e Começar a Viver Dale Carnegie' },
  { id: 'bfe7c843-01c0-4061-84e7-6a928c9144bd', q: 'Como Falar Corretamente e Sem Inibições Reinaldo Polito' },
  { id: 'e32112eb-ed9d-473f-b97b-f50ad903447b', q: 'Como Flechas Gary Ezzo' },
  { id: 'ac537590-dd46-44ef-8dc7-3373df555b08', q: 'Coração Selvagem John Eldredge' },
  { id: 'f992d831-a834-4228-ad51-5a2e645f4499', q: 'A Coragem de Ser Imperfeito Brené Brown' },
  { id: '34720959-6d61-4133-a1e0-6ef8426dbe15', q: 'Cultura da Honra Danny Silk' },
  { id: '6c881a92-3387-4794-b0e3-364d35a6f99f', q: 'A Dama seu Amado e seu Senhor Stasi Eldredge' },
  { id: 'c6392047-bc13-4848-9480-769d078af51d', q: 'Dar e Receber Adam Grant' },
  { id: 'a2e852b6-4467-4481-aa2e-d2c13472ee13', q: 'Decifre e Influencie Pessoas Paulo Vieira' },
  { id: 'eba0be62-3b66-473f-95c3-208de0814af8', q: 'Descubra o Seu Destino Paulo Vieira Academia' },
  { id: 'a2982b56-3843-440d-bbd8-64105f0266a5', q: 'O Despertar da Leoa Lisa Bevere' },
  { id: '552a2f7d-e1a8-45bc-a79c-be25e9531aa8', q: 'Desperte o Poder Dentro de Você Tony Robbins' },
  { id: '0681b821-4f6e-4a16-b08c-fabb87f7c243', q: 'Desperte seu Gigante Interior Tony Robbins' },
  { id: 'e0268ed5-82a1-497a-9dbd-154611caccaa', q: 'Devocional Mulheres Laranja' },
  { id: 'ef31711c-9fab-45f8-bb57-4d52731964c6', q: 'Devocional Mulheres' },
  { id: '7ff2fa72-94f8-4a1b-8d4d-e0acdb6c08ba', q: 'Empatia Assertiva Kim Scott' },
  { id: '66fbe0a8-eb1d-41e8-a289-c511e5e602b4', q: 'Empresas Feitas para Vencer Jim Collins' },
  { id: '2fb62840-ce27-4462-9619-52412bd86e98', q: 'Empresas Humanizadas Raj Sisodia' },
  { id: '124ba42d-a8b8-410a-bb00-8a35244048c2', q: 'Empresas que Curam' },
  { id: '8a73be26-3ac5-4bcc-984f-2f84f5cb993b', q: 'Encontre seu Porquê Simon Sinek' },
  { id: 'ad40b415-8301-4dc0-8a2d-26a29a44b80b', q: 'Especialista em Pessoas Paulo Vieira' },
  { id: '7985f7e2-6100-4421-9e25-31650e7aa7b7', q: 'Essencialismo Greg McKeown' },
  { id: '235911c6-ea8a-4101-90c0-f9f7863b22c8', q: 'Execução Ram Charan Larry Bossidy' },
  { id: '5399049e-9872-48d3-8eef-8398a31483ae', q: 'Feitas para Durar Jim Collins' },
  { id: 'b1e73188-fb1e-4092-81ff-c71d3ff5d0c3', q: 'Forte Joyce Meyer' },
  { id: 'bc1234ff-eb57-42b9-9449-eafdc91a444a', q: 'O Gerente Minuto Ken Blanchard' },
  { id: 'b412a929-90da-44b4-861c-81da266aebcb', q: 'Hábitos Atômicos James Clear' },
  { id: '726f7c0c-41f7-4c24-bd1a-97cf55cc2b06', q: 'Hipercrescimento Aaron Ross Jason Lemkin' },
  { id: '54be83b2-8b01-4dbe-8b03-ba59a02fde5a', q: 'O Homem Completo Edwin Louis Cole' },
  { id: '8d596335-7b67-43b8-bf14-a5ecad327ea6', q: 'Homem do Reino Tony Evans' },
  { id: '39587b0a-5bc3-436f-83d2-da68d7f3e960', q: 'O Homem mais Rico da Babilônia George Clason' },
  { id: '374ab96a-b33b-4e26-9fce-b72842f54cf3', q: 'O Jeito Disney de Encantar os Clientes' },
  { id: 'b46dbfa8-b0c6-45b1-8335-be552cd00cc2', q: 'O Jeito Harvard de Ser Feliz Shawn Achor' },
  { id: 'b73cf964-b662-4448-a51c-792410b0823d', q: 'Jogar para Vencer Roger Martin A.G. Lafley' },
  { id: 'c4424b1f-73d4-42bd-96ae-0231eabc662f', q: '180 Perguntas para Mudar sua Vida' },
  { id: '9bd3b001-7cc9-4d9d-92f1-71be80d2ba17', q: '70 Versos e Prosa Paulo Vieira' },
  { id: 'cf5fb1f5-b3f1-4a28-8652-bc8301354a8b', q: 'A Arte de Falar em Público Reinaldo Polito' },
  { id: '5489b128-13d6-4a71-9881-6ba6afc339d0', q: 'Abre a Boca Fecha a Boca' },
  { id: 'f8118577-9b86-4647-b718-f95d93e2590a', q: 'Coaching Integral Sistêmico Roberto Shinyashiki' },
  { id: '079e76f8-d3ef-4456-99a3-200370ca2476', q: 'Conta lá que eu Conto cá Paulo Vieira' },
  { id: 'f273d82a-7766-489a-9532-27c2ea6534ca', q: 'Criação de Riqueza Paulo Vieira' },
  { id: '417dc2b4-aff3-465b-8999-5f4813a8894d', q: 'Decifre seu Talento Paulo Vieira' },
  { id: '122e7eae-f4ac-4f70-8255-ee43dbacf4a0', q: 'Educar Amar e Dar Limites Paulo Vieira' },
  { id: '474fb5b0-9559-43c8-a64b-24564e601a7a', q: 'Em vez de Chorar Decidi Sorrir Paulo Vieira' },
  { id: '3bb1c08e-f4e5-4927-81cd-e5d3bc9a465c', q: 'Eu Líder Eficaz Paulo Vieira' },
  { id: '314360dc-b812-41b2-8a2c-cee8746a900c', q: 'Execução Premium Paulo Vieira' },
  { id: '4e4dab67-de9c-48cd-8741-065e3b2f585b', q: 'Feitas para Durar Práticas Bem-Sucedidas em Empresas Visionárias Jim Collins' },
  { id: '3bed5384-0c74-4657-b5e7-5c26cccfc9d5', q: 'Fernão Capelo Gaivota Richard Bach' },
  { id: 'be3a14bd-4619-4dba-920c-55f97975322c', q: 'Foco na Prática Paulo Vieira' },
  { id: 'e95ea47d-78ca-4b89-9a55-67e51f68bf51', q: 'Investimentos Inteligentes Gustavo Cerbasi' },
  { id: '41c40025-d0b7-49ff-a3ff-c01fbd688737', q: 'Kim Rudyard Kipling juvenil' },
  { id: '87cf58ea-cbb6-45a6-8156-79cef6d16fe9', q: 'Luiz o Giz de Cera infantil' },
  { id: '5c4f112f-8a11-482e-b920-876cc6a4a36d', q: 'Modernas Técnicas de Persuasão' },
  { id: 'cf91833c-4e24-4373-bf6b-fe49a566019c', q: 'Lucro Primeiro Mike Michalowicz' },
  { id: 'd9ff5d68-cb02-4797-9512-37a560ecf6cf', q: 'O Maior Vendedor do Mundo Og Mandino' },
  { id: '3a1118a5-e2e2-427b-bd2a-8bccb75e5069', q: 'Mais Forte e Corajosa Joyce Meyer' },
  { id: '0024f236-b15c-49cb-8999-7fd6691ad2a4', q: 'Metanoia 21 Dias de Mentoria' },
  { id: '5a0351cb-9b19-4841-bcd9-435afb0e1847', q: 'O Milagre da Manhã para se Tornar um Milionário Hal Elrod' },
  { id: '5841eb34-b939-44a0-bd05-15bb1019af5e', q: 'O Milagre da Manhã Hal Elrod' },
  { id: 'fce65638-2bc3-43aa-bf44-981f32a3f62e', q: 'O Milagre da Manhã Diário Hal Elrod' },
  { id: '5868cd41-4ca2-49d5-897b-3f51b7a60192', q: 'Mulheres com Espadas Lisa Bevere' },
  { id: '1244da9a-9a63-4a54-a5d0-402cb971fa29', q: 'Mulheres Enraizadas Vida' },
  { id: 'f4958610-765d-4f77-892b-8bb2c8c5eddb', q: 'Mulheres Improváveis capa dura' },
  { id: '2701c6c7-c491-4cca-bf23-56673e119405', q: 'Mulheres Improváveis Vida' },
  { id: '12148703-5945-4764-97e6-5c48fdccc005', q: 'Negócios de Honra Chara' },
  { id: 'e04142ab-e504-4a11-af61-4d78ab812ea8', q: 'O Novo Código da Cultura Daniel Coyle' },
  { id: '13c905be-f45a-41cd-8076-38bc3cb7b491', q: 'Novos Frutos' },
  { id: '355e8d19-2c06-4ad9-8cbe-916345cc2bfa', q: 'Ouse Governar' },
  { id: '5e32357e-d0fa-40e9-8ac3-73b05690e2c6', q: 'Paixão por Vencer Jack Welch' },
  { id: '93cf1f34-ceb5-4a92-8f43-cf7a0c4bab33', q: 'Pare de se Sabotar e dê a Volta por Cima' },
  { id: 'c57461fb-a62d-4540-934a-7487ae141a24', q: 'Pense e Enriqueça Napoleon Hill' },
  { id: '6200af27-4cb2-4d79-a130-b07a1167df5f', q: 'Picos e Vales Spencer Johnson' },
  { id: '6886b209-9451-40b9-b24f-451388be8164', q: 'Planner agenda anual' },
  { id: 'f56c27b8-d161-4347-99e4-1f347cfa22a4', q: 'Planner Identidade Propósito Futuro' },
  { id: '098af1e6-f67b-416d-bbd2-c7c3892e44a0', q: 'Planner Julia Vieira agenda' },
  { id: '31b1f505-bf7c-43e4-9c5c-af3d9e36c85d', q: 'Planner Julia Vieira agenda capa preta' },
  { id: '5f4f32e3-b6bc-466c-8a9e-d3e7adfda732', q: 'Planner Julia Vieira branco agenda' },
  { id: '6e4ed706-d398-425d-addc-50e528abe6ff', q: 'Planner Julia Vieira vermelho agenda' },
  { id: '75c07d0f-a057-4e75-8bf4-be6b10e2da78', q: 'Planner Camila Vieira verde plenitude agenda' },
  { id: 'd6b957ec-513b-46be-8791-ab9182ffa4ff', q: 'O Poder da Ação nas Finanças Paulo Vieira' },
  { id: 'e351111a-29db-4eb3-a1f5-9b2c32986b8c', q: 'O Poder da Ação para Crianças Paulo Vieira' },
  { id: 'ac43f4e1-c631-4977-a3bd-caceec0a2e1c', q: 'O Poder da Ação Paulo Vieira edição luxo' },
  { id: '9956adce-4f1c-4059-aa85-a9c310b5b81e', q: 'O Poder da Paciência Joyce Meyer' },
  { id: '026e8ee2-54b0-46a2-b0f1-8f624ea63ff2', q: 'O Poder da Presença Amy Cuddy' },
  { id: 'd799b516-71ec-4495-b137-812817a7a662', q: 'O Poder dos Quietos Susan Cain' },
  { id: 'e49a824e-91ad-4aad-bf0b-4418bd3d0200', q: 'Poder sem Limites Tony Robbins' },
  { id: '78684f0a-e6d6-4485-8cd8-c309c9ad911f', q: 'Preciso Saber se Estou Indo Bem Richard Williams' },
  { id: 'e83f35b6-b232-4754-a46a-f96529913e0b', q: 'Princípios Ray Dalio' },
  { id: 'bef6d68a-0ea6-44b9-ae57-01d2c6cb6f3a', q: 'Princípios Milenares Paulo Vieira' },
  { id: 'b37ba047-142c-43e1-a726-442aca1b70e6', q: 'A Psicologia Financeira Morgan Housel' },
  { id: '2eceb846-6257-4419-9281-8942332118c5', q: 'Quadro Planner Extraordinário Paulo Vieira' },
  { id: '1be5b4c2-0ea8-4be8-91b6-950fca464647', q: 'A Quarta Dimensão David Yonggi Cho' },
  { id: '2816e890-b67e-46b7-bce7-99aed63c0eb4', q: 'O que Todo Corpo Fala Joe Navarro' },
  { id: '0c8a131b-d41e-4c31-a84c-de5a6ac518ed', q: 'Quem Mexeu no meu Queijo Spencer Johnson' },
  { id: '86eba1fc-a768-431c-b0b3-15f48c2c8c99', q: 'Salomão o Homem mais Rico que já Existiu Steven K. Scott' },
  { id: 'b85255bc-b6c0-4542-ac9e-d1e3462ec058', q: 'Scrum A Arte de Fazer o Dobro na Metade do Tempo Jeff Sutherland' },
  { id: '0b32ab96-6904-482d-97a8-ad4173449b3d', q: 'Os Segredos da Mente Milionária T. Harv Eker' },
  { id: '4d3e012b-3baf-434f-8aeb-356a9942ab56', q: 'Os Segredos das Apresentações Poderosas Paulo Vieira' },
  { id: '5fe3490e-0437-47be-884d-64ecda7c27f7', q: 'Sem Esforço Greg McKeown' },
  { id: 'ad98280d-0050-4ba9-a58a-1f2b9dd6a3ca', q: 'Sem Rivais Bill Johnson' },
  { id: '9155c8c3-c160-4cfa-958c-ee3c2a69371d', q: 'Seu Perfeito Você Joyce Meyer' },
  { id: '6462878d-97b0-43d6-b3c0-ac373ca0137e', q: 'TED Falar Convencer Emocionar Jeremey Donovan' },
  { id: 'a150a091-fe9f-4dcb-ba09-7e268c91a46f', q: 'Ultracorajoso Paulo Vieira' },
  { id: '7ead7ff6-97e1-4c33-a706-b6b06c8fbb5e', q: 'Uma Vida com Propósitos Rick Warren' },
  { id: '962c12b3-ce6e-4978-9e0b-e736ea1b4473', q: 'O Vendedor Minuto Spencer Johnson' },
  { id: '6d6e3853-481f-4ab3-8776-71d185e6167e', q: 'O Vinho Novo e Melhor Bill Johnson' },
  { id: 'd576edf4-0b85-47a7-ac2d-e35a19610435', q: 'Viva a sua Real Identidade' },
  { id: '952e816c-16a9-4233-812d-9c49a6cf3f00', q: 'Você Aguenta ser Feliz Sextante' },
  { id: '5d1d27e2-9d24-46c0-83a2-455f60f6397d', q: 'Você Pode Curar sua Vida Louise Hay' },
  { id: '9838f8d9-a5e7-41ac-91bd-e318f2a7bf60', q: 'A Arte da Guerra Sun Tzu Paulo Vieira' },
  { id: '3d6e3362-eec6-4e2a-8af0-c74a12f6e700', q: 'A Bíblia de Vendas Jeffrey Gitomer' },
  { id: '8d8c3c3c-de9c-4d27-b055-59dbe86a241a', q: 'A Ciência de Ficar Rico Wallace Wattles' },
  { id: 'a5f9b7fc-d518-4f57-9350-86e5b36619ea', q: 'A Última Pérola Paulo Vieira' },
  { id: '27796f07-4a71-4c3d-ac6c-9d8160def2d5', q: 'Ainda Somos uma Família Paulo Vieira' },
  { id: 'c90191a1-99e6-437b-a2b1-10758e252c8e', q: 'Apaixonado pela Vida Paulo Vieira' },
  { id: '69a94b26-f0e9-4043-9643-fe178611611f', q: 'Baú de Tesouros infantil' },
  { id: '1e24285a-c433-4bb6-a2dd-6c9cf9e535d7', q: 'Bulletproof Diet Dave Asprey Dieta à Prova de Balas' },
  { id: '19ffa95c-4d39-46d0-ba21-7b2cb38b7dd1', q: 'Caça Palavras livro infantil' },
  { id: 'a695be3a-ec54-4f2c-ab37-2ae97907f03a', q: 'Cadê os Animais livro infantil' },
  { id: 'c12f5378-9e1b-4103-8ea8-e1e1db3a5570', q: 'Caetano e todos os Superpoderes infantil' },
  { id: 'cf835fbe-7fe9-4423-bf81-99178f18d130', q: 'Campo de Batalha da Mente Joyce Meyer' },
  { id: '8273d098-9777-47bc-b11c-9159cc59395a', q: 'Como Chegar ao Sim Negociação Roger Fisher' },
  { id: 'fd2bc9cb-0b9e-4914-b5e0-c849c5221d10', q: 'Da Pobreza ao Poder James Allen Paulo Vieira' },
  { id: '351d8247-3dd1-4252-99f7-8bf5db3d7ee1', q: 'O Livro de Ouro da Liderança John C. Maxwell' },
  { id: '49f97593-db26-4a88-b047-aa702b2a4312', q: 'Livro de Provérbios Bíblia' },
  { id: '5884d19d-373b-4e18-a2c3-93f4b30a5072', q: 'Decifre e Fortaleça seu Filho Paulo Vieira' },
  { id: '25f6c7a4-3727-405f-a99d-90ac3c7caa8b', q: 'Desperte o Poder Dentro de Você Paulo Vieira' },
  { id: 'ccce12ee-775f-4d51-a94c-1b6793d0f141', q: 'Dinossauros e Carros Voadores infantil' },
  { id: '7f935bf4-bc4e-456c-9d7d-1a2db21c2a1a', q: 'Dobre seus Lucros Bob Fifer' },
  { id: 'fd4e84ea-6276-4d9e-8663-6bf5939b1c47', q: 'Os Provérbios de Salomão Martin Claret' },
  { id: '5d001025-2975-4cb3-9de5-3e7ea91aa290', q: 'Eu e minha Boca Grande infantil' },
  { id: '3f866737-cba7-4a30-a3c6-d6f432fe7e6a', q: 'Humildade Andrew Murray Paulo Vieira' },
  { id: '743a9224-0a7b-4aac-a0b3-9541407883cc', q: 'Nação Dopamina Anna Lembke' },
  { id: 'ad681873-2a0c-446d-a425-46bf4a74276b', q: 'O Homem é Aquilo que Pensa James Allen Paulo Vieira' },
  { id: '0beb142a-b871-4f38-a6ad-c9a58ae086a8', q: 'O Menino que não queria dormir infantil' },
  { id: 'ccbe918b-bf20-4f4c-86a4-0b94e6b9eb7f', q: 'O Menino que queria voar infantil' },
  { id: '44b1fa96-1919-4ea8-a89d-c55aa0b78475', q: 'O Milionário mora ao Lado Thomas Stanley' },
  { id: 'aadbe385-06eb-40e2-b6cf-8746478ba28c', q: 'O Vovô Combina com infantil' },
  { id: '4dfbb559-ab94-4ad1-b3e1-e27d2bed4889', q: 'Pirata Luluc infantil' },
  { id: 'fbc995bb-c967-4280-848e-db3c734b66de', q: 'Poder e Riqueza Paulo Vieira' },
  { id: 'e580396a-9b0b-4fed-bdff-59430777227d', q: 'Resgate da Riqueza Paulo Vieira' },
  { id: '3054647d-364d-421b-ae0f-f3bd9f77e0d9', q: 'Supere as Turbulências da Vida Paulo Vieira' },
  { id: '3c15e176-ff3b-41c5-ad54-176e83e2e87c', q: 'Uma Emoção Atrás da Outra' },
  { id: 'a2f2c855-d3a4-49ef-a0fd-e132fd19d6ae', q: 'Vencedoras por Opção Jim Collins' },
  { id: '93508649-bbb1-47a4-a0df-5365e869f0ae', q: 'Venda a Mente não ao Cliente Jürgen Klaric' },
  { id: 'fed05dda-a71e-4f43-b005-5ff832477843', q: 'livros' },  // genérico
  { id: '9e05e085-606f-4625-abd1-baea43a05744', q: 'Não se Afobe' },
];

// ─── Busca via Open Library ───────────────────────────────────────────────────
async function buscarOpenLibrary(query) {
  const q = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${q}&limit=5&fields=key,title,cover_i,author_name&language=por`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const data = await res.json();
  // Preferir resultados com capa
  for (const doc of (data.docs || [])) {
    if (doc.cover_i) {
      return {
        titulo: doc.title,
        url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
      };
    }
  }
  // Se não achou com capa em português, tenta sem filtro de idioma
  const url2 = `https://openlibrary.org/search.json?q=${q}&limit=5&fields=key,title,cover_i`;
  const res2 = await fetch(url2, { signal: AbortSignal.timeout(10000) });
  if (!res2.ok) return null;
  const data2 = await res2.json();
  for (const doc of (data2.docs || [])) {
    if (doc.cover_i) {
      return {
        titulo: doc.title,
        url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
      };
    }
  }
  return null;
}

// ─── Normalização para validação ─────────────────────────────────────────────
function norm(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set(['para','como','seus','suas','uma','uns','das','dos','nas','nos','com','sem','por','que','nao','mais','cada','esse','esta','este','voce','meu','minha','seu','sua','muito','pelo','pela','the','and','for','you','your','nossa','nosso','ele','ela','eles','elas','ser','ter','isso','aqui','ali','onde','quando','devo','deve','esta','esse','isto']);

function palavrasChave(s) {
  return norm(s).split(' ').filter(p => p.length > 3 && !STOPWORDS.has(p));
}

function pontuacao(query, titulo) {
  const pq = palavrasChave(query);
  const pt = norm(titulo);
  if (pq.length === 0) return 0;
  const hits = pq.filter(p => pt.includes(p));
  return hits.length / pq.length;
}

// ─── Executar em lotes para não sobrecarregar ─────────────────────────────────
const LOTE = 5;      // paralelas por vez
const DELAY = 200;   // ms entre lotes

const updates = [];
const falhas = [];

console.log(`🔍 Buscando capas para ${livros.length} livros via Open Library...\n`);

for (let i = 0; i < livros.length; i += LOTE) {
  const lote = livros.slice(i, i + LOTE);
  
  await Promise.all(lote.map(async (livro) => {
    try {
      const resultado = await buscarOpenLibrary(livro.q);
      
      if (resultado) {
        const score = pontuacao(livro.q, resultado.titulo);
        const ok = score >= 0.35; // pelo menos 35% das palavras batem
        
        const statusIcon = ok ? '✅' : '⚠️';
        const shortQ = livro.q.substring(0, 45).padEnd(45);
        console.log(`  ${statusIcon} ${shortQ} → [score ${(score*100).toFixed(0)}%] ${resultado.titulo.substring(0, 35)}`);
        
        updates.push({
          id: livro.id,
          q: livro.q,
          url: resultado.url,
          titulo: resultado.titulo,
          score,
          ok,
        });
      } else {
        console.log(`  ❌ ${livro.q.substring(0, 60)}`);
        falhas.push(livro);
      }
    } catch (e) {
      console.log(`  💥 ${livro.q.substring(0, 50)} → ${e.message}`);
      falhas.push(livro);
    }
  }));
  
  if (i + LOTE < livros.length) {
    await new Promise(r => setTimeout(r, DELAY));
  }
}

// ─── Separar bons (score alto) dos duvidosos ─────────────────────────────────
const bons = updates.filter(u => u.ok);
const duvidosos = updates.filter(u => !u.ok);

console.log(`\n📊 Resultado:`);
console.log(`   ✅ ${bons.length} capas com boa correspondência`);
console.log(`   ⚠️  ${duvidosos.length} capas com baixa correspondência (incluídas mesmo assim)`);
console.log(`   ❌ ${falhas.length} sem nenhuma capa encontrada`);

// ─── Gerar SQL ────────────────────────────────────────────────────────────────
const todosUpdates = [...bons, ...duvidosos];
if (todosUpdates.length > 0) {
  const linhas = todosUpdates.map(u =>
    `UPDATE loja_produtos SET imagem_url = '${u.url.replace(/'/g, "''")}' WHERE id = '${u.id}'; -- ${u.titulo.substring(0,60).replace(/'/g,"''")}`
  );
  
  const sql = `-- Atualização de capas de livros via Open Library
-- Gerado em: ${new Date().toISOString()}
-- ${bons.length} boas correspondências + ${duvidosos.length} duvidosas

BEGIN;
${linhas.join('\n')}
COMMIT;
`;
  
  writeFileSync('/tmp/update-capas-livros.sql', sql, 'utf8');
  console.log(`\n💾 SQL salvo em /tmp/update-capas-livros.sql`);
}

if (falhas.length > 0) {
  console.log('\n❌ Livros sem capa:');
  falhas.forEach(f => console.log(`  - ${f.q}`));
}

// ─── Aplicar no banco se --commit ─────────────────────────────────────────────
const commit = process.argv.includes('--commit');
if (commit && todosUpdates.length > 0) {
  console.log('\n🚀 Aplicando SQL no banco homolog (31.97.166.66)...');
  try {
    const cmd = `sshpass -p '1952aplA++++' ssh -o StrictHostKeyChecking=no root@31.97.166.66 "docker exec -i febrahub_postgres psql -U febrahub -d febrahub" < /tmp/update-capas-livros.sql`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Banco atualizado com sucesso!');
  } catch (e) {
    console.error('❌ Erro ao aplicar SQL:', e.message);
    process.exit(1);
  }
}
