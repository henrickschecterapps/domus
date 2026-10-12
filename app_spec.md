

Markdown  
\# Product Specification Document: Domus (Smart Household Management PWA)

\#\# 1\. Project Overview & Architecture  
\* **\*\*Product Name:\*\*** Domus  
\* **\*\*Target Platforms:\*\*** Mobile-first Responsive Web App (PWA) installable on iOS and Android.  
\* **\*\*Stack:\*\*** React 18+ (Vite), Tailwind CSS, Lucide React (icons), Firebase (Cloud Firestore with offline persistence, Firebase Authentication, Firebase Hosting).  
\* **\*\*State Management & Data Sync:\*\*** React Context / Zustand \+ Firestore onSnapshot listeners with Optimistic UI updates.

\---

\#\# 2\. Firestore Data Models

\#\#\# 2.1. Collection: \`houses\`  
\`\`\`typescript  
interface House {  
  id: string;  
  name: string;  
  inviteCode: string;  
  createdAt: number;  
  houseScore: number; // 0 to 100, recalculated dynamically  
  members: {  
    userId: string;  
    displayName: string;  
    role: "admin" | "member";  
    weeklyXP: number;  
    totalXP: number;  
  }\[\];  
}

### **2.2. Collection: rooms**

Sub-collection under houses/{houseId}/rooms.

TypeScript  
interface Room {  
  id: string; // e.g. "sala", "cozinha"  
  name: string; // Display name  
  order: number;  
  statusScore: number; // 0 to 100 (100 \= 100% clean)  
  statusLevel: "clean" | "warning" | "urgent"; // green, yellow, red  
  lastCleanedAt: number | null; // Timestamp of the latest completed task in room  
}

### **2.3. Collection: chores**

Sub-collection under houses/{houseId}/chores.

TypeScript  
interface Chore {  
  id: string;  
  roomId: string; // references room.id  
  title: string;  
  frequencyDays: number; // Interval in days (e.g. 3, 7, 15, 30\)  
  lastCompletedAt: number | null; // Epoch timestamp  
  lastCompletedBy: {  
    userId: string;  
    displayName: string;  
  } | null;  
  assignedTo: string | null; // userId or null  
  xpReward: number; // Base XP (e.g. 10 to 50\)  
  urgencyScore: number; // Calculated dynamic value (0.0 to 2.0+)  
  statusLevel: "clean" | "warning" | "urgent";  
}

### **2.4. Collection: chore\_history**

Audit log and anti-exploit tracking.

TypeScript  
interface ChoreLog {  
  id: string;  
  choreId: string;  
  roomId: string;  
  completedBy: string;  
  completedAt: number;  
  xpEarned: number;  
}

### **2.5. Collection: pets**

Sub-collection under houses/{houseId}/pets.

TypeScript  
interface Pet {  
  id: string;  
  name: string; // e.g. "Bayonetta"  
  species: "cat" | "dog" | "other";  
  photoUrl?: string;  
  litterBox: {  
    lastScoopedAt: number; // Daily scoop timestamp  
    lastFullChangeAt: number; // Full sand replacement timestamp  
    scoopIntervalHours: number; // Default 24h  
    fullChangeIntervalDays: number; // Default 7-10 days  
  };  
  feeding: {  
    foodBrand: string;  
    packageWeightGrams: number;  
    currentStockGrams: number;  
    dailyConsumptionGrams: number;  
    sachetStockCount: number;  
    minStockAlertThreshold: number; // Trigger shopping item  
  };  
  medicalRecords: {  
    id: string;  
    type: "vaccine" | "deworming" | "flea\_treatment" | "medication";  
    name: string;  
    administeredAt: number;  
    nextDueDate: number;  
  }\[\];  
}

### **2.6. Collection: pantry\_items & shopping\_list**

TypeScript  
interface PantryItem {  
  id: string;  
  name: string;  
  category: "mercearia" | "limpeza" | "pet" | "hortifruti" | "refrigerados";  
  currentQuantity: number;  
  minQuantity: number;  
  unit: "un" | "kg" | "l" | "pacote";  
  autoAddToShopping: boolean;  
}

interface ShoppingItem {  
  id: string;  
  name: string;  
  category: string;  
  quantity: number;  
  unit: string;  
  isBought: boolean;  
  addedBy: string;  
  fromPantryId?: string;  
}

### **2.7. Collection: expenses**

TypeScript  
interface Expense {  
  id: string;  
  description: string;  
  amount: number; // In cents or BRL floating point  
  paidByUserId: string;  
  splitAmongUserIds: string\[\];  
  date: number;  
  category: "supermercado" | "casa" | "pet" | "contas";  
  receiptUrl?: string;  
  isSettled: boolean;  
}

## **3\. Seeded Rooms & Standard Chore Definitions**

The application must initialize with exactly 9 default rooms per house:

> 1. **Sala:** Aspirar tapete/sofá (7 dias), Tirar pó das superfícies e TV (7 dias), Passar pano no piso (5 dias).  
> 2. **Cozinha:** Limpeza profunda de fogão/cooktop (3 dias), Limpar bancadas e pia (1 dia), Passar pano no chão (3 dias), Limpeza interna da geladeira (30 dias).  
> 3. **Área de Serviço:** Limpeza do tanque e máquinas (15 dias), Varrer e lavar piso (7 dias), Organizar produtos de limpeza (15 dias).  
> 4. **Quarto de Hóspedes:** Trocar roupa de cama (15 dias), Tirar pó e ventilar (15 dias), Passar pano no piso (15 dias).  
> 5. **Escritório:** Limpar mesas e monitores (5 dias), Aspirar cadeira e chão (5 dias), Organizar cabos e papelada (15 dias).  
> 6. **Suíte:** Trocar lençóis e fronhas (7 dias), Varrer e passar pano no piso (5 dias), Tirar pó dos armários (10 dias).  
> 7. **Banheiro Social:** Lavar vaso sanitário e pia (4 dias), Lavar box e ralo (7 dias), Trocar toalhas de rosto/piso (3 dias).  
> 8. **Banheiro Suíte:** Lavar vaso sanitário e pia (4 dias), Limpeza pesada do box (7 dias), Trocar toalhas (3 dias).  
> 9. **Quarto DCE:** Varrer e espanar pó (7 dias), Passar pano no piso (10 dias), Organizar armários (30 dias).

## **4\. Core Business Logic & Algorithms**

### **4.1. Cleaning Urgency & Degradation Formula**

For every chore $i$:

$$\Delta t=CurrentTimestamp-lastCompletedAt$$

$$UrgencyRatio(R)=\frac{\Delta t}{frequencyDays\times 86400000}$$

* **State Calculation:**  
  * If $R<0.60$: **Clean** (Status: clean, Color: Tailwind emerald-500)  
  * If $0.60\leq R\leq 1.00$: **Warning** (Status: warning, Color: Tailwind amber-500)  
  * If $R>1.00$: **Urgent/Overdue** (Status: urgent, Color: Tailwind rose-500)

**Room Health Score (${S}_{room}$):**

$${S}_{room}=\max\limits_{}\left({0,100-\left({\frac{\sum\limits_{}^{}\max\limits_{}(0,{R}_{i}-0.5)}{N}\times 100}\right)}\right)$$

*   
  Where $N$ is the total number of chores in that room.

**House Global Score (${S}_{house}$):**

$${S}_{house}=\frac{\sum\limits_{j=1}^{9}{S}_{roo{m}_{j}}}{9}$$

* 

### **4.2. Timestamp Humanization Engine**

The UI must format lastCompletedAt relative to the current clock:

* $0hours\leq \Delta t<24hours$: "Hoje" or "Há poucas horas"  
* $24hours\leq \Delta t<48hours$: "Ontem"  
* $\Delta t\geq 48hours$: "Há " \+ Math.floor(\\Delta t / 86400000\) \+ " dias"  
* null: "Nunca limpo"

### **4.3. Anti-Exploit Gamification Rules**

* **Cooldown Period:** A chore cannot be completed by the same or another user if $\Delta t<6hours$ (displays disabled button with *"Já executado recentemente"*).  
* **XP Multiplier:**  
  * Standard completion ($R\leq 1.0$): Awards $1.0\times xpReward$.  
  * Overdue save ($R>1.0$): Awards $1.5\times xpReward$ (incentivizes tackling urgent neglected tasks).  
* **Weekly Reset:** Leaderboard stores weeklyXP which resets every Sunday at 23:59:59. totalXP remains cumulative.

### **4.4. Pet Routine Tracking (Bayonetta / Cat Module)**

* **Caixa de Areia (Litter Box):**  
  * Tracking of 2 independent states: *Limpeza diária (recolher dejetos)* and *Troca completa da areia sanitária*.  
  * If $(now-lastScoopedAt)>24hours$, inject an urgent banner on the dashboard.  
* **Consumo de Ração / Sachês:**  
  * Auto-decrement: $currentStockGrams-dailyConsumptionGrams$ computed daily.  
  * Estimated days remaining: $\frac{currentStockGrams}{dailyConsumptionGrams}$.  
  * When remaining days $\leq 3$ or stock $\leq minStockAlertThreshold$, display a CTA button: "Adicionar ração à lista de compras" which writes an entry into shopping\_list.

### **4.5. Financial Settlement Matrix (Fair Share Split)**

For any set of active members, the net balance between any two members $A$ and $B$ is:

$$Net(A)=TotalPaid(A)-FairShare(A)$$

*   
* Simplifies balances into direct repayment prompts (e.g., *"Pedro deve R\$ 45,50 para Maria"*).

## **5\. UI Layout & View Hierarchy**

### **5.1. Global Shell**

* **Bottom Navigation Bar (5 tabs):**  
  1. Dashboard (Home icon)  
  2. Limpeza (Sparkles icon)  
  3. Pet (Cat/Paw icon)  
  4. Despensa & Compras (ShoppingCart icon)  
  5. Finanças (DollarSign/Wallet icon)

### **5.2. Screen: Dashboard**

* **Top Bar:** House Name \+ Global Score circular progress ring (S\_house).  
* **Quick Clean Widget:** Top 3 most urgent chores across all 9 rooms ($R>1.0$). One-tap completion directly from the dashboard.  
* **Pet Status Pill:** Alert pill showing litter box status ("Caixa de areia limpa hoje" or "Atenção: Trocar areia").  
* **Weekly Leaderboard Snippet:** Avatars with XP progress bars and current rank.

### **5.3. Screen: Limpeza (Rooms Grid)**

* **Header:** Summary stats (X limpos, Y atenção, Z urgentes).  
* **Grid 3x3 / 2xN:** Cards for all 9 rooms with:  
  * Room Name  
  * Status Badge (Limpo, Atenção, Urgente) with respective color background.  
  * String: "Última limpeza: \[Timestamp Humanizado\]"  
  * Mini Progress Bar indicating statusScore.  
* **Room Detail View (Modal or Route):**  
  * Displays list of chores for that specific room.  
  * Each chore has: Title, interval ("A cada X dias"), last completion info, XP value, and "Concluir" action button with optimistic confetti animation.

### **5.4. Screen: Pet**

* Pet profile card with photo, age, and breed.  
* Action buttons: "Recolhi a areia agora" and "Troquei toda a areia".  
* Stock tracking cards for Dry Food (Ração Seca) and Wet Food (Sachês).  
* Medical log timeline (Vacinas e Vermífugos) with "Próxima dose" tag.

### **5.5. Screen: Despensa & Compras**

* Tabbed toggle: Despensa (Estoque) vs Lista de Compras.  
* Lista de Compras: Items grouped by Category with checkboxes. Checking an item strikes it through instantly (Optimistic UI) and offers a button "Mover para despensa".

### **5.6. Screen: Finanças**

* Net balance balance card: "Você deve" or "Devem a você".  
* Quick expense creation modal: Valor, Descrição, Quem pagou, Divisão (50/50 padrão ou personalizada).  
* Recent expense transaction feed.

## **6\. Offline Persistence & PWA Requirements**

* Configure Firestore with enableIndexedDbPersistence(db).  
* Provide a Web App Manifest (manifest.json):  
  * display: "standalone"  
  * theme\_color: "\#0F172A"  
  * background\_color: "\#0F172A"  
  * Standard app icons (192x192, 512x512).  
* Register a Service Worker via vite-plugin-pwa for offline asset caching.

## **7\. Implementation Roadmap for Antigravity Agent**

Phase 1: Foundation  
├── Initialize Vite \+ React \+ Tailwind \+ Lucide React  
├── Configure Firebase Auth \+ Firestore offline persistence  
└── Seed 9 default rooms & chore templates upon new house creation

Phase 2: Cleaning Engine  
├── Implement urgency math & room score calculation utilities  
├── Build RoomCard and ChoreList components with optimistic state  
└── Create anti-exploit cooldown checks & XP allocation

Phase 3: Pet & Pantry Modules  
├── Build Pet module with dual litter-box timestamps and food countdown  
└── Build Pantry/Shopping toggle with optimistic sync and category filters

Phase 4: Finance & Dashboard Integration  
├── Implement expense splitting calculation logic  
├── Unify components into the master Dashboard (Quick Clean, Global Score)  
└── Configure manifest.json and PWA Service Worker  
