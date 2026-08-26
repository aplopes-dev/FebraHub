/**
 * Round 2 — capas restantes (ainda com unsplash)
 * Estratégia: ISBN + fallback Open Library search + fallback Estante Virtual
 */
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

// IDs dos livros que ainda estão com unsplash + novos ISBNs
const livros = [
  // Bíblias (usar Open Library search)
  { id: '920942ee-831a-4b71-8bec-e50c0cbc3351', isbn: '9786555459425', titulo: 'Bíblia 365 para Corajosas NVT' },
  { id: '4cd6d4f4-380a-4c63-8763-a1c5becfef7d', isbn: '9786556890074', titulo: 'Bíblia CS Lewis NVI' },
  { id: 'b4ea1e4a-5963-4bcb-9818-4f89085abbd8', isbn: '9786553621176', titulo: 'Bíblia de Estudo Joyce Meyer Dourada' },
  { id: '9658618d-8bab-4a02-9c1b-942841321c98', isbn: '9786553621183', titulo: 'Bíblia de Estudo Joyce Meyer Mostarda' },
  { id: '1d0f362c-e63e-4d55-a92a-383852bbce1e', isbn: '9786553621152', titulo: 'Bíblia de Estudo Joyce Meyer Rosa' },
  { id: 'd40c9b54-9089-4a95-980d-10055ae2e717', isbn: '9786553621190', titulo: 'Bíblia de Estudo Joyce Meyer Nude' },
  { id: '8b69415c-dee4-4ea0-b860-e2d15de502d4', isbn: '9786553621206', titulo: 'Bíblia de Estudo Joyce Meyer Floral Rosa' },
  { id: 'de8dbfc4-8b60-46b2-b02a-b2e58fcfb311', isbn: '9788564565920', titulo: 'Bíblia em Ação Versão Mensagem Cinza' },
  { id: 'bc50ea62-cac0-4ac1-9a91-5c328a4ea726', isbn: '9788564565937', titulo: 'Bíblia em Ação Versão Mensagem Vermelha' },
  { id: '40e3f7f5-3be7-44bd-8f39-eefaa20a4dbe', isbn: '9788564565944', titulo: 'Bíblia em Ação Versão Mensagem Especial' },
  { id: '10b57751-41e8-4b41-9fcf-bef1733a7042', isbn: '9786553621190', titulo: 'Bíblia Estudo Joyce Meyer Cinza' },
  
  // Livros de autoajuda restantes
  { id: '23e5af75-7af1-48cb-865d-c6c93ba90195', isbn: '9788576844006', titulo: 'Agradeça e Seja Feliz' },
  { id: 'ed9ae9d7-7e28-4043-9ccb-660c39082ff1', isbn: '9786553621398', titulo: 'Ative seu Cérebro - Caroline Leaf' },
  { id: '255e5434-b805-4463-aa80-439e805f4f7e', isbn: '9788577424160', titulo: 'A Autoestima do seu Filho' },
  { id: 'bfe7c843-01c0-4061-84e7-6a928c9144bd', isbn: '9788502127616', titulo: 'Como Falar Corretamente' },
  { id: 'e32112eb-ed9d-473f-b97b-f50ad903447b', isbn: '9786553621565', titulo: 'Como Flechas' },
  { id: 'ef31711c-9fab-45f8-bb57-4d52731964c6', isbn: '9786553621572', titulo: 'Devocional Mulheres' },
  { id: 'e0268ed5-82a1-497a-9dbd-154611caccaa', isbn: '9786553621589', titulo: 'Devocional Mulheres Laranja' },
  { id: '3a1118a5-e2e2-427b-bd2a-8bccb75e5069', isbn: '9786553621596', titulo: 'Mais Forte e Corajosa' },
  { id: '962c12b3-ce6e-4978-9e0b-e736ea1b4473', isbn: '9788501084682', titulo: 'O Vendedor Minuto' },
  { id: 'd576edf4-0b85-47a7-ac2d-e35a19610435', isbn: '9786553628717', titulo: 'Viva a sua Real Identidade' },
  { id: '13c905be-f45a-41cd-8076-38bc3cb7b491', isbn: '9786553628724', titulo: 'Novos Frutos' },
  
  // Cards (não têm ISBN, usar imagem genérica de cards)
  // Planners (usar imagem de planner/agenda)
  // Livros Paulo Vieira restantes com ISBNs
  { id: 'cf5fb1f5-b3f1-4a28-8652-bc8301354a8b', isbn: '9788502198449', titulo: 'A Arte de Falar em Público - Polito' },
  { id: '417dc2b4-aff3-465b-8999-5f4813a8894d', isbn: '9788542219037', titulo: 'Decifre seu Talento' },
  { id: '122e7eae-f4ac-4f70-8255-ee43dbacf4a0', isbn: '9788542218992', titulo: 'Educar Amar e Dar Limites' },
  { id: '474fb5b0-9559-43c8-a64b-24564e601a7a', isbn: '9788542219013', titulo: 'Em vez de Chorar Decidi Sorrir' },
  { id: '3bb1c08e-f4e5-4927-81cd-e5d3bc9a465c', isbn: '9788542219020', titulo: 'Eu Líder Eficaz' },
  { id: '314360dc-b812-41b2-8a2c-cee8746a900c', isbn: '9788542219044', titulo: 'Execução Premium' },
  { id: 'f273d82a-7766-489a-9532-27c2ea6534ca', isbn: '9788542218985', titulo: 'Criação de Riqueza' },
  { id: 'c4424b1f-73d4-42bd-96ae-0231eabc662f', isbn: '9788542219068', titulo: '180 Perguntas para Mudar sua Vida' },
  { id: '9bd3b001-7cc9-4d9d-92f1-71be80d2ba17', isbn: '9788542219006', titulo: '70 Versos e Prosa' },
  { id: 'f8118577-9b86-4647-b718-f95d93e2590a', isbn: '9788576844990', titulo: 'Coaching Integral Sistêmico' },
  { id: '079e76f8-d3ef-4456-99a3-200370ca2476', isbn: '9788542218978', titulo: 'Conta lá que eu Conto cá' },
  { id: '5884d19d-373b-4e18-a2c3-93f4b30a5072', isbn: '9788542219082', titulo: 'Decifre e Fortaleça seu Filho' },
  { id: 'eba0be62-3b66-473f-95c3-208de0814af8', isbn: '9788542218961', titulo: 'Descubra o Seu Destino' },
  { id: '25f6c7a4-3727-405f-a99d-90ac3c7caa8b', isbn: '9788542219051', titulo: 'Desperte o Poder Dentro de Você - PV' },
  { id: 'a2f2c855-d3a4-49ef-a0fd-e132fd19d6ae', isbn: '9788550805016', titulo: 'Vencedoras por Opção' },
  { id: 'be3a14bd-4619-4dba-920c-55f97975322c', isbn: '9788542218954', titulo: 'Foco na Prática' },
  { id: '351d8247-3dd1-4252-99f7-8bf5db3d7ee1', isbn: '9788576844280', titulo: 'O Livro de Ouro da Liderança' },
  { id: 'a5f9b7fc-d518-4f57-9350-86e5b36619ea', isbn: '9788542219075', titulo: 'A Última Pérola' },
  { id: 'c90191a1-99e6-437b-a2b1-10758e252c8e', isbn: '9788542218947', titulo: 'Apaixonado pela Vida' },
  { id: '27796f07-4a71-4c3d-ac6c-9d8160def2d5', isbn: '9788542219099', titulo: 'Ainda Somos uma Família' },
  { id: '5c4f112f-8a11-482e-b920-876cc6a4a36d', isbn: '9788576844373', titulo: 'Modernas Técnicas de Persuasão' },
  { id: '1e24285a-c433-4bb6-a2dd-6c9cf9e535d7', isbn: '9788576843559', titulo: 'Bulletproof Diet' },
  { id: '9e05e085-606f-4625-abd1-baea43a05744', isbn: '9788542219006', titulo: 'Nem tão lá, nem tão cá' },
  { id: 'fd4e84ea-6276-4d9e-8663-6bf5939b1c47', isbn: '9788572329859', titulo: 'Os Provérbios de Salomão' },
  { id: '5d001025-2975-4cb3-9de5-3e7ea91aa290', isbn: '9788576840831', titulo: 'Eu e minha Boca Grande' },
];

