
import { createClient } from '@supabase/supabase-js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const supabaseUrl = 'https://evsfhznfnifmqlpktbdr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2Zoem5mbmlmbXFscGt0YmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0NjUyMywiZXhwIjoyMDUyNjIyNTIzfQ.GQEz9xvQmTr0Chtjj1ndtq3WTAA8YMm_dFPvnAHMLuc';
const supabase = createClient(supabaseUrl, supabaseKey);

const getTableName = (month) => {
    const monthLowerCase = month.toLowerCase();
    switch (monthLowerCase) {
        case 'janeiro':
            return 'JANEIRO';
        case 'fevereiro':
            return 'FEVEREIRO';
        case 'marco':
            return 'MARCO';
        case 'abril':
            return 'ABRIL';
        case 'maio':
            return 'MAIO';
        case 'junho':
            return 'JUNHO';
        case 'julho':
            return 'JULHO';
        case 'agosto':
            return 'AGOSTO';
        case 'setembro':
            return 'SETEMBRO';
        case 'outubro':
            return 'OUTUBRO';
        case 'novembro':
            return 'NOVEMBRO';
        case 'dezembro':
            return 'DEZEMBRO';
        default:
            return null;
    }
};

export const fetchUserHours = async (month, registration) => {
    const tableName = getTableName(month);
    if (!tableName) {
        return { error: "Mês inválido" };
    }

    if (!registration) {
        return { error: "Matrícula não informada" };
    }

    try {
        // Converter a matrícula para número
        const numericRegistration = Number(registration);
        if (isNaN(numericRegistration)) {
            return { error: "Matrícula inválida" };
        }

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('Matricula', numericRegistration);

        if (error) {
            console.error("Supabase error fetching user hours:", error);
            return { error: error.message };
        }
        
        // Parse the data to extract hours by day
        if (data && data.length > 0) {
            const userData = data[0];
            
            // Process BPM hours
            const bpmHours = userData["Horas 25° BPM"] || "";
            const bpmDays = processDailyHours(bpmHours, 'bpm');
            
            // Process SAIOP hours
            const saiopHours = userData["Saiop"] || "";
            const saiopDays = processDailyHours(saiopHours, 'saiop');
            
            // Process SINFRA hours
            const sinfraHours = userData["Sinfra"] || "";
            const sinfraDays = processDailyHours(sinfraHours, 'sinfra');
            
            // Combine all days
            const allDays = [...bpmDays, ...saiopDays, ...sinfraDays];
            
            // Add the full data and the processed days
            userData.workedDays = allDays;
            
            return data;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching user hours:", error);
        return { error: "Erro ao consultar dados no Supabase." };
    }
};

// Helper function to process daily hours from string format
const processDailyHours = (hoursString, location) => {
    if (!hoursString) return [];
    
    const days = [];
    const dayEntries = hoursString.split('|');
    
    dayEntries.forEach(entry => {
        const parts = entry.trim().split('/');
        if (parts.length >= 2) {
            const day = parts[0].trim();
            const hours = parts[1].replace('h', '').trim();
            
            if (day && hours) {
                days.push({
                    day,
                    hours,
                    location
                });
            }
        }
    });
    
    return days;
};

export const fetchAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const firebaseUsers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                registration: data.registration || '',
                name: `${data.rank || ''} ${data.warName || ''}`.trim(),
            };
        });

        const validUsers = firebaseUsers.filter(user => user.registration);

        const users = validUsers.map(user => ({
            value: user.registration,
            label: user.name,
            registration: user.registration
        }));

        return users;
    } catch (error) {
        console.error("Error fetching users from Firebase:", error);
        return [];
    }
};
