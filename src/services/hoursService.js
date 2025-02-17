// src/services/hoursService.js
import supabase from '../../supabaseClient'; // Ajuste o caminho se necessário

const getTableName = (month) => {
  const monthLowerCase = month.toLowerCase();
  if (monthLowerCase === 'janeiro') {
    return 'Janeiro';
  } else if (monthLowerCase === 'fevereiro') {
    return 'Fevereiro';
  } else {
    return null; // Ou trate meses inválidos conforme necessário
  }
};

export const fetchUserHours = async (month, registration) => {
  const tableName = getTableName(month);
  if (!tableName) {
    return { error: "Mês inválido" };
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('registration', registration); // Assumindo que 'registration' é o nome da coluna

  if (error) {
    console.error("Supabase error fetching user hours:", error);
    return { error: error.message };
  }

  return data;
};

export const fetchAllUsers = async () => {
  // Assumindo que você tem uma tabela 'users' no Supabase para buscar a lista de usuários.
  // Se não, você pode precisar ajustar isso com base em como os usuários são gerenciados no seu Supabase.
  const { data, error } = await supabase
    .from('users') // Substitua 'users' pelo nome da sua tabela de usuários se for diferente
    .select('registration, name'); // Selecione registration e name, ajuste as colunas conforme necessário

  if (error) {
    console.error("Supabase error fetching all users:", error);
    return []; // Retorna array vazio ou trate o erro conforme necessário
  }

  // Mapeia os dados do Supabase para o tipo UserOption
  const users = data.map(user => ({
    value: user.registration.toString(), // Assumindo que registration é um número ou precisa ser string
    label: user.name,
  }));
  return users;
};
