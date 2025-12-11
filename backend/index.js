import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Supabase ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Função para corrigir caminho das imagens no Vercel
function corrigirImagem(url) {
  if (!url) return "";
  return `/trossbe-frontend-main${url}`;
}

// =========================
// 🔥 GET PRODUTOS
// =========================
app.get("/produtos", async (req, res) => {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }

  // Corrigir URLs das imagens para funcionar no Vercel
  const produtos = data.map(p => ({
    ...p,
    imagem_url: corrigirImagem(p.imagem_url)
  }));

  res.json(produtos);
});

// =========================
// 🔥 CHECKOUT
// =========================
app.post("/checkout", async (req, res) => {
  const { customer_name, customer_email, items, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Nenhum item enviado" });
  }

  // Criar pedido
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .insert([
      {
        customer_name,
        customer_email,
        total
      }
    ])
    .select()
    .single();

  if (errPedido) {
    console.log(errPedido);
    return res.status(500).json({ error: "Erro ao criar pedido" });
  }

  // Criar itens
  const itensInsert = items.map(i => ({
    pedido_id: pedido.id,
    produto_id: i.produto_id,
    quantidade: i.quantidade,
    preco_unitario: i.preco_unitario
  }));

  const { error: errItens } = await supabase
    .from("pedido_itens")
    .insert(itensInsert);

  if (errItens) {
    console.log(errItens);
    return res.status(500).json({ error: "Erro ao inserir itens" });
  }

  res.json({ success: true, pedido });
});

// =========================
// SERVIDOR
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
