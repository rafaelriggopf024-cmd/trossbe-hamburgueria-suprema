import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Conexão com o Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Lista de produtos para inserir
const produtos = [
  {
    nome: "Burger Clássico",
    descricao: "Pão, carne 120g, queijo e maionese especial.",
    preco: 22.90,
    imagem_url: "/trossbe-frontend-main/img/hamburguer_cardapio.png"
  },
  {
    nome: "X-Bacon",
    descricao: "Hambúrguer artesanal com bacon crocante.",
    preco: 28.50,
  imagem_url: "/trossbe-frontend-main/img/costela.png"
  },
  {
    nome: "Smash Duplo",
    descricao: "Dois steaks smash com queijo e molho da casa.",
    preco: 32.00,
 imagem_url: "/trossbe-frontend-main/img/trossbe.png"
  },
  {
    nome: "Cheddar Melt",
    descricao: "Carne 150g com cheddar cremoso e cebola caramelizada.",
    preco: 29.90,
    imagem_url: "/trossbe-frontend-main/img/picante.png"

  },
  {
    nome: "Veggie Burger",
    descricao: "Hambúrguer vegetal com salada fresca e molho vegano.",
    preco: 24.90,
 imagem_url: "/trossbe-frontend-main/img/veggie.png"
  }
];

// Executar o seed
async function seed() {
  try {
    console.log("Limpando tabela 'produtos'...");

    // Apagar tudo da tabela (opcional)
    await supabase.from("produtos").delete().neq("id", 0);

    console.log("Inserindo produtos...");

    const { data, error } = await supabase
      .from("produtos")
      .insert(produtos);

    if (error) {
      console.error("Erro ao inserir produtos:", error);
      return;
    }

    console.log("Produtos inseridos com sucesso:");
    console.log(data);

  } catch (e) {
    console.error("Erro inesperado:", e);
  }
}

seed();
