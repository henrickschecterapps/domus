import { Chore, Expense, House, HouseEvent, HouseMember, PantryItem, Pet, Room, ShoppingItem } from '../types';

export const DEFAULT_MEMBERS: HouseMember[] = [
  {
    userId: 'user_1',
    displayName: 'Henrique',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    weeklyXP: 240,
    totalXP: 1420,
    streakDays: 5,
    levelTitle: 'Guardião da Casa',
    phone: '(11) 98765-4321',
    pixKeyType: 'email',
    pixKey: 'henrique@domus.app',
    assignedRoomId: 'suite',
    soundEnabled: true,
    vibrationEnabled: true,
  },
  {
    userId: 'user_2',
    displayName: 'Mariana',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    weeklyXP: 180,
    totalXP: 1290,
    streakDays: 4,
    levelTitle: 'Mestre da Harmonia',
    phone: '(11) 91234-5678',
    pixKeyType: 'cpf',
    pixKey: '123.456.789-00',
    assignedRoomId: 'escritorio',
    soundEnabled: true,
    vibrationEnabled: true,
  },
];

export const DEFAULT_HOUSE: House = {
  id: 'house_domus_1',
  name: 'Casa Principal',
  inviteCode: 'DOMUS-7782',
  createdAt: Date.now() - 30 * 86_400_000,
  houseScore: 84,
  members: DEFAULT_MEMBERS,
  address: 'Rua Harmonia, 412 - Pinheiros, SP',
  weeklyGoalXP: 500,
  rulesNotes: 'Manter pia limpa após uso. Silêncio após 22h. Cuidar com carinho dos pets.',
  wifiSsid: 'Domus Sanctuary 5G',
  wifiPassword: 'domus_bem_estar_2026',
  emergencyContacts: [
    { id: 'c1', name: 'Portaria 24h', category: 'portaria', phone: '(11) 3210-0001', notes: 'Ramal 101' },
    { id: 'c2', name: 'Roberto (Síndico)', category: 'sindico', phone: '(11) 99887-1122', notes: 'Horário comercial' },
    { id: 'c3', name: 'Carlos Encanador', category: 'encanador', phone: '(11) 97766-3344', notes: 'Atende emergências' },
    { id: 'c4', name: 'Chaveiro Central', category: 'chaveiro', phone: '(11) 96655-2211', notes: 'Plantão 24 horas' },
  ],
  rewards: [
    { id: 'rew1', title: 'Café na Cama no Domingo', description: 'Quem fizer mais XP na semana tem direito a café especial servido pelos moradores.', requiredXP: 300 },
    { id: 'rew2', title: 'Folga da Louça no Fim de Semana', description: 'Isenção completa de lavar louça no sábado e domingo.', requiredXP: 450 },
    { id: 'rew3', title: 'Escolha do Filme da Sexta', description: 'Direito a escolher a sessão de cinema com pipoca da casa.', requiredXP: 200 },
  ],
  notes: [
    { id: 'n1', authorId: 'user_2', authorName: 'Mariana', content: 'Comprei morangos frescos na feira! Estão na gaveta da geladeira para quem quiser. 🍓', color: 'yellow', isPinned: true, createdAt: Date.now() - 3 * 3600 * 1000 },
    { id: 'n2', authorId: 'user_1', authorName: 'Henrique', content: 'Manutenção da rede elétrica do condomínio marcada para sexta às 10h. ⚡', color: 'blue', isPinned: false, createdAt: Date.now() - 12 * 3600 * 1000 },
    { id: 'n3', authorId: 'user_1', authorName: 'Henrique', content: 'Lembrar de encomendar os sachês gastro da Bayonetta que estão acabando.', color: 'pink', isPinned: false, createdAt: Date.now() - 24 * 3600 * 1000 },
  ],
  budget: {
    monthlyTarget: 3800,
    alertThresholdPercent: 80,
    categoryTargets: {
      supermercado: 1500,
      contas: 1200,
      casa: 600,
      pet: 500,
    },
  },
};

