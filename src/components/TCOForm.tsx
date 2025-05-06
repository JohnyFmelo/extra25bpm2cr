import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const TCOForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tcoNumber: "",
    nature: "",
    penalty: "",
    drugQuantity: "",
    drugType: "",
    drugColor: "",
    drugIndication: "",
    unknownDrugDescription: "",
    requestExpertise: "Sim",
    occurrenceDate: new Date().toISOString().split("T")[0],
    occurrenceTime: "",
    startDate: new Date().toISOString().split("T")[0],
    startTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
    location: "",
    defendant: "",
    description: "",
    witnesses: "",
    officer: "",
  });

  const natureOptions = [
    { value: "Posse de Droga para Consumo Pessoal", label: "Posse de Droga para Consumo Pessoal", penalty: "Advertência, prestação de serviços à comunidade ou medida educativa" },
    { value: "Furto Simples", label: "Furto Simples", penalty: "Reclusão de 1 a 4 anos e multa" },
    { value: "Lesão Corporal Leve", label: "Lesão Corporal Leve", penalty: "Detenção de 3 meses a 1 ano" },
    { value: "Ameaça", label: "Ameaça", penalty: "Detenção de 1 a 6 meses ou multa" },
    { value: "Outros", label: "Outros", penalty: "A ser especificado" },
  ];

  useEffect(() => {
    if (formData.drugType && formData.drugColor) {
      if (formData.drugType === "Vegetal" && formData.drugColor === "Verde") {
        setFormData(prev => ({ ...prev, drugIndication: "Indícios de Maconha" }));
      } else if (formData.drugType === "Mineral" && formData.drugColor === "Amarelada") {
        setFormData(prev => ({ ...prev, drugIndication: "Indícios de Pasta Base" }));
      } else if (formData.drugType === "Mineral" && formData.drugColor === "Branca") {
        setFormData(prev => ({ ...prev, drugIndication: "Indícios de Cocaína" }));
      } else {
        setFormData(prev => ({ ...prev, drugIndication: "Material Desconhecido" }));
      }
    }
  }, [formData.drugType, formData.drugColor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "nature" && { penalty: natureOptions.find(opt => opt.value === value)?.penalty || "" }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("TCO Form submitted:", formData);
    toast({
      title: "TCO Registrado",
      description: "O registro foi salvo com sucesso.",
    });
    setFormData({
      tcoNumber: "",
      nature: "",
      penalty: "",
      drugQuantity: "",
      drugType: "",
      drugColor: "",
      drugIndication: "",
      unknownDrugDescription: "",
      requestExpertise: "Sim",
      occurrenceDate: new Date().toISOString().split("T")[0],
      occurrenceTime: "",
      startDate: new Date().toISOString().split("T")[0],
      startTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
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
            <Label htmlFor="tcoNumber">Nº do TCO</Label>
            <Input
              id="tcoNumber"
              name="tcoNumber"
              value={formData.tcoNumber}
              onChange={handleChange}
              placeholder="Número do TCO"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nature">Natureza</Label>
            <Select
              onValueChange={(value) => handleSelectChange("nature", value)}
              value={formData.nature}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a natureza" />
              </SelectTrigger>
              <SelectContent>
                {natureOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.nature && (
            <div className="space-y-2">
              <Label>Pena Prevista</Label>
              <Input
                value={formData.penalty}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}

          {formData.nature === "Posse de Droga para Consumo Pessoal" && (
            <div className="space-y-2 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="drugQuantity">Quantidade (g)</Label>
                  <Input
                    id="drugQuantity"
                    name="drugQuantity"
                    type="number"
                    value={formData.drugQuantity}
                    onChange={handleChange}
                    placeholder="Quantidade em gramas"
                  />
                </div>
                <div>
                  <Label htmlFor="drugType">Tipo</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("drugType", value)}
                    value={formData.drugType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vegetal">Vegetal</SelectItem>
                      <SelectItem value="Mineral">Mineral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="drugColor">Cor</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("drugColor", value)}
                    value={formData.drugColor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verde">Verde</SelectItem>
                      <SelectItem value="Amarelada">Amarelada</SelectItem>
                      <SelectItem value="Branca">Branca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.drugIndication && (
                <div>
                  <Label>Indícios</Label>
                  <Input
                    value={formData.drugIndication}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              )}
              {formData.drugIndication === "Material Desconhecido" && (
                <div>
                  <Label htmlFor="unknownDrugDescription">Descrição do Material</Label>
                  <Textarea
                    id="unknownDrugDescription"
                    name="unknownDrugDescription"
                    value={formData.unknownDrugDescription}
                    onChange={handleChange}
                    placeholder="Descreva o material desconhecido"
                    rows={2}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="requestExpertise">Solicitar Perícia</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("requestExpertise", value)}
                  value={formData.requestExpertise}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="occurrenceDate">Data da Ocorrência</Label>
            <Input
              id="occurrenceDate"
              name="occurrenceDate"
              type="date"
              value={formData.occurrenceDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurrenceTime">Hora da Ocorrência</Label>
            <Input
              id="occurrenceTime"
              name="occurrenceTime"
              type="time"
              value={formData.occurrenceTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início do Registro</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              readOnly
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Hora de Início do Registro</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              readOnly
              className="bg-gray-100"
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
