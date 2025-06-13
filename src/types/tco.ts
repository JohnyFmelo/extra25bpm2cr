
export interface TCO {
  id: string;
  tcoNumber: string;
  natureza: string;
  dataOcorrencia: string;
  horaOcorrencia: string;
  localOcorrencia: string;
  autores?: Array<{
    nome: string;
    fielDepositario?: string;
  }>;
  vitimas?: Array<{
    nome: string;
  }>;
  componentesGuarnicao?: Array<{
    nome: string;
  }>;
  // Add other TCO-specific fields as needed
  [key: string]: any;
}