export function createInitialRooms(): Room[] {
  return [
    { id: 'sala', name: 'Sala', order: 1, statusScore: 88, statusLevel: 'clean', lastCleanedAt: Date.now() - 24 * 3600 * 1000, icon: 'Sofa' },
    { id: 'cozinha', name: 'Cozinha', order: 2, statusScore: 45, statusLevel: 'urgent', lastCleanedAt: Date.now() - 4 * 86_400_000, icon: 'UtensilsCrossed' },
    { id: 'area_servico', name: 'Área de Serviço', order: 3, statusScore: 92, statusLevel: 'clean', lastCleanedAt: Date.now() - 2 * 86_400_000, icon: 'Shirt' },
    { id: 'quarto_hospedes', name: 'Quarto de Hóspedes', order: 4, statusScore: 75, statusLevel: 'warning', lastCleanedAt: Date.now() - 14 * 86_400_000, icon: 'BedDouble' },
    { id: 'escritorio', name: 'Escritório', order: 5, statusScore: 90, statusLevel: 'clean', lastCleanedAt: Date.now() - 1 * 86_400_000, icon: 'Monitor' },
    { id: 'suite', name: 'Suíte', order: 6, statusScore: 82, statusLevel: 'clean', lastCleanedAt: Date.now() - 3 * 86_400_000, icon: 'Bed' },
    { id: 'banheiro_social', name: 'Banheiro Social', order: 7, statusScore: 55, statusLevel: 'warning', lastCleanedAt: Date.now() - 5 * 86_400_000, icon: 'Bath' },
    { id: 'banheiro_suite', name: 'Banheiro Suíte', order: 8, statusScore: 85, statusLevel: 'clean', lastCleanedAt: Date.now() - 2 * 86_400_000, icon: 'ShowerHead' },
    { id: 'quarto_dce', name: 'Quarto DCE', order: 9, statusScore: 70, statusLevel: 'warning', lastCleanedAt: Date.now() - 8 * 86_400_000, icon: 'DoorClosed' },
  ];
}

