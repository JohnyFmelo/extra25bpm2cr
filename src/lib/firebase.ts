// firebase.ts
// ... (imports e config) ...
// Defina um tipo para os dados que vêm do TimeSlotDialog para maior clareza
// Este tipo deve corresponder à estrutura do objeto 'timeSlotData' / 'newSlot' / 'updatedSlot'
// que é passado para dataOperations.
interface SlotDataForFirebase {
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  slots_used: number;
  volunteers?: string[];
  description?: string;
  allowed_military_types?: string[]; // Esta é a chave
  isWeekly?: boolean; // Se aplicável
  id?: string; // Para updates
}


// ... (safeClone, getDocsFromSnapshot, handleFirestoreOperation) ...
// Nesses helpers, não há menção direta a allowed_military_types, então devem estar ok.

export const dataOperations = {
  async fetch(): Promise<TimeSlotFromList[]> { // Usando o tipo de TimeSlotsList
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      // Mapear para o tipo TimeSlotFromList explicitamente
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Garantir que os campos obrigatórios do tipo TimeSlotFromList existam
        date: doc.data().date || '',
        start_time: doc.data().start_time || '',
        end_time: doc.data().end_time || '',
        total_slots: doc.data().total_slots || 0,
        slots_used: doc.data().slots_used || 0,
        allowed_military_types: doc.data().allowed_military_types || [], // Importante fallback para array vazio
        description: doc.data().description || '',
        volunteers: doc.data().volunteers || [],
      } as TimeSlotFromList));
    }).catch(error => {
      console.error('Error fetching data:', error);
      return [];
    });
  },

  async insert(newSlotData: SlotDataForFirebase) { // newSlotData vem do TimeSlotDialog.handleRegister
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      
      // O objeto newSlotData já deve estar com os nomes corretos (snake_case)
      // e allowed_military_types com os valores selecionados.
      // Remover o fallback desnecessário aqui:
      const slotToInsert = {
        ...newSlotData,
        // Garante que se allowed_military_types for undefined (não deveria ser),
        // salve um array vazio para consistência no DB.
        // No entanto, TimeSlotDialog deve sempre enviar um array.
        allowed_military_types: newSlotData.allowed_military_types || [] 
      };
      
      await addDoc(timeSlotCollection, slotToInsert);
      return { success: true };
    }).catch(error => {
      console.error('Error inserting data:', error);
      return { success: false };
    });
  },

  async update(updatedSlotData: SlotDataForFirebase & { id: string }, conditions: any) {
    // 'conditions' ainda é usado para encontrar o documento, mas 'updatedSlotData' contém todos os novos valores
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      
      // Tentar encontrar pelo ID se disponível em updatedSlotData, senão usar conditions
      let docRef;
      if (updatedSlotData.id) {
          docRef = doc(db, 'timeSlots', updatedSlotData.id);
      } else {
          // Lógica original de busca por conditions se ID não estiver em updatedSlotData
          const q = query(
            timeSlotCollection,
            where('date', '==', conditions.date),
            where('start_time', '==', conditions.start_time),
            where('end_time', '==', conditions.end_time)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            docRef = doc(db, 'timeSlots', querySnapshot.docs[0].id);
          } else {
            console.error('Document not found for update with conditions:', conditions);
            return { success: false, message: "Document not found" };
          }
      }

      if (docRef) {
        // O objeto updatedSlotData já deve ter os nomes corretos (snake_case)
        // e allowed_military_types com os valores selecionados.
        // Remover o fallback desnecessário aqui.
        // Criar um objeto apenas com os campos a serem atualizados, excluindo o id de dentro do payload.
        const { id, ...dataToUpdate } = updatedSlotData; 
        const slotToUpdate = {
            ...dataToUpdate,
            // Garante que se allowed_military_types for undefined (não deveria ser),
            // salve um array vazio. TimeSlotDialog deve enviar um array.
            allowed_military_types: updatedSlotData.allowed_military_types || [] 
        };
        await updateDoc(docRef, slotToUpdate);
        return { success: true };
      }
      return { success: false, message: "Document reference not established" };
    }).catch(error => {
      console.error('Error updating data:', error);
      return { success: false };
    });
  },

  // ... (delete e clear permanecem os mesmos, não afetam allowed_military_types diretamente na escrita)
  async delete(conditions: any) {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const q = query(
        timeSlotCollection,
        where('date', '==', conditions.date),
        where('start_time', '==', conditions.start_time),
        where('end_time', '==', conditions.end_time)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'timeSlots', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        return { success: true };
      }
      return { success: false };
    }).catch(error => {
      console.error('Error deleting data:', error);
      return { success: false };
    });
  },

  async clear() {
    return handleFirestoreOperation(async (db) => {
      const timeSlotCollection = collection(db, 'timeSlots');
      const querySnapshot = await getDocs(timeSlotCollection);
      
      await Promise.all(
        querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      );
      return { success: true };
    }).catch(error => {
      console.error('Error clearing data:', error);
      return { success: false };
    });
  }
};
