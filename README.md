# Domus - Smart Household Management PWA 🏡✨

Aplicativo Progressivo (PWA) para gerenciamento doméstico inteligente, rotinas de limpeza, cuidados com pets (Módulo Bayonetta), despensa & lista de compras e divisão financeira justa de despesas.

Construído estritamente de acordo com a especificação em [`app_spec.md`](./app_spec.md).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ (testado e validado em Node 26)
- npm ou yarn

### 1. Iniciar em modo de Desenvolvimento
```bash
npm run dev
```
O Vite iniciará o servidor local (geralmente em `http://localhost:5173`). Abra no navegador ou escaneie no celular na mesma rede local para testar a experiência PWA mobile.

### 2. Gerar Build de Produção
```bash
npm run build
```

### 3. Visualizar Build Localmente
```bash
npm run preview
```

---

## 🛠️ Tecnologias e Arquitetura

- **Frontend Core:** React 18+ / React 19 com TypeScript e Vite.
- **Estilização:** Tailwind CSS v3 com paleta Dark Slate (`#0F172A`) personalizada e safe-area padding para dispositivos móveis iOS e Android.
- **Ícones:** Lucide React.
- **Feedback & Animações:** Canvas Confetti otimista para conclusão de tarefas.
- **PWA & Offline:** `vite-plugin-pwa` configurado com Service Worker e manifesto autônomo (standalone).
- **Backend & Persistência:**
  - Firebase Cloud Firestore preparado com persistência offline (`persistentLocalCache` via IndexedDB) e Firebase Auth.
  - Armazenamento local autônomo (localStorage e estado reativo) para funcionamento imediato sem necessidade prévia de chaves de API.

---

## 📐 Fórmulas e Regras de Negócio Implementadas

### 1. Motor de Limpeza & Degradação
- **Razão de Urgência ($R$):**
  $$R = \frac{\Delta t}{\text{frequência em dias} \times 86.400.000}$$
  - $R < 0.60$: **Limpo** (Verde / Tailwind `emerald-500`)
  - $0.60 \leq R \leq 1.00$: **Atenção** (Amarelo / Tailwind `amber-500`)
  - $R > 1.00$: **Urgente / Atrasada** (Vermelho / Tailwind `rose-500`)

- **Score de Saúde do Cômodo ($S_{room}$):**
  $$S_{room} = \max\left(0, 100 - \left( \frac{\sum \max(0, R_i - 0.5)}{N} \times 100 \right)\right)$$

- **Score Global da Casa ($S_{house}$):**
  $$S_{house} = \frac{\sum_{j=1}^{9} S_{room_j}}{9}$$

- **Gamificação Anti-Exploit:**
  - **Cooldown de 6 horas:** Uma tarefa recém-concluída fica em pausa durante 6 horas para impedir exploração contínua de pontos.
  - **Multiplicador de XP:** Conclusão de tarefas atrasadas ($R > 1.0$) concede **1.5x XP** como recompensa por resgatar tarefas negligenciadas.
  - **Leaderboard Semanal:** Ranking semanal de XP com suporte a reset aos domingos às 23:59:59.

### 2. Módulo Pet (Bayonetta)
- **Caixa de Areia Dual:**
  - Monitoramento de 2 ciclos independentes: *Recolhimento diário de dejetos* (alerta se $> 24$h) e *Troca total de areia* (a cada 7-10 dias).
- **Estoque & Consumo Diário:**
  - Contagem regressiva de ração seca e sachês.
  - Se faltar $\leq 3$ dias ou estoque $\leq$ limite mínimo, o app oferece o botão direto de compra, adicionando o item à Lista de Compras.
- **Controle Veterinário:** Histórico com alertas de "Próxima dose" para vacinas, vermífugos e antipulgas.

### 3. Despensa & Lista de Compras
- Alternância entre **Estoque da Despensa** e **Lista de Compras**.
- Adição automática à lista de compras quando o estoque de um item atinge a quantidade mínima (`minQuantity`).
- Interação otimista de compra com strike-through e botão para mover o item diretamente para a despensa.

### 4. Matriz Financeira de Divisão Justa
- Cálculo automático de $Net(A) = TotalPago(A) - CotaJusta(A)$.
- Simplificação direta de liquidação de dívidas (ex: *"Henrique deve R$ 45,50 para Mariana"*).

---

## 9 Cômodos Pré-Configurados
1. **Sala** (Aspirar sofá, Tirar pó de superfícies/TV, Passar pano)
2. **Cozinha** (Limpeza de fogão, Limpar bancadas/pia, Passar pano, Geladeira)
3. **Área de Serviço** (Limpeza de tanque/máquinas, Varrer/lavar piso, Produtos de limpeza)
4. **Quarto de Hóspedes** (Trocar roupa de cama, Tirar pó/ventilar, Passar pano)
5. **Escritório** (Limpar mesas/monitores, Aspirar cadeira/chão, Cabos/papelada)
6. **Suíte** (Lençóis/fronhas, Varrer/passar pano, Tirar pó dos armários)
7. **Banheiro Social** (Vaso/pia, Box/ralo, Toalhas de rosto/piso)
8. **Banheiro Suíte** (Vaso/pia, Limpeza pesada do box, Trocar toalhas)
9. **Quarto DCE** (Varrer/espanar pó, Passar pano no piso, Armários)
