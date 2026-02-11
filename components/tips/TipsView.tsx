
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { LightbulbIcon, RefreshCwIcon, XIcon, InfoIcon } from '../icons';

interface Tip {
    id: number;
    title: string;
    content: string;
    details: string;
    category: 'sustainability' | 'energy' | 'water' | 'daily';
}

const TIPS_DATABASE: Tip[] = [
    {
        id: 1,
        title: "Desligue aparelhos em standby",
        content: "Eletrônicos em standby consomem até 10% da energia da sua casa.",
        details: "Aparelhos como TVs, computadores e carregadores continuam consumindo energia mesmo 'desligados'. Use filtros de linha com interruptor para cortar completamente a energia quando não estiver usando. Isso pode economizar até R$ 15 por mês na conta de luz.",
        category: "energy"
    },
    {
        id: 2,
        title: "Aproveite a luz natural",
        content: "Abra as cortinas durante o dia para reduzir o consumo de energia.",
        details: "A luz natural não apenas economiza energia elétrica, mas também melhora o humor e aumenta a produtividade. Posicione sua mesa de trabalho perto de janelas e use cores claras nas paredes para refletir melhor a luz.",
        category: "daily"
    },
    {
        id: 3,
        title: "Reutilize água da chuva",
        content: "Instale um coletor de água da chuva para regar plantas e limpar áreas externas.",
        details: "Um sistema simples de coleta pode economizar até 500 litros de água potável por mês. A água da chuva é livre de cloro e melhor para as plantas. Use tambores ou cisternas para armazenar.",
        category: "water"
    },
    {
        id: 4,
        title: "Opte por transporte sustentável",
        content: "Caminhar, pedalar ou usar transporte público reduz emissões de CO₂.",
        details: "Deixar o carro em casa 2 dias por semana evita a emissão de cerca de 200kg de CO₂ por ano. Além do benefício ambiental, você economiza combustível e melhora sua saúde cardiovascular.",
        category: "sustainability"
    },
    {
        id: 5,
        title: "Tome banhos mais curtos",
        content: "Reduzir o banho em 5 minutos economiza até 45 litros de água por dia.",
        details: "Um chuveiro elétrico típico consome 9 litros por minuto. Tomar banhos de 5 minutos ao invés de 10 pode economizar mais de 16 mil litros de água por ano por pessoa. Use um timer para se ajudar.",
        category: "water"
    },
    {
        id: 6,
        title: "Use sacolas reutilizáveis",
        content: "Uma sacola plástica leva 400 anos para se decompor na natureza.",
        details: "O Brasil consome cerca de 40 bilhões de sacolas plásticas por ano. Levar sua própria sacola de pano ou material reciclável evita que plásticos acabem nos oceanos e ameacem a vida marinha.",
        category: "sustainability"
    },
    {
        id: 7,
        title: "Descongele a geladeira regularmente",
        content: "Gelo acima de 5mm aumenta o consumo de energia em até 30%.",
        details: "O gelo atua como isolante térmico, forçando o motor da geladeira a trabalhar mais. Faça o descongelamento quando o gelo atingir 5mm de espessura. Modeles frost free já fazem isso automaticamente.",
        category: "energy"
    },
    {
        id: 8,
        title: "Plante árvores nativas",
        content: "Árvores nativas atraem polinizadores locais e precisam de menos água.",
        details: "Uma árvore adulta absorve cerca de 22kg de CO₂ por ano. Espécies nativas estão adaptadas ao clima local, necessitam de menos irrigação e oferecem alimento e abrigo para pássaros e insetos nativos.",
        category: "sustainability"
    },
    {
        id: 9,
        title: "Ajuste o termostato",
        content: "Cada grau abaixo no aquecimento representa 5% de economia de energia.",
        details: "No inverno, mantenha o aquecimento entre 18°C e 20°C. No verão, o ar-condicionado em 23°C é suficiente. Use ventiladores de teto para circular o ar - eles consomem 10x menos energia.",
        category: "energy"
    },
    {
        id: 10,
        title: "Repare vazamentos imediatamente",
        content: "Uma torneira pingando desperdiça até 46 litros de água por dia.",
        details: "Um vazamento aparentemente pequeno pode desperdiçar mais de 1.300 litros de água por mês. Verifique regularmente torneiras, válvulas de descarga e caixas d'água. Consertos simples evitam desperdício e economizam dinheiro.",
        category: "water"
    },
    {
        id: 11,
        title: "Compre produtos locais",
        content: "Produtos locais geram menos emissões de transporte e fortalecem a economia regional.",
        details: "Alimentos que viajam menos de 100km geram 5x menos emissões que importados. Comprar de produtores locais também garante alimentos mais frescos, nutritivos e apoia a economia da sua comunidade.",
        category: "sustainability"
    },
    {
        id: 12,
        title: "Use lâmpadas LED",
        content: "LEDs consomem 80% menos energia e duram 25 vezes mais que incandescentes.",
        details: "Uma lâmpada LED de 9W produz a mesma luminosidade que uma incandescente de 60W. Apesar do preço inicial maior, a economia na conta de luz compensa em poucos meses. Duram em média 25.000 horas.",
        category: "energy"
    },
    {
        id: 13,
        title: "Composte resíduos orgânicos",
        content: "Cerca de 50% do lixo doméstico é orgânico e pode virar adubo.",
        details: "A compostagem reduz o volume de lixo enviado a aterros e produz adubo rico em nutrientes para plantas. Restos de frutas, legumes, cascas de ovos e borra de café são excelentes para compostagem.",
        category: "sustainability"
    },
    {
        id: 14,
        title: "Feche a torneira ao escovar dentes",
        content: "Isso economiza até 12 litros de água por escovação.",
        details: "Escovar os dentes com a torneira aberta desperdiça cerca de 6 litros por minuto. Uma família de 4 pessoas pode economizar mais de 17 mil litros de água por ano apenas com esse hábito simples.",
        category: "water"
    },
    {
        id: 15,
        title: "Evite plásticos descartáveis",
        content: "Use potes de vidro, garrafas reutilizáveis e talheres de metal.",
        details: "O plástico descartável é usado em média por 12 minutos, mas polui por 400 anos. Substituir garrafas PET por reutilizáveis pode evitar o descarte de 167 garrafas por pessoa por ano.",
        category: "sustainability"
    },
    {
        id: 16,
        title: "Desligue as luzes ao sair",
        content: "Um hábito simples que pode reduzir sua conta de luz em até 15%.",
        details: "Instale sensores de presença em áreas de passagem. Use timers para luzes externas. Ensine as crianças desde cedo sobre esse hábito. A iluminação representa cerca de 20% do consumo residencial.",
        category: "energy"
    },
    {
        id: 17,
        title: "Verifique a pressão da água",
        content: "Pressão alta desperdiça água. Reguladores ajudam a economizar.",
        details: "A pressão ideal é entre 10 e 20 metros de coluna d'água (mca). Acima disso, a água é desperdiçada em espirros e a tubulação sofre mais desgaste. Reguladores de pressão são baratos e fáceis de instalar.",
        category: "water"
    },
    {
        id: 18,
        title: "Recicle corretamente",
        content: "Separe o lixo adequadamente. Materiais contaminados não são reciclados.",
        details: "Lave embalagens antes de descartar. Papel oleado, espelhos e cerâmicas não são recicláveis. Pilhas e baterias devem ir em pontos de coleta específicos. A contaminação pode comprometer toneladas de material reciclável.",
        category: "sustainability"
    },
    {
        id: 19,
        title: "Use o modo econômico dos eletrodomésticos",
        content: "Máquinas de lavar e louças têm modos eco que economizam água e energia.",
        details: "O modo eco pode economizar até 30% de energia e 20% de água. Aproveite a capacidade máxima da máquina - lavar meia carga consome quase a mesma energia que carga cheia. Evite pré-lavagem desnecessária.",
        category: "energy"
    },
    {
        id: 20,
        title: "Plante em hortas verticais",
        content: "Hortas verticais economizam espaço, água e isolam termicamente paredes.",
        details: "Hortas verticais podem reduzir a temperatura interna em até 5°C, diminuindo o uso de ar-condicionado. Usam até 70% menos água que hortas tradicionais devido à recirculação. Ideais para apartamentos.",
        category: "daily"
    },
    {
        id: 21,
        title: "Lave roupas com água fria",
        content: "90% da energia da máquina de lavar vai para aquecer a água.",
        details: "Roupas do dia a dia limpam perfeitamente com água fria e detergente adequado. Reserve a água quente apenas para lençóis e roupas muito sujas. Essa mudança pode economizar R$ 20 por mês.",
        category: "energy"
    },
    {
        id: 22,
        title: "Reutilize papel antes de reciclar",
        content: "Use o verso de folhas impressas para rascunhos e anotações.",
        details: "Uma árvore produz cerca de 10 mil folhas de papel. Usar os dois lados do papel dobra o aproveitamento. Configure a impressora para modo rascunho e imprima frente e verso sempre que possível.",
        category: "sustainability"
    },
    {
        id: 23,
        title: "Instale arejadores nas torneiras",
        content: "Arejadores misturam ar na água, reduzindo o fluxo em até 50%.",
        details: "Esses dispositivos baratos mantêm a sensação de pressão enquanto economizam água. Uma torneira com arejador consome 6 litros/minuto contra 12-15 de uma torneira comum. Pagam-se em poucas semanas.",
        category: "water"
    },
    {
        id: 24,
        title: "Descongele alimentos na geladeira",
        content: "Alimentos congelados ajudam a refrigerar a geladeira ao descongelar.",
        details: "Tirar alimentos do freezer e colocar na parte inferior da geladeira para descongelar ajuda a manter a temperatura interna. Isso reduz o trabalho do compressor e economiza energia.",
        category: "energy"
    },
    {
        id: 25,
        title: "Colete água do ar-condicionado",
        content: "A condensação do ar-condicionado pode ser reutilizada para limpeza.",
        details: "Um ar-condicionado de 12.000 BTUs gera cerca de 3 litros de água por dia. Essa água é praticamente destilada e ideal para limpar pisos, lavar calçadas e regar plantas. Instale uma mangueira de coleta.",
        category: "water"
    },
    {
        id: 26,
        title: "Prefira produtos a granel",
        content: "Comprar a granel reduz embalagens e permite comprar apenas o necessário.",
        details: "Mercados a granel permitem usar seus próprios potes e sacolas. Você evita embalagens desnecessárias e compra quantidades exatas, reduzindo desperdício de alimentos que estragariam.",
        category: "sustainability"
    },
    {
        id: 27,
        title: "Mantença os filtros de ar limpos",
        content: "Filtros sujos fazem aparelhos trabalharem mais e consumirem mais energia.",
        details: "Limpe os filtros do ar-condicionado a cada 15 dias. Filtros de exaustores e aspiradores também precisam de manutenção regular. Aparelhos limpos duram mais e funcionam com eficiência máxima.",
        category: "energy"
    },
    {
        id: 28,
        title: "Reaproveite água da lavagem de arroz",
        content: "Água de arroz é rica em nutrientes e ótima para regar plantas.",
        details: "A água de lavagem do arroz contém amido e vitaminas do grupo B que fertilizam o solo. Deixe esfriar antes de usar nas plantas. Não use se contiver sal ou temperos.",
        category: "water"
    },
    {
        id: 29,
        title: "Use cortinas térmicas",
        content: "Cortinas térmicas bloqueiam calor no verão e retêm no inverno.",
        details: "Cortinas blackout ou térmicas podem reduzir o ganho de calor em até 40%. No inverno, mantêm o calor interno. Use-as estrategicamente conforme a orientação solar das janelas.",
        category: "energy"
    },
    {
        id: 30,
        title: "Evite o pré-lavar da máquina",
        content: "O ciclo de pré-lavagem dobra o consumo de água e energia.",
        details: "Roupas do dia a dia raramente precisam de pré-lavagem. Remova manchas localizadas antes de lavar. Para roupas muito sujas, deixe de molho em balde antes de colocar na máquina.",
        category: "water"
    },
    {
        id: 31,
        title: "Faça manutenção no carro",
        content: "Carros bem regulados poluem menos e consomem menos combustível.",
        details: "Pneus calibrados corretamente economizam até 3% de combustível. Filtros de ar limpos, velas novas e alinhamento correto melhoram a eficiência. Um carro mal regulado pode poluir 50% mais.",
        category: "sustainability"
    },
    {
        id: 32,
        title: "Use a lava-louças só quando cheia",
        content: "Uma lava-louças meia cheia gasta quase a mesma energia que cheia.",
        details: "A lava-louças economiza água comparada à lavagem manual quando usada corretamente. Uma máquina cheia gasta cerca de 10 litros, enquanto lavar na pia pode gastar até 40 litros.",
        category: "energy"
    },
    {
        id: 33,
        title: "Reduza o uso do secador de cabelo",
        content: "Secadores consomem entre 800W e 2000W de energia.",
        details: "Deixe o cabelo secar naturalmente sempre que possível. Se precisar usar o secador, remova o excesso de água com a toalha primeiro e use a temperatura morna, não a quente. Isso também protege os fios.",
        category: "energy"
    },
    {
        id: 34,
        title: "Armazene água em garrafas escuras",
        content: "Garrafas escuras evitam o crescimento de algas na água armazenada.",
        details: "Se você armazena água da chuva ou reutilizada, use recipientes escuros ou pinte-os de preto/azul escuro. A luz solar promove o crescimento de algas. Mantenha os recipientes tampados.",
        category: "water"
    },
    {
        id: 35,
        title: "Compre roupas de qualidade",
        content: "Roupas duráveis geram menos lixo têxtil e economizam dinheiro a longo prazo.",
        details: "A indústria têxtil é uma das mais poluentes do mundo. Prefira peças atemporais de boa qualidade. O custo por uso de uma roupa de qualidade é menor que o de roupas baratas que duram pouco.",
        category: "sustainability"
    },
    {
        id: 36,
        title: "Use o ferro de passar acumulado",
        content: "Passar várias peças de uma vez aproveita o calor residual do ferro.",
        details: "O ferro de passar consome muita energia para esquentar. Organize-se para passar várias peças em sequência, começando pelas que precisam de menos calor. Desligue antes de terminar e use o calor residual.",
        category: "energy"
    },
    {
        id: 37,
        title: "Plante plantas adaptadas ao clima local",
        content: "Plantas nativas precisam de menos água, fertilizantes e cuidados.",
        details: "Paisagismo com espécies nativas é chamado de jardinagem sustentável. Essas plantas já estão adaptadas às condições locais de solo e clima, resistem a pragas naturais e atraem fauna benéfica.",
        category: "water"
    },
    {
        id: 38,
        title: "Evite embalagens individuais",
        content: "Produtos a granel ou em embalagens maiores geram menos resíduos.",
        details: "Embalagens individuais geram até 40% mais lixo que as convencionais. Prefira comprar o maior tamanho possível e divida em potes reutilizáveis em casa. Você paga menos pelo produto e gera menos lixo.",
        category: "sustainability"
    },
    {
        id: 39,
        title: "Aproveite o calor do sol para secar roupas",
        content: "Secadoras consomem muita energia; o sol é gratuito e bactericida.",
        details: "O sol é um desinfetante natural que elimina ácaros e bactérias. Roupas secas ao sol têm cheiro agradável e duram mais. Em dias chuvosos, use varais internos próximos a janelas ventiladas.",
        category: "energy"
    },
    {
        id: 40,
        title: "Troque sabonetes líquidos por em barra",
        content: "Sabonetes em barra têm menos embalagem e duram mais.",
        details: "Sabonetes líquidos vêm em embalagens plásticas e contêm muita água. Os em barra têm menos embalagem, duram mais e têm fórmulas mais concentradas. Alguns vêm embalados apenas em papel reciclável.",
        category: "sustainability"
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
        case 'water': return 'Água';
        case 'daily': return 'Dia a Dia';
        default: return 'Geral';
    }
};

