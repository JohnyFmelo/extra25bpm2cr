
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0NjUyMywiZXhwIjoyMDUyNjIyNTIzfQ.GQEz9xvQmTr0Chtjj1ndtq3WTAA8YMm_dFPvnAHMLuc';
const supabase = createClient(supabaseUrl, supabaseKey);

const getTableName = (month) => {
    const monthLowerCase = month.toLowerCase();
    if (monthLowerCase === 'janeiro') {
        return 'JANEIRO';
    } else if (monthLowerCase === 'fevereiro') {
        return 'FEVEREIRO';
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
            .eq('Matricula', registration);  // Atualizado para 'Matricula' com M maiúsculo

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
            .from('FUNCIONARIOS')
            .select('matricula, nome');

        if (error) {
            console.error("Supabase error fetching all users:", error);
            return [];
        }

        const users = data.map(user => ({
            value: user.matricula.toString(),
            label: user.nome,
        }));
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};
