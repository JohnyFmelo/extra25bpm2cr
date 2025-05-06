
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const TCOForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: "",
    location: "",
    defendant: "",
    description: "",
    witnesses: "",
    officer: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally submit to a backend
    console.log("TCO Form submitted:", formData);
    
    toast({
      title: "TCO Registrado",
      description: "O registro foi salvo com sucesso.",
    });
    
    // Reset form after submission
    setFormData({
      date: "",
      location: "",
      defendant: "",
      description: "",
      witnesses: "",
      officer: "",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Registro de TCO</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data da Ocorrência</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Local da ocorrência"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defendant">Nome do Infrator</Label>
            <Input
              id="defendant"
              name="defendant"
              value={formData.defendant}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="officer">Policial Responsável</Label>
            <Input
              id="officer"
              name="officer"
              value={formData.officer}
              onChange={handleChange}
              placeholder="Nome do policial"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição da Ocorrência</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descreva detalhes da ocorrência"
            rows={4}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="witnesses">Testemunhas</Label>
          <Textarea
            id="witnesses"
            name="witnesses"
            value={formData.witnesses}
            onChange={handleChange}
            placeholder="Nome e contato das testemunhas (se houver)"
            rows={2}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">Registrar TCO</Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