export function createInitialChores(): Chore[] {
  const now = Date.now();
  const day = 86_400_000;

  return [
    // 1. Sala
    {
      id: 'chore_sala_1',
      roomId: 'sala',
      title: 'Aspirar tapete e sofá',
      frequencyDays: 7,
      lastCompletedAt: now - 3 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 30,
      urgencyScore: 0.43,
      statusLevel: 'clean',
    },
    {
      id: 'chore_sala_2',
      roomId: 'sala',
      title: 'Tirar pó das superfícies e TV',
      frequencyDays: 7,
      lastCompletedAt: now - 5 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.71,
      statusLevel: 'warning',
    },
    {
      id: 'chore_sala_3',
      roomId: 'sala',
      title: 'Passar pano no piso',
      frequencyDays: 5,
      lastCompletedAt: now - 1 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.20,
      statusLevel: 'clean',
    },

    // 2. Cozinha
    {
      id: 'chore_cozinha_1',
      roomId: 'cozinha',
      title: 'Limpeza profunda de fogão/cooktop',
      frequencyDays: 3,
      lastCompletedAt: now - 4.5 * day, // Urgent! Overdue
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 35,
      urgencyScore: 1.5,
      statusLevel: 'urgent',
    },
    {
      id: 'chore_cozinha_2',
      roomId: 'cozinha',
      title: 'Limpar bancadas e pia',
      frequencyDays: 1,
      lastCompletedAt: now - 28 * 3600 * 1000, // 28h ago -> Urgent!
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 15,
      urgencyScore: 1.16,
      statusLevel: 'urgent',
    },
    {
      id: 'chore_cozinha_3',
      roomId: 'cozinha',
      title: 'Passar pano no chão da cozinha',
      frequencyDays: 3,
      lastCompletedAt: now - 2.5 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.83,
      statusLevel: 'warning',
    },
    {
      id: 'chore_cozinha_4',
      roomId: 'cozinha',
      title: 'Limpeza interna da geladeira',
      frequencyDays: 30,
      lastCompletedAt: now - 12 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 50,
      urgencyScore: 0.40,
      statusLevel: 'clean',
    },

    // 3. Área de Serviço
    {
      id: 'chore_area_1',
      roomId: 'area_servico',
      title: 'Limpeza do tanque e máquinas',
      frequencyDays: 15,
      lastCompletedAt: now - 6 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 30,
      urgencyScore: 0.40,
      statusLevel: 'clean',
    },
    {
      id: 'chore_area_2',
      roomId: 'area_servico',
      title: 'Varrer e lavar piso',
      frequencyDays: 7,
      lastCompletedAt: now - 2 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.28,
      statusLevel: 'clean',
    },
    {
      id: 'chore_area_3',
      roomId: 'area_servico',
      title: 'Organizar produtos de limpeza',
      frequencyDays: 15,
      lastCompletedAt: now - 11 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.73,
      statusLevel: 'warning',
    },

    // 4. Quarto de Hóspedes
    {
      id: 'chore_hospedes_1',
      roomId: 'quarto_hospedes',
      title: 'Trocar roupa de cama',
      frequencyDays: 15,
      lastCompletedAt: now - 14 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.93,
      statusLevel: 'warning',
    },
    {
      id: 'chore_hospedes_2',
      roomId: 'quarto_hospedes',
      title: 'Tirar pó e ventilar quarto',
      frequencyDays: 15,
      lastCompletedAt: now - 8 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 15,
      urgencyScore: 0.53,
      statusLevel: 'clean',
    },
    {
      id: 'chore_hospedes_3',
      roomId: 'quarto_hospedes',
      title: 'Passar pano no piso',
      frequencyDays: 15,
      lastCompletedAt: now - 10 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.66,
      statusLevel: 'warning',
    },

    // 5. Escritório
    {
      id: 'chore_escritorio_1',
      roomId: 'escritorio',
      title: 'Limpar mesas e monitores',
      frequencyDays: 5,
      lastCompletedAt: now - 1 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.20,
      statusLevel: 'clean',
    },
    {
      id: 'chore_escritorio_2',
      roomId: 'escritorio',
      title: 'Aspirar cadeira e chão',
      frequencyDays: 5,
      lastCompletedAt: now - 2 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.40,
      statusLevel: 'clean',
    },
    {
      id: 'chore_escritorio_3',
      roomId: 'escritorio',
      title: 'Organizar cabos e papelada',
      frequencyDays: 15,
      lastCompletedAt: now - 4 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.26,
      statusLevel: 'clean',
    },

    // 6. Suíte
    {
      id: 'chore_suite_1',
      roomId: 'suite',
      title: 'Trocar lençóis e fronhas',
      frequencyDays: 7,
      lastCompletedAt: now - 3 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.42,
      statusLevel: 'clean',
    },
    {
      id: 'chore_suite_2',
      roomId: 'suite',
      title: 'Varrer e passar pano no piso',
      frequencyDays: 5,
      lastCompletedAt: now - 2 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.40,
      statusLevel: 'clean',
    },
    {
      id: 'chore_suite_3',
      roomId: 'suite',
      title: 'Tirar pó dos armários',
      frequencyDays: 10,
      lastCompletedAt: now - 8 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.80,
      statusLevel: 'warning',
    },

    // 7. Banheiro Social
    {
      id: 'chore_banheiro_soc_1',
      roomId: 'banheiro_social',
      title: 'Lavar vaso sanitário e pia',
      frequencyDays: 4,
      lastCompletedAt: now - 4.2 * day, // Urgent!
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 35,
      urgencyScore: 1.05,
      statusLevel: 'urgent',
    },
    {
      id: 'chore_banheiro_soc_2',
      roomId: 'banheiro_social',
      title: 'Lavar box e ralo',
      frequencyDays: 7,
      lastCompletedAt: now - 5 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 40,
      urgencyScore: 0.71,
      statusLevel: 'warning',
    },
    {
      id: 'chore_banheiro_soc_3',
      roomId: 'banheiro_social',
      title: 'Trocar toalhas de rosto e piso',
      frequencyDays: 3,
      lastCompletedAt: now - 1 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 15,
      urgencyScore: 0.33,
      statusLevel: 'clean',
    },

    // 8. Banheiro Suíte
    {
      id: 'chore_banheiro_suite_1',
      roomId: 'banheiro_suite',
      title: 'Lavar vaso sanitário e pia',
      frequencyDays: 4,
      lastCompletedAt: now - 2 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 35,
      urgencyScore: 0.50,
      statusLevel: 'clean',
    },
    {
      id: 'chore_banheiro_suite_2',
      roomId: 'banheiro_suite',
      title: 'Limpeza pesada do box',
      frequencyDays: 7,
      lastCompletedAt: now - 3 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 40,
      urgencyScore: 0.42,
      statusLevel: 'clean',
    },
    {
      id: 'chore_banheiro_suite_3',
      roomId: 'banheiro_suite',
      title: 'Trocar toalhas',
      frequencyDays: 3,
      lastCompletedAt: now - 2 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 15,
      urgencyScore: 0.66,
      statusLevel: 'warning',
    },

    // 9. Quarto DCE
    {
      id: 'chore_dce_1',
      roomId: 'quarto_dce',
      title: 'Varrer e espanar pó',
      frequencyDays: 7,
      lastCompletedAt: now - 6 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 20,
      urgencyScore: 0.85,
      statusLevel: 'warning',
    },
    {
      id: 'chore_dce_2',
      roomId: 'quarto_dce',
      title: 'Passar pano no piso',
      frequencyDays: 10,
      lastCompletedAt: now - 7 * day,
      lastCompletedBy: { userId: 'user_2', displayName: 'Mariana' },
      assignedTo: null,
      xpReward: 25,
      urgencyScore: 0.70,
      statusLevel: 'warning',
    },
    {
      id: 'chore_dce_3',
      roomId: 'quarto_dce',
      title: 'Organizar armários',
      frequencyDays: 30,
      lastCompletedAt: now - 15 * day,
      lastCompletedBy: { userId: 'user_1', displayName: 'Henrique' },
      assignedTo: null,
      xpReward: 35,
      urgencyScore: 0.50,
      statusLevel: 'clean',
    },
  ];
}

