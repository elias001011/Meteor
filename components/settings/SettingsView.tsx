import React, { useEffect, useState } from 'react';
import type {
  AppSettings, AppTheme, BackgroundMode, ClockDisplayMode, DataSource,
  ForecastDetailView, LayoutDensity, MapTheme, StartupBehavior, View,
  ZenModeBackground, ZenModeSound, ZenModeStyle,
} from '../../types';
import { exportAppData, getSettings, resetAllData, resetCache, resetSettings } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangleIcon, FileTextIcon, GithubIcon, GlobeIcon } from '../icons';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChanged: (newSettings: AppSettings) => void;
  onClearHistory: () => void;
  onOpenImport: () => void;
  onOpenChangelog: () => void;
  onOpenCitySelection: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'ai' | 'data' | 'about';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'Geral' }, { id: 'appearance', label: 'Aparência' },
  { id: 'ai', label: 'IA' }, { id: 'data', label: 'Dados' }, { id: 'about', label: 'Sobre' },
];

const themes: Array<{ id: AppTheme; label: string; color: string }> = [
  { id: 'cyan', label: 'Ciano', color: 'bg-cyan-500' }, { id: 'blue', label: 'Azul', color: 'bg-blue-600' },
  { id: 'purple', label: 'Roxo', color: 'bg-purple-600' }, { id: 'emerald', label: 'Verde', color: 'bg-emerald-600' },
  { id: 'rose', label: 'Rosa', color: 'bg-rose-600' }, { id: 'amber', label: 'Âmbar', color: 'bg-amber-500' },
];

