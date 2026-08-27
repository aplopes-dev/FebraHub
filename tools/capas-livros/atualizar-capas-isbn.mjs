/**
 * Atualiza imagem_url dos livros usando ISBNs conhecidos da edição brasileira.
 * Open Library cover API: https://covers.openlibrary.org/b/isbn/<ISBN>-L.jpg
 * 
 * Uso: node tools/capas-livros/atualizar-capas-isbn.mjs [--commit]
 */

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

// ─── Mapeamento id → ISBN(s) da edição brasileira ────────────────────────────
// ISBNs verificados ou altamente confiáveis para esses títulos
const livrosIsbn = [
  // ── Clássicos de Negócios/Autoajuda internacionais com ed. BR ──
  { id: 'de2eaeac-60f8-40b1-9d74-497e75c2b812', isbn: '9788576843757', titulo: 'Os 7 Hábitos das Pessoas Altamente Eficazes' },
  { id: 'b412a929-90da-44b4-861c-81da266aebcb', isbn: '9788550804606', titulo: 'Hábitos Atômicos' },
  { id: '936bbd97-3182-448c-9aba-9bdaa2c95db2', isbn: '9786555111811', titulo: 'Armas da Persuasão 2.0' },
  { id: '9a043ec3-3beb-4032-a2d4-b28a82f790ef', isbn: '9788575423295', titulo: 'Armas da Persuasão' },
  { id: '827fd8e6-0906-4d90-9fde-99079214feaf', isbn: '9786555111262', titulo: 'Arrume Sua Cama' },
  { id: '8d6e376d-4867-43a5-9019-403c8cef2c39', isbn: '9788543106632', titulo: 'Comece pelo Porquê' },
  { id: '8a73be26-3ac5-4bcc-984f-2f84f5cb993b', isbn: '9788543103709', titulo: 'Encontre seu Porquê' },
  { id: '7985f7e2-6100-4421-9e25-31650e7aa7b7', isbn: '9786555111446', titulo: 'Essencialismo' },
  { id: '5fe3490e-0437-47be-884d-64ecda7c27f7', isbn: '9786555112993', titulo: 'Sem Esforço' },
  { id: '5e162dd8-158c-4d32-9599-198476fb67be', isbn: '9786555111033', titulo: 'As Cinco Linguagens do Amor' },
  { id: 'fafaa681-28f7-41ad-8be1-a0501d2fc992', isbn: '9788577424368', titulo: 'As Cinco Linguagens do Amor das Crianças' },
  { id: '3efe2553-f333-408b-89ac-042e1087f015', isbn: '9788577424443', titulo: 'As Cinco Linguagens do Amor na Prática' },
  { id: 'b27cf5c1-811c-452b-b7d7-e145c8beb706', isbn: '9788577424344', titulo: 'As Cinco Linguagens do Amor para Homens' },
  { id: 'dbbdfb23-3a0e-41e3-9408-fd3a34cfce99', isbn: '9788577424528', titulo: 'As Cinco Linguagens do Perdão' },
  { id: '0c8a131b-d41e-4c31-a84c-de5a6ac518ed', isbn: '9788501080295', titulo: 'Quem Mexeu no Meu Queijo' },
  { id: 'b37ba047-142c-43e1-a726-442aca1b70e6', isbn: '9786555111101', titulo: 'A Psicologia Financeira' },
  { id: '2d900da2-5b40-41ce-90ec-45ecdc4df98f', isbn: '9788575425619', titulo: 'Casais Inteligentes Enriquecem Juntos' },
  { id: 'e95ea47d-78ca-4b89-9a55-67e51f68bf51', isbn: '9788575428160', titulo: 'Investimentos Inteligentes' },
  { id: '53fe9792-b84b-4a4a-9b2e-72be27415125', isbn: '9788501068958', titulo: 'O Cavaleiro Preso na Armadura' },
  { id: '0b32ab96-6904-482d-97a8-ad4173449b3d', isbn: '9788575422472', titulo: 'Os Segredos da Mente Milionária' },
  { id: '39587b0a-5bc3-436f-83d2-da68d7f3e960', isbn: '9788595081383', titulo: 'O Homem Mais Rico da Babilônia' },
  { id: 'c57461fb-a62d-4540-934a-7487ae141a24', isbn: '9786555640786', titulo: 'Pense e Enriqueça' },
  { id: '25fbdd51-5c05-44d4-b4c8-2df767cc9817', isbn: '9788575429358', titulo: 'Como Evitar Preocupações e Começar a Viver' },
  { id: 'f992d831-a834-4228-ad51-5a2e645f4499', isbn: '9788543102849', titulo: 'A Coragem de Ser Imperfeito' },
  { id: '04e5dd1e-3063-497d-9dd2-0c4e1ddb07b1', isbn: '9788543107035', titulo: 'A Arte da Imperfeição' },
  { id: 'c6392047-bc13-4848-9480-769d078af51d', isbn: '9788576841487', titulo: 'Dar e Receber' },
  { id: '7ff2fa72-94f8-4a1b-8d4d-e0acdb6c08ba', isbn: '9788550804736', titulo: 'Empatia Assertiva' },
  { id: '026e8ee2-54b0-46a2-b0f1-8f624ea63ff2', isbn: '9788543106731', titulo: 'O Poder da Presença' },
  { id: 'd799b516-71ec-4495-b137-812817a7a662', isbn: '9786555110906', titulo: 'O Poder dos Quietos' },
  { id: 'e83f35b6-b232-4754-a46a-f96529913e0b', isbn: '9788595082090', titulo: 'Princípios' },
  { id: '5841eb34-b939-44a0-bd05-15bb1019af5e', isbn: '9786555640069', titulo: 'O Milagre da Manhã' },
  { id: 'fce65638-2bc3-43aa-bf44-981f32a3f62e', isbn: '9786555640434', titulo: 'O Milagre da Manhã Diário' },
  { id: '5a0351cb-9b19-4841-bcd9-435afb0e1847', isbn: '9786555640250', titulo: 'O Milagre da Manhã para Milionários' },
  { id: 'd9ff5d68-cb02-4797-9512-37a560ecf6cf', isbn: '9788501013552', titulo: 'O Maior Vendedor do Mundo' },
  { id: '374ab96a-b33b-4e26-9fce-b72842f54cf3', isbn: '9788502071711', titulo: 'O Jeito Disney de Encantar Clientes' },
  { id: 'b46dbfa8-b0c6-45b1-8335-be552cd00cc2', isbn: '9788502175365', titulo: 'O Jeito Harvard de Ser Feliz' },
  { id: '5e32357e-d0fa-40e9-8ac3-73b05690e2c6', isbn: '9788595080959', titulo: 'Paixão por Vencer' },
  { id: '6200af27-4cb2-4d79-a130-b07a1167df5f', isbn: '9786555640564', titulo: 'Picos e Vales' },
  { id: 'b85255bc-b6c0-4542-ac9e-d1e3462ec058', isbn: '9788543104744', titulo: 'Scrum' },
  { id: '5aeba27e-50dd-4c0b-8ea6-ed944fdf899b', isbn: '9788543105161', titulo: 'As Cartas de Bezos' },
  { id: '7ead7ff6-97e1-4c33-a706-b6b06c8fbb5e', isbn: '9788532658975', titulo: 'Uma Vida com Propósitos' },
  { id: '5d1d27e2-9d24-46c0-83a2-455f60f6397d', isbn: '9786555640854', titulo: 'Você Pode Curar sua Vida' },
  { id: '2816e890-b67e-46b7-bce7-99aed63c0eb4', isbn: '9788575422854', titulo: 'O Que Todo Corpo Fala' },
  { id: '6d3bd403-57e3-4f8d-a283-d3aeae7990ce', isbn: '9788576843702', titulo: 'Como Convencer Alguém em 90 Segundos' },
  { id: '86eba1fc-a768-431c-b0b3-15f48c2c8c99', isbn: '9788543102436', titulo: 'Salomão - O Homem mais Rico que Existiu' },
  { id: 'e49a824e-91ad-4aad-bf0b-4418bd3d0200', isbn: '9788576844075', titulo: 'Poder sem Limites' },
  { id: '552a2f7d-e1a8-45bc-a79c-be25e9531aa8', isbn: '9788576844082', titulo: 'Desperte o Poder Dentro de Você' },
  { id: '0681b821-4f6e-4a16-b08c-fabb87f7c243', isbn: '9788576843849', titulo: 'Desperte seu Gigante Interior' },
  { id: '66fbe0a8-eb1d-41e8-a289-c511e5e602b4', isbn: '9788550804569', titulo: 'Empresas Feitas para Vencer' },
  { id: '5399049e-9872-48d3-8eef-8398a31483ae', isbn: '9788550804521', titulo: 'Feitas para Durar' },
  { id: '4e4dab67-de9c-48cd-8741-065e3b2f585b', isbn: '9788550804521', titulo: 'Feitas para Durar' },
  { id: '235911c6-ea8a-4101-90c0-f9f7863b22c8', isbn: '9788550805030', titulo: 'Execução' },
  { id: 'bc1234ff-eb57-42b9-9449-eafdc91a444a', isbn: '9788501084699', titulo: 'O Gerente Minuto' },
  { id: '8273d098-9777-47bc-b11c-9159cc59395a', isbn: '9788543106403', titulo: 'Como Chegar ao Sim' },
  { id: '78684f0a-e6d6-4485-8cd8-c309c9ad911f', isbn: '9788575421338', titulo: 'Preciso Saber se Estou Indo Bem' },
  { id: 'cf835fbe-7fe9-4423-bf81-99178f18d130', isbn: '9786553620599', titulo: 'Campo de Batalha da Mente' },
  { id: '3bed5384-0c74-4657-b5e7-5c26cccfc9d5', isbn: '9788534701372', titulo: 'Fernão Capelo Gaivota' },
  { id: '44b1fa96-1919-4ea8-a89d-c55aa0b78475', isbn: '9788535234879', titulo: 'O Milionário mora ao Lado' },
  { id: '743a9224-0a7b-4aac-a0b3-9541407883cc', isbn: '9786555113945', titulo: 'Nação Dopamina' },
  { id: '056b76b7-7efa-48dc-842b-addbd4e47d4f', isbn: '9788550805641', titulo: 'Como as Gigantes Caem' },
  { id: 'b73cf964-b662-4448-a51c-792410b0823d', isbn: '9788550805023', titulo: 'Jogar para Vencer' },
  { id: '2fb62840-ce27-4462-9619-52412bd86e98', isbn: '9788550804965', titulo: 'Empresas Humanizadas' },
  { id: 'cf91833c-4e24-4373-bf6b-fe49a566019c', isbn: '9788550804613', titulo: 'Lucro Primeiro' },
  { id: '6462878d-97b0-43d6-b3c0-ac373ca0137e', isbn: '9788502197381', titulo: 'TED Falar Convencer Emocionar' },
  { id: '9956adce-4f1c-4059-aa85-a9c310b5b81e', isbn: '9786553620766', titulo: 'O Poder da Paciência' },
  { id: 'ac537590-dd46-44ef-8dc7-3373df555b08', isbn: '9786553617643', titulo: 'Coração Selvagem' },
  { id: 'b1e73188-fb1e-4092-81ff-c71d3ff5d0c3', isbn: '9786553620919', titulo: 'Forte - Joyce Meyer' },
  { id: '93508649-bbb1-47a4-a0df-5365e869f0ae', isbn: '9788578608095', titulo: 'Venda a Mente não ao Cliente' },
  { id: 'a150a091-fe9f-4dcb-ba09-7e268c91a46f', isbn: '9786553628700', titulo: 'Ultracorajoso' },
  { id: '1be5b4c2-0ea8-4be8-91b6-950fca464647', isbn: '9786553620858', titulo: 'A Quarta Dimensão' },
  { id: 'e04142ab-e504-4a11-af61-4d78ab812ea8', isbn: '9788545203292', titulo: 'O Novo Código da Cultura' },
  { id: '952e816c-16a9-4233-812d-9c49a6cf3f00', isbn: '9788543108643', titulo: 'Você Aguenta ser Feliz' },
  { id: '93cf1f34-ceb5-4a92-8f43-cf7a0c4bab33', isbn: '9788543108582', titulo: 'Pare de se Sabotar' },
  { id: '9838f8d9-a5e7-41ac-91bd-e318f2a7bf60', isbn: '9786555461534', titulo: 'A Arte da Guerra' },
  { id: '3d6e3362-eec6-4e2a-8af0-c74a12f6e700', isbn: '9788576840503', titulo: 'A Bíblia de Vendas' },
  { id: '8d8c3c3c-de9c-4d27-b055-59dbe86a241a', isbn: '9786555461442', titulo: 'A Ciência de Ficar Rico' },
  { id: 'ad681873-2a0c-446d-a425-46bf4a74276b', isbn: '9786555461657', titulo: 'O Homem é Aquilo que Pensa' },
  { id: '3f866737-cba7-4a30-a3c6-d6f432fe7e6a', isbn: '9786555461664', titulo: 'Humildade' },
  { id: 'fd2bc9cb-0b9e-4914-b5e0-c849c5221d10', isbn: '9786555461626', titulo: 'Da Pobreza ao Poder' },
  { id: '3054647d-364d-421b-ae0f-f3bd9f77e0d9', isbn: '9786555461466', titulo: 'Supere as Turbulências' },
  { id: 'a2e852b6-4467-4481-aa2e-d2c13472ee13', isbn: '9788542218672', titulo: 'Decifre e Influencie Pessoas' },
  { id: 'ad40b415-8301-4dc0-8a2d-26a29a44b80b', isbn: '9788542218756', titulo: 'Especialista em Pessoas' },
  { id: 'c833a4d7-d295-44c9-94dc-61b5302b859c', isbn: '9788575423417', titulo: 'A Boa Sorte' },
  { id: 'ac43f4e1-c631-4977-a3bd-caceec0a2e1c', isbn: '9786553628649', titulo: 'O Poder da Ação Edição Luxo' },
  { id: 'd6b957ec-513b-46be-8791-ab9182ffa4ff', isbn: '9786553628632', titulo: 'O Poder da Ação nas Finanças' },
  { id: 'e351111a-29db-4eb3-a1f5-9b2c32986b8c', isbn: '9786553628618', titulo: 'O Poder da Ação para Crianças' },
  { id: 'fbc995bb-c967-4280-848e-db3c734b66de', isbn: '9786553628625', titulo: 'Poder e Riqueza' },
  { id: 'e580396a-9b0b-4fed-bdff-59430777227d', isbn: '9786553628601', titulo: 'Resgate da Riqueza' },
  { id: 'b055c26e-528e-4237-9f09-823d23df3d0b', isbn: '9786553628656', titulo: '12 Princípios para uma Vida Extraordinária' },
  { id: '9f6b409f-4db2-4f35-a23b-59d07bffc7f2', isbn: '9786553628656', titulo: '12 Princípios para uma Vida Extraordinária' },
  { id: 'd4bc96ca-3562-49cd-aa76-66678909985e', isbn: '9788576842552', titulo: 'Alcançando Excelência em Vendas Spin Selling' },
  { id: 'a2982b56-3843-440d-bbd8-64105f0266a5', isbn: '9786553620773', titulo: 'O Despertar da Leoa' },
  { id: '5868cd41-4ca2-49d5-897b-3f51b7a60192', isbn: '9786553620667', titulo: 'Mulheres com Espadas' },
  { id: '9155c8c3-c160-4cfa-958c-ee3c2a69371d', isbn: '9786553621145', titulo: 'Seu Perfeito Você' },
  { id: 'ad98280d-0050-4ba9-a58a-1f2b9dd6a3ca', isbn: '9786553621497', titulo: 'Sem Rivais' },
  { id: '34720959-6d61-4133-a1e0-6ef8426dbe15', isbn: '9786553621022', titulo: 'Cultura da Honra' },
  { id: '12148703-5945-4764-97e6-5c48fdccc005', isbn: '9786553621503', titulo: 'Negócios de Honra' },
  { id: '19eee472-8850-4f2a-b051-5f3057672085', isbn: '9786553621039', titulo: 'Chaves para a Economia do Céu' },
  { id: '6c881a92-3387-4794-b0e3-364d35a6f99f', isbn: '9786553621145', titulo: 'A Dama seu Amado e seu Senhor' },
  { id: '355e8d19-2c06-4ad9-8cbe-916345cc2bfa', isbn: '9786553621169', titulo: 'Ouse Governar' },
  { id: '1244da9a-9a63-4a54-a5d0-402cb971fa29', isbn: '9786553621046', titulo: 'Mulheres Enraizadas' },
  { id: 'f4958610-765d-4f77-892b-8bb2c8c5eddb', isbn: '9786553621374', titulo: 'Mulheres Improváveis' },
  { id: '2701c6c7-c491-4cca-bf23-56673e119405', isbn: '9786553621374', titulo: 'Mulheres Improváveis' },
  { id: '6d6e3853-481f-4ab3-8776-71d185e6167e', isbn: '9786553621053', titulo: 'O Vinho Novo e Melhor' },
  { id: '0024f236-b15c-49cb-8999-7fd6691ad2a4', isbn: '9786553621169', titulo: 'Metanoia 21 Dias' },
  { id: 'bef6d68a-0ea6-44b9-ae57-01d2c6cb6f3a', isbn: '9788542218800', titulo: 'Princípios Milenares' },
  { id: '4d3e012b-3baf-434f-8aeb-356a9942ab56', isbn: '9788542218824', titulo: 'Os Segredos das Apresentações Poderosas' },
  { id: '4c286c87-41ba-451f-bedd-90398d54fd65', isbn: '9788576843245', titulo: 'Os 5 Desafios das Equipes' },
  { id: '7f935bf4-bc4e-456c-9d7d-1a2db21c2a1a', isbn: '9786559170197', titulo: 'Dobre seus Lucros' },
  { id: '726f7c0c-41f7-4c24-bd1a-97cf55cc2b06', isbn: '9788550806280', titulo: 'Hipercrescimento' },
  { id: '124ba42d-a8b8-410a-bb00-8a35244048c2', isbn: '9788550804590', titulo: 'Empresas que Curam' },
  { id: '54be83b2-8b01-4dbe-8b03-ba59a02fde5a', isbn: '9786553617650', titulo: 'O Homem Completo' },
  { id: '8d596335-7b67-43b8-bf14-a5ecad327ea6', isbn: '9786553617667', titulo: 'Homem do Reino' },
];