// Livros sem ISBN possível — usar imagem temática padrão bonita
const semIsbn = [
  // Cards — usar imagem de cards/flashcards
  { id: 'd1c30edb-e5a0-4283-9124-125b1b27de55', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', titulo: 'Cards 22 Princípios' },
  { id: '51636f41-d52b-45f0-8751-082639f699b1', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', titulo: 'Cards Camila Vieira' },
  { id: 'ac85c6a9-c4e0-4d98-a141-83706c2640e4', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', titulo: 'Cards Paulo Vieira' },
  { id: '49d7390e-3c0a-48ad-8368-aa2a74f09474', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', titulo: 'Cards Promessas Camila' },
  { id: '9c5cbed4-9ec2-47d4-bc34-ddae6e067f3a', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80', titulo: 'Cards Promessas Paulo Vieira' },
  // Planners — usar imagem de planner/agenda aberta
  { id: '6886b209-9451-40b9-b24f-451388be8164', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Eva' },
  { id: 'f56c27b8-d161-4347-99e4-1f347cfa22a4', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Identidade Propósito' },
  { id: '098af1e6-f67b-416d-bbd2-c7c3892e44a0', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Julia Vieira Areia' },
  { id: '31b1f505-bf7c-43e4-9c5c-af3d9e36c85d', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Julia Vieira Preta' },
  { id: '5f4f32e3-b6bc-466c-8a9e-d3e7adfda732', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Julia Vieira Branco' },
  { id: '6e4ed706-d398-425d-addc-50e528abe6ff', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Julia Vieira Vermelho' },
  { id: '75c07d0f-a057-4e75-8bf4-be6b10e2da78', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Planner Camila Vieira Verde' },
  { id: '2eceb846-6257-4419-9281-8942332118c5', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80', titulo: 'Quadro Planner Extraordinário' },
  // Livros infantis — usar imagem temática infantil
  { id: '41c40025-d0b7-49ff-a3ff-c01fbd688737', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Kim Juvenil' },
  { id: '87cf58ea-cbb6-45a6-8156-79cef6d16fe9', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Luiz o Giz de Cera' },
  { id: '19ffa95c-4d39-46d0-ba21-7b2cb38b7dd1', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Caça Palavras' },
  { id: 'a695be3a-ec54-4f2c-ab37-2ae97907f03a', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Cadê os Animais' },
  { id: 'c12f5378-9e1b-4103-8ea8-e1e1db3a5570', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Caetano e os Superpoderes' },
  { id: 'ccce12ee-775f-4d51-a94c-1b6793d0f141', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Dinossauros e Carros Voadores' },
  { id: '0beb142a-b871-4f38-a6ad-c9a58ae086a8', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'O Menino que não queria dormir' },
  { id: 'ccbe918b-bf20-4f4c-86a4-0b94e6b9eb7f', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'O Menino que queria voar' },
  { id: 'aadbe385-06eb-40e2-b6cf-8746478ba28c', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'O Vovô Combina com' },
  { id: '4dfbb559-ab94-4ad1-b3e1-e27d2bed4889', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Pirata Luluc' },
  { id: '3c15e176-ff3b-41c5-ad54-176e83e2e87c', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Uma Emoção Atrás da Outra' },
  { id: '69a94b26-f0e9-4043-9643-fe178611611f', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', titulo: 'Baú de Tesouros' },
  // Item genérico "LIVROS"
  { id: 'fed05dda-a71e-4f43-b005-5ff832477843', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80', titulo: 'Livros (genérico)' },
  // Livros Paulo Vieira não catalogados externamente
  { id: '49f97593-db26-4a88-b047-aa702b2a4312', url: 'https://covers.openlibrary.org/b/isbn/9788577424603-L.jpg', titulo: 'Livro de Provérbios' },
];

async function capaExiste(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch { return false; }
}

async function buscarOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=title,cover_i`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    for (const doc of (data.docs || [])) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
  } catch {}
  return null;
}

const updates = [];
console.log(`\n🔍 Verificando ${livros.length} livros com ISBN (round 2)...\n`);

for (let i = 0; i < livros.length; i += 8) {
  const lote = livros.slice(i, i + 8);
  await Promise.all(lote.map(async (livro) => {
    const urlIsbn = `https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg`;
    let url = null;
    
    if (await capaExiste(urlIsbn)) {
      url = urlIsbn;
      console.log(`  ✅ ${livro.titulo.substring(0,50).padEnd(50)} → ISBN ${livro.isbn}`);
    } else {
      // Fallback: busca textual
      url = await buscarOpenLibrary(livro.titulo);
      if (url) {
        console.log(`  🔍 ${livro.titulo.substring(0,50).padEnd(50)} → via busca`);
      } else {
        console.log(`  ❌ ${livro.titulo.substring(0,50)}`);
      }
    }
    
    if (url) updates.push({ id: livro.id, url, titulo: livro.titulo });
  }));
  await new Promise(r => setTimeout(r, 300));
}

// Adicionar os sem ISBN com URLs fixas
console.log(`\n📌 Adicionando ${semIsbn.length} itens com URLs fixas (cards, planners, infantis)...`);
for (const item of semIsbn) {
  updates.push({ id: item.id, url: item.url, titulo: item.titulo });
  console.log(`  📌 ${item.titulo.substring(0,50)}`);
}

console.log(`\n📊 Total round 2: ${updates.length} itens`);

if (updates.length > 0) {
  const linhas = updates.map(u =>
    `UPDATE loja_produtos SET imagem_url = '${u.url}' WHERE id = '${u.id}'; -- ${u.titulo.substring(0,60)}`
  );
  const sql = `-- Round 2 — capas restantes
-- Gerado em: ${new Date().toISOString()}
BEGIN;
${linhas.join('\n')}
COMMIT;
`;
  import('fs').then(({ writeFileSync }) => writeFileSync('/tmp/update-capas-livros-r2.sql', sql, 'utf8'));
  console.log('💾 SQL salvo em /tmp/update-capas-livros-r2.sql');
}

const commit = process.argv.includes('--commit');
if (commit && updates.length > 0) {
  console.log('\n🚀 Aplicando no banco...');
  try {
    execSync(
      `sshpass -p '1952aplA++++' ssh -o StrictHostKeyChecking=no root@31.97.166.66 "docker exec -i febrahub_postgres psql -U febrahub -d febrahub" < /tmp/update-capas-livros-r2.sql`,
      { stdio: 'inherit' }
    );
    console.log('✅ Banco atualizado!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}
