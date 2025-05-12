import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, TextField, Button, IconButton, List, ListItem, ListItemText,
    Typography, Divider, Checkbox, FormControlLabel, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

// Mock function to simulate fetching military personnel data
// Replace with your actual API call or data source
const fetchMilitarPorRg = async (rgpm: string): Promise<Militar | null> => {
    console.log(`Buscando militar com RGPM: ${rgpm}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Example data store (replace with actual API call)
    const militaresDb: { [key: string]: Militar } = {
        '12345': { id: '1', nome: 'Fulano de Tal da Silva', posto: 'SD PM', rg: '12345' },
        '67890': { id: '2', nome: 'Beltrano de Sousa Oliveira', posto: 'CB PM', rg: '67890' },
        '11223': { id: '3', nome: 'Ciclano Santos Pereira', posto: 'SGT PM', rg: '11223' },
        '99887': { id: '4', nome: 'MARIA OLIVEIRA COSTA', posto: 'SD PM', rg: '99887' },
        '55443': { id: '5', nome: 'JOÃO PEREIRA ALVES', posto: 'CB PM', rg: '55443' },
        '77665': { id: '6', nome: 'ANA CLARA FERREIRA', posto: 'TEN PM', rg: '77665' }, // Added for more testing
        '33442': { id: '7', nome: 'PAULO ROBERTO LIMA', posto: 'MAJ PM', rg: '33442' }  // Added for more testing
    };

    return militaresDb[rgpm] || null; // Return found militar or null
};


// Define the structure for a military member
interface Militar {
    id: string | number; // Unique identifier
    nome: string;
    posto: string;
    rg: string;
}

interface GuarnicaoTabProps {
    // Pass initial data for both main and support components
    initialData?: {
        componentes?: Militar[];
        apoio?: Militar[];
    };
    // Callback function to update the parent component's state
    onGuarnicaoChange: (data: { componentes: Militar[], apoio: Militar[] }) => void;
}

const GuarnicaoTab: React.FC<GuarnicaoTabProps> = ({ initialData, onGuarnicaoChange }) => {
    // --- State for Main Unit ---
    const [componentes, setComponentes] = useState<Militar[]>(initialData?.componentes || []);
    const [rgpmInput, setRgpmInput] = useState('');
    const [militarEncontrado, setMilitarEncontrado] = useState<Militar | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- State for Supporting Unit(s) ---
    // Initialize teveApoio based on whether initial apoio data exists and has members
    const [teveApoio, setTeveApoio] = useState<boolean>(!!(initialData?.apoio && initialData.apoio.length > 0));
    const [apoioGuarnicao, setApoioGuarnicao] = useState<Militar[]>(initialData?.apoio || []);
    const [rgpmApoioInput, setRgpmApoioInput] = useState('');
    const [militarApoioEncontrado, setMilitarApoioEncontrado] = useState<Militar | null>(null);
    const [loadingApoio, setLoadingApoio] = useState(false);
    const [errorApoio, setErrorApoio] = useState<string | null>(null);

    // --- Callback to Parent ---
    // Use useCallback to memoize the function and prevent unnecessary updates if passed in dependency arrays
    const triggerParentUpdate = useCallback(() => {
        // Ensure 'apoio' is only included if teveApoio is true, otherwise send empty array
        const dataToSend = {
             componentes,
             apoio: teveApoio ? apoioGuarnicao : []
        };
        onGuarnicaoChange(dataToSend);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Including onGuarnicaoChange can cause loops if parent isn't memoizing it
    }, [componentes, apoioGuarnicao, teveApoio]); // Depend on state variables that affect the output

    // Trigger update to parent when relevant state changes
    useEffect(() => {
        triggerParentUpdate();
    }, [triggerParentUpdate]); // Depend only on the memoized callback

    // --- Logic for Main Unit ---
    const buscarMilitar = async () => {
        const rgTrimmed = rgpmInput.trim();
        if (!rgTrimmed) return;
        setLoading(true);
        setError(null);
        setMilitarEncontrado(null); // Clear previous find
        try {
            const militar = await fetchMilitarPorRg(rgTrimmed);
            if (militar) {
                // Check if already in the main list
                if (componentes.some(c => c.rg === militar.rg)) {
                   setError(`Militar ${militar.nome} (RG: ${militar.rg}) já consta na guarnição principal.`);
                // Optional: Check if in support list
                } else if (teveApoio && apoioGuarnicao.some(a => a.rg === militar.rg)) {
                   setError(`Militar ${militar.nome} (RG: ${militar.rg}) já consta na lista de apoio.`);
                } else {
                    setMilitarEncontrado(militar);
                }
            } else {
                setError('Militar não encontrado com este RGPM.');
            }
        } catch (err) {
            setError('Erro ao buscar militar. Verifique a conexão ou tente novamente.');
            console.error("Erro buscando militar:", err);
        } finally {
            setLoading(false);
        }
    };

    const adicionarMilitar = () => {
        // Double check conditions before adding
        if (militarEncontrado && !componentes.some(c => c.id === militarEncontrado.id)) {
            setComponentes(prev => [...prev, militarEncontrado]);
            setMilitarEncontrado(null); // Clear found militar display
            setRgpmInput(''); // Clear search input
            setError(null); // Clear any previous error
        }
    };

    const removerMilitar = (idToRemove: string | number) => {
        setComponentes(prev => prev.filter(m => m.id !== idToRemove));
    };

    // --- Logic for Supporting Unit(s) ---
    const handleToggleApoio = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setTeveApoio(checked);
        if (!checked) {
            // Clear support info if toggled off for immediate feedback, update will propagate via useEffect
            setApoioGuarnicao([]);
            setRgpmApoioInput('');
            setMilitarApoioEncontrado(null);
            setErrorApoio(null);
        }
    };

    const buscarMilitarApoio = async () => {
        const rgTrimmed = rgpmApoioInput.trim();
        if (!rgTrimmed) return;
        setLoadingApoio(true);
        setErrorApoio(null);
        setMilitarApoioEncontrado(null); // Clear previous find
        try {
            const militar = await fetchMilitarPorRg(rgTrimmed);
            if (militar) {
                 // Check if already in the support list
                 if (apoioGuarnicao.some(a => a.rg === militar.rg)) {
                     setErrorApoio(`Militar ${militar.nome} (RG: ${militar.rg}) já consta na lista de apoio.`);
                 }
                 // Check if they are in the main list
                 else if (componentes.some(c => c.rg === militar.rg)) {
                    setErrorApoio(`Militar ${militar.nome} (RG: ${militar.rg}) já consta na guarnição principal.`);
                 }
                  else {
                    setMilitarApoioEncontrado(militar);
                 }
            } else {
                setErrorApoio('Militar não encontrado com este RGPM.');
            }
        } catch (err) {
            setErrorApoio('Erro ao buscar militar de apoio. Verifique a conexão ou tente novamente.');
            console.error("Erro buscando militar de apoio:", err);
        } finally {
            setLoadingApoio(false);
        }
    };

     const adicionarMilitarApoio = () => {
        // Double check conditions before adding
        if (militarApoioEncontrado && !apoioGuarnicao.some(a => a.id === militarApoioEncontrado.id)) {
            // Redundant check (already done in search), but safe
            if (componentes.some(c => c.id === militarApoioEncontrado.id)) {
                 setErrorApoio(`Militar ${militarApoioEncontrado.nome} já está na guarnição principal.`);
                 return;
             }
            setApoioGuarnicao(prev => [...prev, militarApoioEncontrado]);
            setMilitarApoioEncontrado(null); // Clear display
            setRgpmApoioInput(''); // Clear search input
            setErrorApoio(null); // Clear error
        }
    };

    const removerMilitarApoio = (idToRemove: string | number) => {
        setApoioGuarnicao(prev => prev.filter(m => m.id !== idToRemove));
    };


    return (
        <Box sx={{ p: 2 }}>
            {/* --- Seção Guarnição Principal --- */}
            <Typography variant="h6" gutterBottom>Identificação da Guarnição Principal</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Buscar por RG PMMT"
                    variant="outlined"
                    size="small"
                    value={rgpmInput}
                    onChange={(e) => { setRgpmInput(e.target.value); setError(null); }} // Clear error on change
                    onKeyPress={(e) => e.key === 'Enter' && buscarMilitar()}
                    disabled={loading}
                    sx={{ flexGrow: 1, minWidth: '150px' }}
                />
                <Button
                    variant="contained"
                    onClick={buscarMilitar}
                    disabled={loading || !rgpmInput.trim()}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                    sx={{ height: '40px' }} // Match TextField height
                >
                    Buscar
                </Button>
            </Box>

            {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {militarEncontrado && (
                <Box sx={{ mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" gutterBottom>Militar encontrado:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {militarEncontrado.posto} {militarEncontrado.nome} - RG: {militarEncontrado.rg}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={adicionarMilitar}
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                    >
                        Adicionar à Guarnição Principal
                    </Button>
                </Box>
            )}

            <Typography variant="subtitle1" gutterBottom>Componentes da Guarnição Principal:</Typography>
            <List dense sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                {componentes.length === 0 ? (
                     <ListItem>
                        <ListItemText primary="Nenhum militar adicionado." sx={{ fontStyle: 'italic', color: 'text.secondary' }}/>
                    </ListItem>
                ) : (
                    componentes.map((militar) => (
                        <ListItem
                            key={militar.id}
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => removerMilitar(militar.id)} size="small">
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            }
                            sx={{ borderBottom: '1px dashed', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                        >
                            <ListItemText
                                primary={`${militar.posto} ${militar.nome}`}
                                secondary={`RG PMMT: ${militar.rg}`}
                            />
                        </ListItem>
                    ))
                )}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* --- Seção de Apoio --- */}
            <Typography variant="h6" gutterBottom>Apoio na Ocorrência</Typography>
            <FormControlLabel
                control={<Checkbox checked={teveApoio} onChange={handleToggleApoio} />}
                label="Houve apoio de outra(s) guarnição(ões) / militar(es)?"
                sx={{ mb: 1 }}
            />

            {teveApoio && (
                <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: 'secondary.main', animation: 'fadeIn 0.5s ease-in-out' }}>
                    { /* Animation requires appropriate CSS/SX if needed */ }
                    <Typography variant="subtitle1" gutterBottom color="secondary.dark">Adicionar Militar de Apoio</Typography>
                     <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="Buscar por RG PMMT (Apoio)"
                            variant="outlined"
                            size="small"
                            color="secondary"
                            value={rgpmApoioInput}
                            onChange={(e) => { setRgpmApoioInput(e.target.value); setErrorApoio(null); }} // Clear error on change
                            onKeyPress={(e) => e.key === 'Enter' && buscarMilitarApoio()}
                            disabled={loadingApoio}
                             sx={{ flexGrow: 1, minWidth: '150px' }}
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={buscarMilitarApoio}
                            disabled={loadingApoio || !rgpmApoioInput.trim()}
                            startIcon={loadingApoio ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                             sx={{ height: '40px' }} // Match TextField height
                        >
                            Buscar Apoio
                        </Button>
                    </Box>

                    {errorApoio && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErrorApoio(null)}>{errorApoio}</Alert>}

                    {militarApoioEncontrado && (
                        <Box sx={{ mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
                             <Typography variant="body2" gutterBottom>Militar de apoio encontrado:</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {militarApoioEncontrado.posto} {militarApoioEncontrado.nome} - RG: {militarApoioEncontrado.rg}
                            </Typography>
                             <Button
                                variant="outlined"
                                size="small"
                                color="secondary"
                                onClick={adicionarMilitarApoio}
                                startIcon={<AddIcon />}
                                sx={{ mt: 1 }}
                            >
                                Adicionar à Lista de Apoio
                            </Button>
                        </Box>
                    )}

                    <Typography variant="subtitle1" gutterBottom>Militares de Apoio Adicionados:</Typography>
                     <List dense sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {apoioGuarnicao.length === 0 ? (
                             <ListItem>
                                <ListItemText primary="Nenhum militar de apoio adicionado." sx={{ fontStyle: 'italic', color: 'text.secondary' }}/>
                            </ListItem>
                        ) : (
                            apoioGuarnicao.map((militar) => (
                                <ListItem
                                    key={militar.id}
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => removerMilitarApoio(militar.id)} size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    }
                                    sx={{ borderBottom: '1px dashed', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                                >
                                    <ListItemText
                                        // Display Posto for context in UI, but PDF will omit it per requirement
                                        primary={`${militar.posto} ${militar.nome}`}
                                        secondary={`RG PMMT: ${militar.rg}`}
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                </Box>
            )}
             {/* Add some bottom padding to the main box */}
             <Box sx={{ pb: 3 }} />
        </Box>
    );
};

export default GuarnicaoTab;

// Simple fade-in animation (optional, requires @mui/system or styled-components potentially)
// You might need to add `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }` to your global CSS or use Sx prop with keyframes