// Gera índices aleatórios baseados na data para rotação diária
const getDailyTips = (): number[] => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Shuffle baseado no seed do dia
    const indices = Array.from({ length: TIPS_DATABASE.length }, (_, i) => i);
    const shuffled = indices.sort(() => {
        const x = Math.sin(seed + indices.length) * 10000;
        return x - Math.floor(x);
    });
    
    return shuffled.slice(0, 3);
};

const TipsView: React.FC = () => {
    const { cardClass, classes } = useTheme();
    const [currentIndices, setCurrentIndices] = useState<number[]>([]);
    const [selectedTip, setSelectedTip] = useState<Tip | null>(null);

    useEffect(() => {
        // Carrega 3 dicas do dia ao abrir o app
        setCurrentIndices(getDailyTips());
    }, []);

    const getNewTips = () => {
        // Gera 3 novas dicas aleatórias
        const allIndices = Array.from({ length: TIPS_DATABASE.length }, (_, i) => i);
        const shuffled = allIndices.sort(() => Math.random() - 0.5);
        setCurrentIndices(shuffled.slice(0, 3));
    };

    const currentTips = currentIndices.map(i => TIPS_DATABASE[i]).filter(Boolean);

    return (
        <div className="h-full overflow-y-auto pb-24 pt-16 lg:pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${classes.bg} bg-opacity-20`}>
                            <LightbulbIcon className={`w-6 h-6 ${classes.text}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Dicas Sustentáveis</h2>
                            <p className="text-sm text-gray-400">Pequenas ações, grandes mudanças</p>
                        </div>
                    </div>
                    <button 
                        onClick={getNewTips}
                        className={`p-2 rounded-lg ${classes.bg} bg-opacity-30 hover:bg-opacity-50 transition-colors`}
                        title="Novas dicas"
                    >
                        <RefreshCwIcon className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Lista de 3 Dicas */}
                <div className="space-y-4">
                    {currentTips.map((tip, index) => (
                        <div 
                            key={tip.id}
                            className={`${cardClass} rounded-2xl p-5 animate-enter`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${classes.bg} bg-opacity-20 flex items-center justify-center`}>
                                    <span className={`text-lg font-bold ${classes.text}`}>{index + 1}</span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getCategoryColor(tip.category)}`}>
                                            {getCategoryLabel(tip.category)}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {tip.title}
                                    </h3>
                                    
                                    <p className="text-gray-400 text-sm mb-3">
                                        {tip.content}
                                    </p>
                                    
                                    <button 
                                        onClick={() => setSelectedTip(tip)}
                                        className={`text-sm font-medium ${classes.text} hover:underline flex items-center gap-1`}
                                    >
                                        <InfoIcon className="w-4 h-4" />
                                        Ver detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Estatísticas */}
                <div className={`${cardClass} rounded-2xl p-5`}>
                    <h4 className="font-semibold text-white mb-4">Impacto das suas ações</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-emerald-400">40</div>
                            <div className="text-xs text-gray-500">Dicas disponíveis</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-cyan-400">4</div>
                            <div className="text-xs text-gray-500">Categorias</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">∞</div>
                            <div className="text-xs text-gray-500">Impacto possível</div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500 pt-4">
                    As dicas são atualizadas automaticamente a cada dia.
                    <br />
                    Novas dicas adicionadas em atualizações futuras.
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedTip && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-enter"
                    onClick={() => setSelectedTip(null)}
                >
                    <div 
                        className={`${cardClass} rounded-2xl p-6 max-w-md w-full animate-enter`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(selectedTip.category)}`}>
                                {getCategoryLabel(selectedTip.category)}
                            </span>
                            <button 
                                onClick={() => setSelectedTip(null)}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-3">
                            {selectedTip.title}
                        </h3>
                        
                        <p className="text-gray-300 leading-relaxed mb-4">
                            {selectedTip.content}
                        </p>
                        
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <LightbulbIcon className="w-4 h-4 text-yellow-400" />
                                Saiba mais
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {'details' in selectedTip ? selectedTip.details : 'Detalhes em breve...'}
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => setSelectedTip(null)}
                            className={`w-full mt-6 ${classes.bg} hover:brightness-110 text-white py-3 rounded-xl font-medium transition-all`}
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TipsView;