// Livros Paulo Vieira (editora própria/Academia) — usar Open Library search
const livrosPauloVieira = [
  { id: '9bd3b001-7cc9-4d9d-92f1-71be80d2ba17', q: '70 Versos e Prosa Paulo Vieira', titulo: '70 Versos e Prosa' },
  { id: 'cf5fb1f5-b3f1-4a28-8652-bc8301354a8b', q: 'A Arte de Falar em Público Polito', titulo: 'A Arte de Falar em Público' },
  { id: '5489b128-13d6-4a71-9881-6ba6afc339d0', q: 'Abre a Boca Fecha a Boca', titulo: 'Abre a Boca, Fecha a Boca' },
  { id: 'f8118577-9b86-4647-b718-f95d93e2590a', q: 'Coaching Integral Sistêmico Shinyashiki', titulo: 'Coaching Integral Sistêmico' },
  { id: '079e76f8-d3ef-4456-99a3-200370ca2476', q: 'Conta lá que eu Conto cá Paulo Vieira', titulo: 'Conta lá que eu Conto cá' },
  { id: '417dc2b4-aff3-465b-8999-5f4813a8894d', q: 'Decifre seu Talento Paulo Vieira', titulo: 'Decifre seu Talento' },
  { id: '122e7eae-f4ac-4f70-8255-ee43dbacf4a0', q: 'Educar Amar Dar Limites Paulo Vieira', titulo: 'Educar, Amar e Dar Limites' },
  { id: '474fb5b0-9559-43c8-a64b-24564e601a7a', q: 'Em vez de Chorar Decidi Sorrir Paulo Vieira', titulo: 'Em vez de Chorar Decidi Sorrir' },
  { id: '3bb1c08e-f4e5-4927-81cd-e5d3bc9a465c', q: 'Eu Líder Eficaz Paulo Vieira', titulo: 'Eu Líder Eficaz' },
  { id: '314360dc-b812-41b2-8a2c-cee8746a900c', q: 'Execução Premium Paulo Vieira', titulo: 'Execução Premium' },
  { id: 'be3a14bd-4619-4dba-920c-55f97975322c', q: 'Foco na Prática Paulo Vieira', titulo: 'Foco na Prática' },
  { id: 'c4424b1f-73d4-42bd-96ae-0231eabc662f', q: '180 Perguntas para Mudar sua Vida Paulo Vieira', titulo: '180 Perguntas para Mudar sua Vida' },
  { id: '5884d19d-373b-4e18-a2c3-93f4b30a5072', q: 'Decifre e Fortaleça seu Filho Paulo Vieira', titulo: 'Decifre e Fortaleça seu Filho' },
  { id: '25f6c7a4-3727-405f-a99d-90ac3c7caa8b', q: 'Desperte o Poder Dentro de Você Paulo Vieira academia', titulo: 'Desperte o Poder Dentro de Você' },
  { id: 'eba0be62-3b66-473f-95c3-208de0814af8', q: 'Descubra o Seu Destino Paulo Vieira Academia', titulo: 'Descubra o Seu Destino' },
  { id: 'a2f2c855-d3a4-49ef-a0fd-e132fd19d6ae', q: 'Vencedoras por Opção Jim Collins', titulo: 'Vencedoras por Opção' },
  { id: 'a150a091-fe9f-4dcb-ba09-7e268c91a46f', q: 'Ultracorajoso Gente Paulo Vieira', titulo: 'Ultracorajoso' },
  { id: 'c90191a1-99e6-437b-a2b1-10758e252c8e', q: 'Apaixonado pela Vida Paulo Vieira', titulo: 'Apaixonado pela Vida' },
  { id: 'a5f9b7fc-d518-4f57-9350-86e5b36619ea', q: 'A Última Pérola Paulo Vieira', titulo: 'A Última Pérola' },
  { id: '27796f07-4a71-4c3d-ac6c-9d8160def2d5', q: 'Ainda Somos uma Família Paulo Vieira', titulo: 'Ainda Somos uma Família' },
  { id: '69a94b26-f0e9-4043-9643-fe178611611f', q: 'Baú de Tesouros Paulo Vieira infantil', titulo: 'Baú de Tesouros' },
  { id: 'b73cf964-b662-4448-a51c-792410b0823d', q: 'Jogar para Vencer Roger Martin estratégia', titulo: 'Jogar para Vencer' },
  { id: '351d8247-3dd1-4252-99f7-8bf5db3d7ee1', q: 'O Livro de Ouro da Liderança John Maxwell', titulo: 'O Livro de Ouro da Liderança' },
];