const Panel: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => {
  const { cardClass } = useTheme();
  return (
    <section className={`rounded-2xl p-4 sm:p-5 ${cardClass}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
};

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChanged, onClearHistory, onOpenImport, onOpenChangelog, onOpenCitySelection }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const { classes, isPerformanceMode } = useTheme();

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const save = (patch: Partial<AppSettings>) => onSettingsChanged({ ...settings, ...patch });
  const notify = (message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => setFeedbackMessage(null), 2600);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { notify('O navegador bloqueou o modo tela cheia.'); }
  };

  const handleReset = (type: 'settings' | 'cache' | 'history' | 'all') => {
    if (!window.confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    if (type === 'settings') { resetSettings(); onSettingsChanged(getSettings()); notify('Ajustes restaurados.'); }
    else if (type === 'cache') { resetCache(); notify('Cache do clima removido.'); }
    else if (type === 'history') { onClearHistory(); notify('Histórico da IA removido.'); }
    else { resetAllData(); window.location.reload(); }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText('8001be0f-4952-4ef8-b2a5-9bafe691c65c');
      setPixCopied(true);
      window.setTimeout(() => setPixCopied(false), 2000);
    } catch { notify('Não foi possível copiar automaticamente.'); }
  };

  const inputClass = `w-full rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:ring-1 ${classes.ring}`;
  const optionClass = 'bg-[#15191f] text-white';

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-6 w-10 flex-none rounded-full transition-colors ${checked ? classes.bg : 'bg-slate-700'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-[left] ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  );

  const Row = ({ title, description, action }: { title: string; description?: string; action: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-5 rounded-xl px-1 py-2.5">
      <div className="min-w-0"><p className="text-sm font-medium text-slate-200">{title}</p>{description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>}</div>
      {action}
    </div>
  );

  const Segment = <T extends string,>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) => (
    <div className="flex min-w-0 rounded-xl bg-black/20 p-1">
      {options.map(option => <button type="button" key={option.value} onClick={() => onChange(option.value)} className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 text-xs transition-colors ${value === option.value ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-300'}`}>{option.label}</button>)}
    </div>
  );

  const renderGeneral = () => (
    <div className="space-y-4">
      <Panel title="Ao abrir o Meteor" description="Escolha a tela ou a localização carregada na inicialização.">
        <select value={settings.startupBehavior} onChange={event => { const behavior = event.target.value as StartupBehavior; save({ startupBehavior: behavior }); if (behavior === 'specific_location' && !settings.specificLocation) onOpenCitySelection(); }} className={inputClass}>
          <option value="idle" className={optionClass}>Mostrar a busca</option><option value="last_location" className={optionClass}>Abrir a última localização</option>
          <option value="specific_location" className={optionClass}>Abrir uma localização escolhida</option><option value="custom_section" className={optionClass}>Abrir uma seção específica</option>
        </select>
        {settings.startupBehavior === 'custom_section' && <select value={settings.startupSection || 'weather'} onChange={event => save({ startupSection: event.target.value as View })} className={`${inputClass} mt-3`}>
          <option value="weather" className={optionClass}>Clima</option><option value="map" className={optionClass}>Mapa</option><option value="ai" className={optionClass}>Meteor IA</option><option value="news" className={optionClass}>Notícias</option><option value="alerts" className={optionClass}>Alertas</option>
        </select>}
        {settings.startupBehavior === 'specific_location' && <button type="button" onClick={onOpenCitySelection} className="mt-3 w-full rounded-xl bg-white/[0.04] px-3.5 py-3 text-left text-sm text-slate-300 hover:bg-white/[0.07]">{settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Selecionar localização'}</button>}
      </Panel>
      <Panel title="Clima e unidades">
        <div className="space-y-2">
          <Segment value={settings.unitSystem} options={[{ value: 'metric', label: 'Métrico · °C' }, { value: 'imperial', label: 'Imperial · °F' }]} onChange={unitSystem => save({ unitSystem })} />
          <Row title="Relógio no cabeçalho" action={<Toggle label="Relógio no cabeçalho" checked={settings.showClock} onChange={() => save({ showClock: !settings.showClock })} />} />
          <div className="px-1 pt-1"><label className="mb-2 block text-xs text-slate-500">Horário local no card principal</label><select value={settings.clockDisplayMode} onChange={event => save({ clockDisplayMode: event.target.value as ClockDisplayMode })} className={inputClass}><option value="always" className={optionClass}>Sempre mostrar</option><option value="different_zone" className={optionClass}>Somente em outro fuso</option><option value="never" className={optionClass}>Não mostrar</option></select></div>
        </div>
      </Panel>
      <Panel title="Navegador">
        <div className="space-y-1">
          <Row title="Tela cheia" description="É ativada somente após um clique, como exigido pelo navegador." action={<button type="button" onClick={toggleFullscreen} className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.1]">{isFullscreen ? 'Sair' : 'Ativar'}</button>} />
          <Row title="Exibir barras de rolagem" action={<Toggle label="Exibir barras de rolagem" checked={settings.showScrollbars} onChange={() => save({ showScrollbars: !settings.showScrollbars })} />} />
          <Row title="Modo de desempenho" description="Reduz transparência e movimento em aparelhos mais lentos." action={<Toggle label="Modo de desempenho" checked={settings.performanceMode} onChange={() => save({ performanceMode: !settings.performanceMode })} />} />
        </div>
      </Panel>
    </div>
  );

  const renderAppearance = () => {
    const transparency = settings.transparencyMode === 'off' || settings.transparencyMode === 'glass' ? settings.transparencyMode : 'subtle';
    return <div className="space-y-4">
      <Panel title="Cores">
        <Row title="Cor automática" description="Adapta o destaque à condição do tempo." action={<Toggle label="Cor automática" checked={settings.dynamicTheme} onChange={() => save({ dynamicTheme: !settings.dynamicTheme })} />} />
        <div className={`mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 ${settings.dynamicTheme ? 'pointer-events-none opacity-40' : ''}`}>{themes.map(theme => <button type="button" key={theme.id} onClick={() => save({ themeColor: theme.id })} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs ${settings.themeColor === theme.id ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:bg-white/[0.04]'}`}><span className={`h-3 w-3 rounded-full ${theme.color}`} />{theme.label}</button>)}</div>
      </Panel>
      <Panel title="Superfície" description="Os modos mantêm o mesmo layout; muda apenas o fundo e a opacidade.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-2 block text-xs text-slate-500">Fundo</label><Segment<BackgroundMode> value={settings.backgroundMode} options={[{ value: 'solid', label: 'Sólido' }, { value: 'gradient', label: 'Gradiente' }, { value: 'amoled', label: 'AMOLED' }]} onChange={backgroundMode => save({ backgroundMode })} /></div>
          <div className={isPerformanceMode ? 'pointer-events-none opacity-40' : ''}><label className="mb-2 block text-xs text-slate-500">Transparência</label><Segment value={transparency} options={[{ value: 'off', label: 'Sólido' }, { value: 'subtle', label: 'Sutil' }, { value: 'glass', label: 'Vidro' }]} onChange={transparencyMode => save({ transparencyMode })} /></div>
          <div><label className="mb-2 block text-xs text-slate-500">Densidade</label><Segment<LayoutDensity> value={settings.layoutDensity} options={[{ value: 'compact', label: 'Compacta' }, { value: 'comfortable', label: 'Confortável' }]} onChange={layoutDensity => save({ layoutDensity })} /></div>
          <div><label className="mb-2 block text-xs text-slate-500">Mapa</label><Segment<MapTheme> value={settings.mapTheme} options={[{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }]} onChange={mapTheme => save({ mapTheme })} /></div>
        </div>
      </Panel>
      <Panel title="Conteúdo da previsão">
        <div className="space-y-1">
          <Row title="Recomendações do clima" action={<Toggle label="Recomendações do clima" checked={settings.weatherInsights.enabled} onChange={() => save({ weatherInsights: { ...settings.weatherInsights, enabled: !settings.weatherInsights.enabled } })} />} />
          <Row title="Detalhes ao tocar na previsão" description="Inclui vento, umidade, UV e outras métricas." action={<Toggle label="Detalhes da previsão" checked={settings.forecastComplexity === 'advanced'} onChange={() => save({ forecastComplexity: settings.forecastComplexity === 'advanced' ? 'basic' : 'advanced' })} />} />
          {settings.forecastComplexity === 'advanced' && <div className="px-1 py-2"><select value={settings.forecastDetailView} onChange={event => save({ forecastDetailView: event.target.value as ForecastDetailView })} className={inputClass}><option value="both" className={optionClass}>Previsão horária e diária</option><option value="forecast_only" className={optionClass}>Somente horária</option><option value="daily_only" className={optionClass}>Somente diária</option></select></div>}
        </div>
      </Panel>
      <Panel title="Movimento">
        <div className="space-y-1"><Row title="Reduzir animações" action={<Toggle label="Reduzir animações" checked={settings.reducedMotion} onChange={() => save({ reducedMotion: !settings.reducedMotion })} />} /><Row title="Chuva na tela" description="Aparece somente quando a condição indica chuva." action={<Toggle label="Chuva na tela" checked={settings.rainAnimation.enabled} onChange={() => save({ rainAnimation: { ...settings.rainAnimation, enabled: !settings.rainAnimation.enabled } })} />}/>{settings.rainAnimation.enabled && <Segment value={settings.rainAnimation.intensity} options={[{ value: 'low', label: 'Leve' }, { value: 'high', label: 'Forte' }]} onChange={intensity => save({ rainAnimation: { ...settings.rainAnimation, intensity } })} />}</div>
      </Panel>
      <Panel title="Modo Zen">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-2 block text-xs text-slate-500">Apresentação</label><Segment<ZenModeStyle> value={settings.zenMode.style} options={[{ value: 'cinematic', label: 'Cinemática' }, { value: 'minimal', label: 'Minimalista' }]} onChange={style => save({ zenMode: { ...settings.zenMode, style } })} /></div>
          <div><label className="mb-2 block text-xs text-slate-500">Fundo</label><Segment<ZenModeBackground> value={settings.zenMode.background} options={[{ value: 'image', label: 'Foto' }, { value: 'app', label: 'Aplicativo' }]} onChange={background => save({ zenMode: { ...settings.zenMode, background } })} /></div>
        </div>
        <div className="mt-3 space-y-1"><Row title="Exibir dados do clima" action={<Toggle label="Exibir dados no modo Zen" checked={settings.zenMode.showWeatherInfo} onChange={() => save({ zenMode: { ...settings.zenMode, showWeatherInfo: !settings.zenMode.showWeatherInfo } })} />} /><div className="px-1 pt-2"><label className="mb-2 block text-xs text-slate-500">Som ambiente</label><select value={settings.zenMode.ambientSound} onChange={event => save({ zenMode: { ...settings.zenMode, ambientSound: event.target.value as ZenModeSound } })} className={inputClass}><option value="off" className={optionClass}>Desligado</option><option value="rain" className={optionClass}>Chuva suave</option></select></div></div>
      </Panel>
    </div>;
  };

  const renderAi = () => <div className="space-y-4">
    <Panel title="Personalização" description="Esses dados ficam armazenados localmente neste navegador.">
      <div className="space-y-4"><label className="block text-xs text-slate-500">Como a IA deve chamar você?<input type="text" value={settings.userName || ''} onChange={event => save({ userName: event.target.value })} placeholder="Nome ou apelido" maxLength={30} className={`${inputClass} mt-2`} /></label><label className="block text-xs text-slate-500">Preferências de resposta<textarea value={settings.userAiInstructions || ''} onChange={event => save({ userAiInstructions: event.target.value })} placeholder="Ex.: responda de forma direta e use linguagem simples" maxLength={200} className={`${inputClass} mt-2 min-h-24 resize-y`} /></label></div>
    </Panel>
    <div className="flex gap-3 rounded-xl bg-amber-300/[0.06] p-4 text-xs leading-relaxed text-slate-400"><AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-none text-amber-300" />As respostas podem conter erros. Para decisões importantes, confirme os dados em uma fonte oficial.</div>
  </div>;

  const renderData = () => <div className="space-y-4">
    <Panel title="Backup local" description="Exporte ajustes, histórico e cache em um arquivo JSON."><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { exportAppData(); notify('Backup salvo nos downloads.'); }} className="rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-white hover:bg-white/[0.09]">Exportar backup</button><button type="button" onClick={onOpenImport} className="rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-white hover:bg-white/[0.09]">Restaurar backup</button></div></Panel>
    <Panel title="Dados e fonte"><label className="block text-xs text-slate-500">Fonte meteorológica preferida<select value={settings.weatherSource} onChange={event => save({ weatherSource: event.target.value as DataSource | 'auto' })} className={`${inputClass} mt-2`}><option value="auto" className={optionClass}>Automática — recomendado</option><option value="onecall" className={optionClass}>OpenWeather One Call</option><option value="free" className={optionClass}>OpenWeather padrão</option><option value="open-meteo" className={optionClass}>Open-Meteo</option></select></label><div className="mt-3"><Row title="Salvar histórico da IA" description="Mantém as conversas neste navegador." action={<Toggle label="Salvar histórico da IA" checked={settings.saveChatHistory} onChange={() => save({ saveChatHistory: !settings.saveChatHistory })} />}/></div></Panel>
    <Panel title="Limpeza" description="Escolha exatamente o que deseja remover."><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => handleReset('settings')} className="rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-slate-300 hover:bg-white/[0.07]">Restaurar ajustes</button><button type="button" onClick={() => handleReset('cache')} className="rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-slate-300 hover:bg-white/[0.07]">Limpar cache</button><button type="button" onClick={() => handleReset('history')} className="rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-slate-300 hover:bg-white/[0.07]">Limpar histórico da IA</button><button type="button" onClick={() => handleReset('all')} className="rounded-xl bg-red-400/[0.1] px-3 py-3 text-sm text-red-300 hover:bg-red-400/[0.15]">Apagar dados locais</button></div></Panel>
  </div>;

  const renderAbout = () => <div className="space-y-4">
    <Panel title="Meteor 6.0.0" description="Previsão, notícias, mapa e contexto climático em um só lugar."><button type="button" onClick={onOpenChangelog} className="rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-white/[0.04] hover:text-white">Ver histórico de mudanças</button></Panel>
    <Panel title="Links"><div className="grid gap-2">{[
      { href: 'https://policies-meteor-ai.netlify.app/', label: 'Política de privacidade', icon: <FileTextIcon className="h-4 w-4" /> }, { href: 'https://sobre-meteor-ai.netlify.app/', label: 'Sobre o projeto', icon: <GlobeIcon className="h-4 w-4" /> }, { href: 'https://github.com/elias001011/Meteor', label: 'Código no GitHub', icon: <GithubIcon className="h-4 w-4" /> },
    ].map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white">{link.icon}{link.label}</a>)}</div></Panel>
    <Panel title="Apoie o projeto" description="Contribuição opcional via Pix."><code className="block break-all rounded-xl bg-black/20 px-3 py-3 text-xs text-slate-400">8001be0f-4952-4ef8-b2a5-9bafe691c65c</code><button type="button" onClick={handleCopyPix} className={`mt-2 w-full rounded-xl px-4 py-3 text-sm ${pixCopied ? `${classes.bg} text-white` : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.09]'}`}>{pixCopied ? 'Chave copiada' : 'Copiar chave Pix'}</button></Panel>
  </div>;

  return <div className="mx-auto max-w-4xl px-4 pb-32 pt-6 sm:px-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight text-white">Ajustes</h2><p className="mt-1 text-sm text-slate-500">Preferências salvas neste navegador.</p></div><nav className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/[0.035] p-1" aria-label="Seções dos ajustes">{tabs.map(tab => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`flex-none rounded-lg px-3 py-2 text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-200'}`}>{tab.label}</button>)}</nav></div>
    {feedbackMessage && <div role="status" className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#15191f] px-4 py-3 text-sm text-slate-200 shadow-xl">{feedbackMessage}</div>}
    {activeTab === 'general' && renderGeneral()}{activeTab === 'appearance' && renderAppearance()}{activeTab === 'ai' && renderAi()}{activeTab === 'data' && renderData()}{activeTab === 'about' && renderAbout()}
  </div>;
};

export default SettingsView;
