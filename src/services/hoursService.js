
import { createClient } from '@supabase/supabase-js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
            .eq('Matricula', registration);

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
        // Buscar usuários do Firebase
        const querySnapshot = await getDocs(collection(db, 'users'));
        const firebaseUsers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                registration: data.registration || '',
                name: `${data.rank || ''} ${data.warName || ''}`.trim(),
            };
        });

        // Filtrar usuários que têm matrícula
        const validUsers = firebaseUsers.filter(user => user.registration);

        // Mapear para o formato esperado
        const users = validUsers.map(user => ({
            value: user.registration,
            label: user.name,
        }));

        return users;
    } catch (error) {
        console.error("Error fetching users from Firebase:", error);
        return [];
    }
};
