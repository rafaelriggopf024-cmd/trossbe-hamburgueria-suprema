// backend/index.js
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || "https://amxzaxhdnabtgkitkejq.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteHpheGhkbmFidGdraXRrZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjM1ODQsImV4cCI6MjA4MDQzOTU4NH0.wzoy4nARS2yRj-uZcHJu64AClxGdJfAiyiwDZAM4uyw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// rota de teste simples
app.get("/", (req, res) => res.send({ ok: true }));

// listar produtos (ordenado)
app.get("/produtos", async (req, res) => {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("id", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// criar produto (se precisar)
app.post("/produtos", async (req, res) => {
  try {
    const { nome, descricao, preco, imagem_url } = req.body;
    const { data, error } = await supabase
      .from("produtos")
      .insert([{ nome, descricao, preco, imagem_url }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/*
  ROTA /checkout
  Recebe:
  {
    customer_name: "...",
    customer_email: "...",
    items: [
      { produto_id: 1, quantidade: 2, preco_unitario: 22.9 },
      ...
    ],
    total: 100.5
  }
*/
app.post("/checkout", async (req, res) => {
  try {
    const { customer_name, customer_email, items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    // 1) Cria o pedido e captura o id
    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([
        {
          customer_name: customer_name || "Cliente",
          customer_email: customer_email || null,
          total: total || 0
        }
      ])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    const pedidoId = pedidoData.id;

    // 2) Prepara os itens com pedido_id
    const itensToInsert = items.map(i => ({
      pedido_id: pedidoId,
      produto_id: i.produto_id,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario
    }));

    // 3) Insere os itens
    const { data: itensData, error: itensError } = await supabase
      .from("pedido_itens")
      .insert(itensToInsert);

    if (itensError) {
      // opcional: deletar o pedido se itens falharem
      await supabase.from("pedidos").delete().eq("id", pedidoId);
      throw itensError;
    }

    // 4) Retorna sucesso com info do pedido
    res.status(201).json({
      pedido: pedidoData,
      itens: itensData
    });

  } catch (error) {
    res.status(500).json({ error: error.message || error });
  }
});

// rota para listar pedidos com itens (útil para admin/debug)
app.get("/pedidos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        customer_name,
        customer_email,
        total,
        created_at,
        pedido_itens (
          id,
          produto_id,
          quantidade,
          preco_unitario,
          created_at,
          produtos ( nome, preco, imagem_url )
        )
      `)
      .order("id", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