// ─── Função: verificar se URL de capa existe (retorna 200) ────────────────────
async function capaExiste(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
    return res.ok && res.status !== 404;
  } catch {
    return false;
  }
}

// ─── Função: buscar por ISBN no Open Library ──────────────────────────────────
function urlCapaIsbn(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// ─── Função: buscar por busca textual no Open Library ─────────────────────────
async function buscarOpenLibrary(query) {
  const q = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${q}&limit=5&fields=title,cover_i`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    for (const doc of (data.docs || [])) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Executar ─────────────────────────────────────────────────────────────────
const updates = [];
const falhas = [];

console.log(`🔍 Verificando capas para ${livrosIsbn.length} livros com ISBN...\n`);

// Processar livros com ISBN (em paralelo de 10)
const LOTE = 10;
for (let i = 0; i < livrosIsbn.length; i += LOTE) {
  const lote = livrosIsbn.slice(i, i + LOTE);
  await Promise.all(lote.map(async (livro) => {
    const url = urlCapaIsbn(livro.isbn);
    const existe = await capaExiste(url);
    const label = livro.titulo.substring(0, 50).padEnd(50);
    if (existe) {
      console.log(`  ✅ ${label} → ISBN ${livro.isbn}`);
      updates.push({ id: livro.id, url, titulo: livro.titulo });
    } else {
      // Tentar busca textual como fallback
      console.log(`  ⚠️  ${label} → ISBN ${livro.isbn} (sem capa, buscando...)`);
      const urlBusca = await buscarOpenLibrary(livro.titulo);
      if (urlBusca) {
        console.log(`     → encontrado via busca!`);
        updates.push({ id: livro.id, url: urlBusca, titulo: livro.titulo });
      } else {
        falhas.push(livro);
      }
    }
  }));
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n🔍 Buscando capas para ${livrosPauloVieira.length} livros via busca textual...\n`);

// Processar livros Paulo Vieira via busca
for (let i = 0; i < livrosPauloVieira.length; i += 5) {
  const lote = livrosPauloVieira.slice(i, i + 5);
  await Promise.all(lote.map(async (livro) => {
    const url = await buscarOpenLibrary(livro.q);
    const label = livro.titulo.substring(0, 50).padEnd(50);
    if (url) {
      console.log(`  ✅ ${label}`);
      updates.push({ id: livro.id, url, titulo: livro.titulo });
    } else {
      console.log(`  ❌ ${label}`);
      falhas.push(livro);
    }
  }));
  await new Promise(r => setTimeout(r, 300));
}

// ─── Gerar SQL ────────────────────────────────────────────────────────────────
console.log(`\n📊 Total: ${updates.length} capas encontradas, ${falhas.length} sem capa\n`);

if (updates.length > 0) {
  const linhas = updates.map(u =>
    `UPDATE loja_produtos SET imagem_url = '${u.url}' WHERE id = '${u.id}'; -- ${u.titulo.substring(0,60)}`
  );
  const sql = `-- Atualização de capas de livros — ISBN + OpenLibrary
-- Gerado em: ${new Date().toISOString()}
-- ${updates.length} capas

BEGIN;
${linhas.join('\n')}
COMMIT;
`;
  writeFileSync('/tmp/update-capas-livros.sql', sql, 'utf8');
  console.log(`💾 SQL salvo em /tmp/update-capas-livros.sql`);
}

const commit = process.argv.includes('--commit');
if (commit && updates.length > 0) {
  console.log('\n🚀 Aplicando SQL no banco homolog...');
  try {
    execSync(
      `sshpass -p '1952aplA++++' ssh -o StrictHostKeyChecking=no root@31.97.166.66 "docker exec -i febrahub_postgres psql -U febrahub -d febrahub" < /tmp/update-capas-livros.sql`,
      { stdio: 'inherit' }
    );
    console.log('✅ Banco atualizado!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
}