export function createInitialPets(): Pet[] {
  const now = Date.now();
  const day = 86_400_000;

  return [
    {
      id: 'pet_bayonetta',
      name: 'Bayonetta',
      species: 'cat',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
      breed: 'SRD Pelagem Longa',
      birthDate: '2023-04-10',
      weightKg: 4.2,
      litterBox: {
        lastScoopedAt: now - 14 * 3600 * 1000, // 14 hours ago
        lastFullChangeAt: now - 6 * day, // 6 days ago
        scoopIntervalHours: 24,
        fullChangeIntervalDays: 8,
      },
      feeding: {
        foodBrand: 'PremieR Gatos Castrados',
        packageWeightGrams: 7500,
        currentStockGrams: 450, // Low stock!
        dailyConsumptionGrams: 65,
        sachetStockCount: 2, // Low sachet count!
        minStockAlertThreshold: 500,
      },
      medicalRecords: [
        {
          id: 'med_b1',
          type: 'vaccine',
          name: 'Vacina V5 (Quíntupla Felina)',
          administeredAt: now - 180 * day,
          nextDueDate: now + 185 * day,
        },
        {
          id: 'med_b2',
          type: 'deworming',
          name: 'Drontal Gatos Spot-On',
          administeredAt: now - 60 * day,
          nextDueDate: now + 30 * day,
        },
        {
          id: 'med_b3',
          type: 'flea_treatment',
          name: 'Revolution Plus Antipulgas',
          administeredAt: now - 20 * day,
          nextDueDate: now + 10 * day,
        },
      ],
      careLogs: [
        {
          id: 'log_b1',
          petId: 'pet_bayonetta',
          actionType: 'scoop',
          title: 'Recolhimento da caixa de areia',
          performedByUserId: 'user_2',
          performedByName: 'Mariana',
          performedAt: now - 14 * 3600 * 1000,
          xpEarned: 10,
        },
        {
          id: 'log_b2',
          petId: 'pet_bayonetta',
          actionType: 'sachet',
          title: 'Ofereceu sachê úmido Whiskas',
          performedByUserId: 'user_1',
          performedByName: 'Henrique',
          performedAt: now - 28 * 3600 * 1000,
          xpEarned: 5,
        },
      ],
      vetContact: {
        name: 'Dra. Camila Castro',
        phone: '(11) 98877-6655',
        clinicName: 'Clínica Felina Gatos & Cia 24h',
        address: 'Av. Rebouças, 1200 - Pinheiros',
      },
      weightHistory: [
        { date: now - 60 * day, weightKg: 4.1 },
        { date: now - 30 * day, weightKg: 4.2 },
        { date: now - 5 * day, weightKg: 4.3 },
      ],
      dutySchedule: {
        weeklyAssignment: {
          0: 'user_1', // Dom: Henrique
          1: 'user_1', // Seg: Henrique
          2: 'user_2', // Ter: Mariana
          3: 'user_1', // Qua: Henrique
          4: 'user_2', // Qui: Mariana
          5: 'user_1', // Sex: Henrique
          6: 'user_2', // Sáb: Mariana
        },
      },
      reminders: [
        { id: 'rem_b1', petId: 'pet_bayonetta', title: 'Café da Manhã & Água Fresca', time: '08:00', isEnabled: true, category: 'food' },
        { id: 'rem_b2', petId: 'pet_bayonetta', title: 'Peneirar Caixa de Areia', time: '13:00', isEnabled: true, category: 'litter' },
        { id: 'rem_b3', petId: 'pet_bayonetta', title: 'Jantar & Sachê Gourmet', time: '19:30', isEnabled: true, category: 'food' },
      ],
    },
    {
      id: 'pet_apollo',
      name: 'Apollo',
      species: 'dog',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80',
      breed: 'Golden Retriever',
      birthDate: '2022-11-15',
      weightKg: 31.5,
      walks: {
        lastWalkAt: now - 4 * 3600 * 1000, // 4 hours ago
        walksToday: 1,
        targetWalksPerDay: 2,
      },
      bath: {
        lastBathAt: now - 11 * day,
        intervalDays: 15,
      },
      feeding: {
        foodBrand: 'Golden Fórmula Cães Adultos',
        packageWeightGrams: 15000,
        currentStockGrams: 3200,
        dailyConsumptionGrams: 360,
        minStockAlertThreshold: 1500,
      },
      medicalRecords: [
        {
          id: 'med_a1',
          type: 'vaccine',
          name: 'Vacina V10 Polivalente',
          administeredAt: now - 120 * day,
          nextDueDate: now + 245 * day,
        },
        {
          id: 'med_a2',
          type: 'flea_treatment',
          name: 'Simparic Antipulgas & Carrapatos',
          administeredAt: now - 25 * day,
          nextDueDate: now + 5 * day,
        },
      ],
      careLogs: [
        {
          id: 'log_a1',
          petId: 'pet_apollo',
          actionType: 'walk',
          title: 'Passeio matinal no parque',
          performedByUserId: 'user_1',
          performedByName: 'Henrique',
          performedAt: now - 4 * 3600 * 1000,
          xpEarned: 25,
        },
        {
          id: 'log_a2',
          petId: 'pet_apollo',
          actionType: 'feed',
          title: 'Alimentação diária servida',
          performedByUserId: 'user_2',
          performedByName: 'Mariana',
          performedAt: now - 6 * 3600 * 1000,
          xpEarned: 10,
        },
      ],
      vetContact: {
        name: 'Dr. Fernando Silva',
        phone: '(11) 97766-5544',
        clinicName: 'Hospital Veterinário 24h PetCare',
        address: 'Rua Fradique Coutinho, 890 - Pinheiros',
      },
      weightHistory: [
        { date: now - 90 * day, weightKg: 30.2 },
        { date: now - 30 * day, weightKg: 31.0 },
        { date: now - 2 * day, weightKg: 31.5 },
      ],
      dutySchedule: {
        weeklyAssignment: {
          0: 'user_2', // Dom: Mariana
          1: 'user_2', // Seg: Mariana
          2: 'user_1', // Ter: Henrique
          3: 'user_2', // Qua: Mariana
          4: 'user_1', // Qui: Henrique
          5: 'user_2', // Sex: Mariana
          6: 'user_1', // Sáb: Henrique
        },
      },
      reminders: [
        { id: 'rem_a1', petId: 'pet_apollo', title: 'Passeio Matinal & Ração', time: '07:30', isEnabled: true, category: 'walk' },
        { id: 'rem_a2', petId: 'pet_apollo', title: 'Troca de Água & Brincadeira', time: '14:00', isEnabled: true, category: 'hygiene' },
        { id: 'rem_a3', petId: 'pet_apollo', title: 'Passeio Noturno & Jantar', time: '19:00', isEnabled: true, category: 'walk' },
      ],
    },
  ];
}

