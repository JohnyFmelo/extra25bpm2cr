
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface TCO {
  id: string;
  tcoNumber: string;
  natureza: string;
  createdAt: any;
  dataFato: string;
}

const TCOList = () => {
  const [tcos, setTcos] = useState<TCO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTCOs = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id;
        
        if (!userId) {
          console.error("User ID not found");
          setLoading(false);
          return;
        }
        
        const q = query(
          collection(db, "tcos"),
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const tcoList: TCO[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tcoList.push({
            id: doc.id,
            tcoNumber: data.tcoNumber || "N/A",
            natureza: data.natureza || "N/A",
            createdAt: data.createdAt?.toDate() || new Date(),
            dataFato: data.dataFato || "N/A",
          });
        });
        
        setTcos(tcoList);
      } catch (error) {
        console.error("Error fetching TCOs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTCOs();
  }, []);

  return (
    <div className="container px-4 py-6 md:py-10">
      <h2 className="text-2xl font-semibold mb-6">Meus TCOs</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : tcos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum TCO encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº TCO</TableHead>
                <TableHead>Natureza</TableHead>
                <TableHead>Data do Fato</TableHead>
                <TableHead>Data de Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tcos.map((tco) => (
                <TableRow key={tco.id}>
                  <TableCell className="font-medium">{tco.tcoNumber}</TableCell>
                  <TableCell>{tco.natureza}</TableCell>
                  <TableCell>{tco.dataFato ? format(new Date(tco.dataFato), "dd/MM/yyyy") : "N/A"}</TableCell>
                  <TableCell>{format(tco.createdAt, "dd/MM/yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TCOList;
