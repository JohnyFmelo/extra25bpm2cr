import React from 'react';
// Assuming original tabs are in src/components/tco/ directory, sibling to FORM directory
import BasicInformationTab from '../BasicInformationTab'; 
import DrugVerificationTab from '../DrugVerificationTab';

interface BasicInformationTabProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  natureza: string;
  setNatureza: (value: string) => void;
  autor: string;
  setAutor: (value: string) => void;
  penaDescricao: string;
  naturezaOptions: string[];
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  startTime: Date | null;
  isTimerRunning: boolean;
}

interface DrugVerificationTabProps {
  quantidade: string;
  setQuantidade: (value: string) => void;
  substancia: string;
  setSubstancia: (value: string) => void;
  cor: string;
  setCor: (value: string) => void;
  indicios: string;
  customMaterialDesc: string;
  setCustomMaterialDesc: (value: string) => void;
  isUnknownMaterial: boolean;
  lacreNumero: string;
  setLacreNumero: (value: string) => void;
}

interface FORnaturezaProps extends BasicInformationTabProps, DrugVerificationTabProps {
  // natureza is part of BasicInformationTabProps and also used for conditional rendering here
}

const FORnatureza: React.FC<FORnaturezaProps> = (props) => {
  return (
    <>
      <BasicInformationTab
        tcoNumber={props.tcoNumber}
        setTcoNumber={props.setTcoNumber}
        natureza={props.natureza}
        setNatureza={props.setNatureza}
        autor={props.autor}
        setAutor={props.setAutor}
        penaDescricao={props.penaDescricao}
        naturezaOptions={props.naturezaOptions}
        customNatureza={props.customNatureza}
        setCustomNatureza={props.setCustomNatureza}
        startTime={props.startTime}
        isTimerRunning={props.isTimerRunning}
      />
      {props.natureza === "Porte de drogas para consumo" && (
        <DrugVerificationTab
          quantidade={props.quantidade}
          setQuantidade={props.setQuantidade}
          substancia={props.substancia}
          setSubstancia={props.setSubstancia}
          cor={props.cor}
          setCor={props.setCor}
          indicios={props.indicios}
          customMaterialDesc={props.customMaterialDesc}
          setCustomMaterialDesc={props.setCustomMaterialDesc}
          isUnknownMaterial={props.isUnknownMaterial}
          lacreNumero={props.lacreNumero}
          setLacreNumero={props.setLacreNumero}
        />
      )}
    </>
  );
};

export default FORnatureza;