export function createInitialPet(): Pet {
  return createInitialPets()[0];
}

export function createInitialPantry(): PantryItem[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    { id: 'pantry_1', name: 'Arroz Integral 1kg', category: 'mercearia', currentQuantity: 3, minQuantity: 1, unit: 'pacote', autoAddToShopping: true, expirationDate: now + 60 * day },
    { id: 'pantry_2', name: 'Azeite Extra Virgem 500ml', category: 'mercearia', currentQuantity: 1, minQuantity: 1, unit: 'un', autoAddToShopping: true, expirationDate: now + 180 * day },
    { id: 'pantry_3', name: 'Detergente Líquido', category: 'limpeza', currentQuantity: 1, minQuantity: 2, unit: 'un', autoAddToShopping: true },
    { id: 'pantry_4', name: 'Desinfetante Floral 2L', category: 'limpeza', currentQuantity: 2, minQuantity: 1, unit: 'un', autoAddToShopping: false },
    { id: 'pantry_5', name: 'Sacos de Lixo 30L', category: 'limpeza', currentQuantity: 0, minQuantity: 1, unit: 'pacote', autoAddToShopping: true },
    { id: 'pantry_6', name: 'Sachê Whiskas Carne', category: 'pet', currentQuantity: 2, minQuantity: 6, unit: 'un', autoAddToShopping: true, expirationDate: now + 90 * day },
    { id: 'pantry_7', name: 'Areia Higiênica Pipicat 4kg', category: 'pet', currentQuantity: 1, minQuantity: 2, unit: 'pacote', autoAddToShopping: true },
    { id: 'pantry_8', name: 'Maçãs Gala', category: 'hortifruti', currentQuantity: 4, minQuantity: 4, unit: 'un', autoAddToShopping: false, expirationDate: now + 4 * day },
    { id: 'pantry_9', name: 'Queijo Muçarela Fatiado', category: 'refrigerados', currentQuantity: 1, minQuantity: 1, unit: 'pacote', autoAddToShopping: true, expirationDate: now + 3 * day },
  ];
}

