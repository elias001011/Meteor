

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { LightbulbIcon, RefreshCwIcon } from '../icons';

interface Tip {
    id: number;
    title: string;
    content: string;
    category: 'sustainability' | 'energy' | 'water' | 'daily';
}

const TIPS_DATABASE: Tip[] = [
    {
        id: 1,
        title: "Desligue aparelhos em standby",
        content: "Eletrônicos em standby consomem até 10% da energia da sua casa. Use filtros de linha com interruptor.",
        category: "energy"
    },
    {
        id: 2,
        title: "Aproveite a luz natural",
        content: "Abra as cortinas durante o dia. A luz natural melhora o humor e reduz o consumo de energia.",
        category: "daily"
    },
    {
        id: 3,
        title: "Reutilize água da chuva",
        content: "Instale um coletor de água da chuva para regar plantas e limpar áreas externas.",
        category: "water"
    },
    {
        id: 4,
        title: "Opte por transporte sustentável",
        content: "Caminhar, pedalar ou usar transporte público reduz emissões de CO2 e melhora sua saúde.",
        category: "sustainability"
    },
    {
        id: 5,
        title: "Tome banhos mais curtos",
        content: "Reduzir o banho em 5 minutos economiza até 45 litros de água por dia.",
        category: "water"
    },
    {
        id: 6,
        title: "Use sacolas reutilizáveis",
        content: "Uma sacola plástica leva 400 anos para se decompor. Leve sempre a sua.",
        category: "sustainability"
    },
    {
        id: 7,
        title: "Descongele a geladeira regularmente",
        content: "Gelo acima de 5mm aumenta o consumo de energia em até 30%.",
        category: "energy"
    },
    {
        id: 8,
        title: "Plante árvores nativas",
        content: "Árvores nativas atraem polinizadores locais e precisam de menos água.",
        category: "sustainability"
    },
    {
        id: 9,
        title: "Ajuste o termostato",
        content: "Cada grau a mais no ar-condicionado representa 5% a mais no consumo de energia.",
        category: "energy"
    },
    {
        id: 10,
        title: "Repare vazamentos imediatamente",
        content: "Uma torneira pingando desperdiça até 46 litros de água por dia.",
        category: "water"
    },
    {
        id: 11,
        title: "Compre produtos locais",
        content: "Produtos locais geram menos emissões de transporte e fortalecem a economia regional.",
        category: "sustainability"
    },
    {
        id: 12,
        title: "Use lâmpadas LED",
        content: "LEDs consomem 80% menos energia e duram 25 vezes mais que incandescentes.",
        category: "energy"
    },
    {
        id: 13,
        title: "Composte resíduos orgânicos",
        content: "Cerca de 50% do lixo doméstico é orgânico e pode virar adubo para plantas.",
        category: "sustainability"
    },
    {
        id: 14,
        title: "Feche a torneira ao escovar dentes",
        content: "Isso economiza até 12 litros de água por escovação.",
        category: "water"
    },
    {
        id: 15,
        title: "Evite plásticos descartáveis",
        content: "Use potes de vidro, garrafas reutilizáveis e talheres de metal.",
        category: "sustainability"
    },
    {
        id: 16,
        title: "Desligue as luzes ao sair",
        content: "Um hábito simples que pode reduzir sua conta de luz em até 15%.",
        category: "energy"
    },
    {
        id: 17,
        title: "Verifique a pressão da água",
        content: "Pressão alta desperdiça água. Reguladores de pressão ajudam a economizar.",
        category: "water"
    },
    {
        id: 18,
        title: "Recicle corretamente",
        content: "Separe o lixo adequadamente. Materiais recicláveis incorretos contaminam a reciclagem.",
        category: "sustainability"
    },
    {
        id: 19,
        title: "Use o modo econômico dos eletrodomésticos",
        content: "Máquinas de lavar e louças têm modos eco que economizam água e energia.",
        category: "energy"
    },
    {
        id: 20,
        title: "Plante em hortas verticais",
        content: "Hortas verticais economizam espaço, água e ainda isolam termicamente paredes.",
        category: "daily"
    }
];

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'sustainability': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'energy': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'water': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
        case 'daily': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'sustainability': return 'Sustentabilidade';
        case 'energy': return 'Energia';
        case 'water': return 'Agua';
        case 'daily': return 'Dia a Dia';
        default: return 'Geral';
    }
};

const TipsView: React.FC = () => {
    const { cardClass, classes, density } = useTheme();
    const [currentTip, setCurrentTip] = useState<Tip>(TIPS_DATABASE[0]);
    const [history, setHistory] = useState<number[]>([]);

    const getRandomTip = () => {
        let availableTips = TIPS_DATABASE.filter(tip => !history.includes(tip.id));
        
        // Se todas as dicas ja foram vistas, reseta o historico
        if (availableTips.length === 0) {
            availableTips = TIPS_DATABASE;
            setHistory([]);
        }
        
        const randomIndex = Math.floor(Math.random() * availableTips.length);
        const newTip = availableTips[randomIndex];
        
        setCurrentTip(newTip);
        setHistory(prev => [...prev, newTip.id]);
    };

    useEffect(() => {
        // Mostrar dica aleatoria inicial
        getRandomTip();
    }, []);

    return (
        <div className="h-full overflow-y-auto pb-24 pt-16 lg:pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${classes.bg} bg-opacity-20`}>
                        <LightbulbIcon className={`w-6 h-6 ${classes.text}`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Dicas Sustentáveis</h2>
                        <p className="text-sm text-gray-400">Pequenas ações, grandes mudanças</p>
                    </div>
                </div>

                {/* Dica do Dia */}
                <div className={`${cardClass} rounded-3xl p-6 animate-enter`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(currentTip.category)}`}>
                            {getCategoryLabel(currentTip.category)}
                        </span>
                        <button 
                            onClick={getRandomTip}
                            className={`p-2 rounded-lg ${classes.bg} bg-opacity-30 hover:bg-opacity-50 transition-colors`}
                            title="Nova dica"
                        >
                            <RefreshCwIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">
                        {currentTip.title}
                    </h3>
                    
                    <p className="text-gray-300 leading-relaxed text-base">
                        {currentTip.content}
                    </p>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Dica {history.length} de {TIPS_DATABASE.length}
                        </span>
                        <button 
                            onClick={getRandomTip}
                            className={`${classes.bg} hover:brightness-110 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95`}
                        >
                            Proxima Dica
                        </button>
                    </div>
                </div>

                {/* Estatisticas */}
                <div className={`${cardClass} rounded-2xl p-5`}>
                    <h4 className="font-semibold text-white mb-4">Impacto das suas ações</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-emerald-400">20</div>
                            <div className="text-xs text-gray-500">Dicas disponiveis</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-cyan-400">4</div>
                            <div className="text-xs text-gray-500">Categorias</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">Infinito</div>
                            <div className="text-xs text-gray-500">Impacto possivel</div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500 pt-4">
                    As dicas sao armazenadas localmente no seu dispositivo.
                    <br />
                    Novas dicas adicionadas em atualizações futuras.
                </div>
            </div>
        </div>
    );
};

export default TipsView;
