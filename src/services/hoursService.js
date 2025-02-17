// src/services/hoursService.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDY1MjMsImV4cCI6MjA1MjYyMjUyM30.5Khm1eXEsm8SCuN7VYEVRYSbKc0A-T_Xo4hUUvibkgM'; // CHAVE ANON - Verifique se é a ANON KEY correta do seu projeto Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const getTableName = (month) => {
    const monthLowerCase = month.toLowerCase();
    if (monthLowerCase === 'janeiro') {
        return 'Janeiro';
    } else if (monthLowerCase === 'fevereiro') {
        return 'Fevereiro';
    } else {
        return null;
    }
};

export const fetchUserHours = async (month, registration) => {
    const tableName = getTableName(month);
    if (!tableName) {
        return { error: "Mês inválido" };
    }

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('registration', registration);

        if (error) {
            console.error("Supabase error fetching user hours:", error);
            return { error: error.message };
        }
        return data;
    } catch (error) {
        console.error("Error fetching user hours:", error);
        return { error: "Erro ao consultar dados no Supabase." };
    }
};

export const fetchAllUsers = async () => {
    try {
        const { data, error } = await supabase
            .from('users') // Substitua 'users' pelo nome da sua tabela de usuários se for diferente
            .select('registration, name');

        if (error) {
            console.error("Supabase error fetching all users:", error);
            return [];
        }

        const users = data.map(user => ({
            value: user.registration.toString(),
            label: user.name,
        }));
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};