export function createInitialShoppingList(): ShoppingItem[] {
  const now = Date.now();
  return [
    { id: 'shop_1', name: 'Sacos de Lixo 30L', category: 'limpeza', quantity: 2, unit: 'pacote', isBought: false, addedBy: 'Henrique', fromPantryId: 'pantry_5', createdAt: now - 3600 * 1000, estimatedPrice: 22.90, aisleCategory: 'limpeza' },
    { id: 'shop_2', name: 'Sachês para Bayonetta (cx com 12)', category: 'pet', quantity: 1, unit: 'pacote', isBought: false, addedBy: 'Mariana', fromPantryId: 'pantry_6', createdAt: now - 5000 * 1000, estimatedPrice: 38.50, aisleCategory: 'pet' },
    { id: 'shop_3', name: 'Banana Prata', category: 'hortifruti', quantity: 1, unit: 'kg', isBought: true, addedBy: 'Mariana', createdAt: now - 8000 * 1000, estimatedPrice: 9.90, aisleCategory: 'hortifruti' },
    { id: 'shop_4', name: 'Leite Integral 1L', category: 'mercearia', quantity: 4, unit: 'un', isBought: false, addedBy: 'Henrique', createdAt: now - 12000 * 1000, estimatedPrice: 5.49, aisleCategory: 'laticinios' },
  ];
}

export function createInitialExpenses(): Expense[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    {
      id: 'exp_1',
      description: 'Supermercado Mensal Pão de Açúcar',
      amount: 432.80,
      paidByUserId: 'user_1',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now - 4 * day,
      category: 'supermercado',
      nature: 'variable',
      isSettled: false,
      notes: 'Compras do mês com produtos de limpeza e alimentos básicos',
    },
    {
      id: 'exp_2',
      description: 'Areia Sanitária e Brinquedo Bayonetta',
      amount: 89.90,
      paidByUserId: 'user_2',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now - 2 * day,
      category: 'pet',
      nature: 'variable',
      isSettled: false,
    },
    {
      id: 'exp_3',
      description: 'Produtos de Limpeza Refil Omo e Veja',
      amount: 74.50,
      paidByUserId: 'user_1',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now - 1 * day,
      category: 'casa',
      nature: 'variable',
      isSettled: false,
    },
    {
      id: 'exp_rec_1',
      description: 'Internet Fibra 600MB Vivo',
      amount: 149.90,
      paidByUserId: 'user_1',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now - 15 * day,
      category: 'contas',
      nature: 'fixed',
      isSettled: true,
      isRecurring: true,
      recurringDay: 15,
      dueDay: 15,
      barcode: '34191.79001 01043.510047 91020.150008 8 91250000014990',
      notes: 'Conta recorrente mensal com vencimento todo dia 15',
    },
    {
      id: 'exp_rec_2',
      description: 'Condomínio Residencial Harmonia',
      amount: 820.00,
      paidByUserId: 'user_2',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now - 5 * day,
      category: 'casa',
      nature: 'fixed',
      isSettled: false,
      isRecurring: true,
      recurringDay: 10,
      dueDay: 10,
      dueDate: now - 2 * day, // Atrasado há 2 dias para demonstrar o banner de Dívidas da Casa
      barcode: '23793.38128 60074.120084 12000.654019 1 98760000082000',
      notes: 'Boleto mensal do condomínio e portaria',
    },
    {
      id: 'exp_rec_3',
      description: 'Aluguel do Mês',
      amount: 2400.00,
      paidByUserId: 'user_1',
      splitAmongUserIds: ['user_1', 'user_2'],
      date: now,
      category: 'casa',
      nature: 'fixed',
      isSettled: false,
      isRecurring: true,
      recurringDay: 20,
      dueDay: 20,
      dueDate: now + 5 * day, // Vence em 5 dias
      barcode: '00190.00009 01234.567809 12345.678901 3 99990000240000',
      notes: 'Aluguel proporcional do imóvel',
    },
  ];
}

export function createInitialEvents(): HouseEvent[] {
  const now = Date.now();
  const day = 86_400_000;

  return [
    {
      id: 'event_1',
      title: 'Faxina Completa da Casa',
      description: 'Mutirão de limpeza de fim de semana com troca de roupas de cama.',
      date: now + 2 * day,
      endDate: now + 2 * day + 3 * 3600 * 1000,
      category: 'limpeza',
      createdByUserId: 'user_1',
      createdByName: 'Henrique',
    },
    {
      id: 'event_2',
      title: 'Visita do Técnico de Fibra/Internet',
      description: 'Manutenção programada do roteador Wi-Fi das 14h às 16h.',
      date: now + 3 * day + 4 * 3600 * 1000,
      endDate: now + 3 * day + 6 * 3600 * 1000,
      category: 'manutencao',
      createdByUserId: 'user_2',
      createdByName: 'Mariana',
    },
    {
      id: 'event_3',
      title: 'Jantar com Amigos na Sala',
      description: 'Recepção de visitas, organizar petiscos e preparar sala de estar.',
      date: now + 4 * day + 8 * 3600 * 1000,
      endDate: now + 4 * day + 12 * 3600 * 1000,
      category: 'social',
      createdByUserId: 'user_1',
      createdByName: 'Henrique',
    },
  ];
}

