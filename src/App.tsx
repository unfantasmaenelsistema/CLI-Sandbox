import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Folder,
  GraduationCap,
  HardDrive,
  Lightbulb,
  Moon,
  Network,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ChallengeCategory,
  GuidedChallenge,
  ShellMode,
  SystemHealthState,
  TerminalHistoryEntry,
  VFSNode,
} from './types/cli';
import { GUIDED_CHALLENGES } from './data/challenges';
import { ACHIEVEMENTS, COMMAND_REFERENCE } from './data/referenceManual';
import {
  createInitialSystemState,
  executeCommand,
  getLinuxNodeByPath,
  getWinNodeByPath,
} from './engine/cliEngine';
import { PermissionsCalculator } from './components/PermissionsCalculator';

type ActiveSection = 'sandbox' | 'retos' | 'manual' | 'logros';
type InspectorTab = 'vfs' | 'discos' | 'procesos' | 'redes';

const STORAGE_KEY_PROGRESS = 'ghost_cli_sandbox_progress_v2';
const STORAGE_KEY_SESSION = 'ghost_cli_sandbox_terminal_session_v1';

interface SavedProgress {
  studentName: string;
  completedStepIds: string[];
  completedChallengeIds: string[];
  examCompletedChallengeIds: string[];
  unlockedAchievementIds: string[];
  usedBash: boolean;
  usedCmd: boolean;
  usedPipeAndRedirect: boolean;
  totalCommandsRun: number;
}

interface SavedTerminalSession {
  history: TerminalHistoryEntry[];
  cmdHistoryList: string[];
  systemState: SystemHealthState;
  shell: ShellMode;
  activeChallengeId: string;
  lastSavedAt: string;
}

const DEFAULT_WELCOME_ENTRY: TerminalHistoryEntry = {
  id: 'welcome-entry',
  timestamp: '08:00:00',
  shell: 'bash',
  cwd: '/home/sysadmin',
  command: 'uname -a',
  output:
    'Linux ghost-srv 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\nBienvenido al Entrenador de Línea de Comandos de Un Fantasma en el Sistema.\nEscribe "help", "history" o "man <comando>" para consultar manuales, o sigue los pasos del Reto Guiado a la derecha.',
  status: 'success',
  didactic: {
    command: 'uname -a',
    shell: 'bash',
    status: 'success',
    summary:
      'Muestra información detallada del kernel Linux, arquitectura de procesador y nombre del nodo.',
    posixVsWinEquivalent:
      'Linux: uname -a  ↔  Windows CMD/PS: ver  |  systeminfo',
    technicalBreakdown: [
      {
        token: 'uname',
        meaning:
          'Utilidad POSIX que imprime el nombre y versión del sistema operativo.',
      },
      {
        token: '-a (--all)',
        meaning:
          'Muestra kernel, hostname, release, arquitectura x86_64 y plataforma.',
      },
    ],
    securityAndSafetyTip:
      'Conocer la versión exacta del kernel es el primer paso antes de auditar módulos o reparar volúmenes.',
    realWorldImpact:
      'Permite confirmar inmediatamente en qué servidor y arquitectura estás operando al abrir una sesión SSH.',
  },
};

function loadSavedTerminalSession(): SavedTerminalSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedTerminalSession>;
    if (
      parsed &&
      Array.isArray(parsed.history) &&
      Array.isArray(parsed.cmdHistoryList) &&
      parsed.systemState
    ) {
      return {
        history: parsed.history,
        cmdHistoryList: parsed.cmdHistoryList,
        systemState: parsed.systemState,
        shell: parsed.shell === 'cmd' ? 'cmd' : 'bash',
        activeChallengeId:
          parsed.activeChallengeId || GUIDED_CHALLENGES[0].id,
        lastSavedAt: parsed.lastSavedAt || '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

const DEFAULT_PROGRESS: SavedProgress = {
  studentName: 'SysAdmin_Operador',
  completedStepIds: [],
  completedChallengeIds: [],
  examCompletedChallengeIds: [],
  unlockedAchievementIds: [],
  usedBash: false,
  usedCmd: false,
  usedPipeAndRedirect: false,
  totalCommandsRun: 0,
};

export default function App() {
  const initialSession = useMemo(() => loadSavedTerminalSession(), []);

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('sandbox');
  const [shell, setShell] = useState<ShellMode>(
    () => initialSession?.shell ?? 'bash'
  );
  const [examMode, setExamMode] = useState<boolean>(false);
  const [systemState, setSystemState] = useState<SystemHealthState>(
    () => initialSession?.systemState ?? createInitialSystemState()
  );
  const [activeChallengeId, setActiveChallengeId] = useState<string>(
    () => initialSession?.activeChallengeId ?? GUIDED_CHALLENGES[0].id
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('vfs');
  const [selectedFilePreview, setSelectedFilePreview] =
    useState<VFSNode | null>(null);

  const [progress, setProgress] = useState<SavedProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (raw) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PROGRESS;
  });

  // Terminal state restored from localStorage session
  const [inputCmd, setInputCmd] = useState<string>('');
  const [history, setHistory] = useState<TerminalHistoryEntry[]>(
    () => initialSession?.history ?? [DEFAULT_WELCOME_ENTRY]
  );
  const [cmdHistoryList, setCmdHistoryList] = useState<string[]>(
    () => initialSession?.cmdHistoryList ?? ['uname -a']
  );
  const [sessionRestoredBanner, setSessionRestoredBanner] = useState<boolean>(
    () => Boolean(initialSession && initialSession.history.length > 1)
  );
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const [showHintStepId, setShowHintStepId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Retos & Manual views
  const [categoryFilter, setCategoryFilter] = useState<
    ChallengeCategory | 'all'
  >('all');
  const [manualSearch, setManualSearch] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileImportRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  // Persist terminal output history, command list, VFS state, and active shell in localStorage
  useEffect(() => {
    try {
      const sessionPayload: SavedTerminalSession = {
        history: history.slice(-150),
        cmdHistoryList: cmdHistoryList.slice(-250),
        systemState,
        shell,
        activeChallengeId,
        lastSavedAt: new Date().toLocaleTimeString('es-ES'),
      };
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionPayload));
    } catch {
      // ignore storage quota errors
    }
  }, [history, cmdHistoryList, systemState, shell, activeChallengeId]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const activeChallenge: GuidedChallenge = useMemo(
    () =>
      GUIDED_CHALLENGES.find((c) => c.id === activeChallengeId) ||
      GUIDED_CHALLENGES[0],
    [activeChallengeId]
  );

  // Calculate total XP including Exam Mode +50% bonus
  const totalXp = useMemo(() => {
    const challengeXp = GUIDED_CHALLENGES.filter((c) =>
      progress.completedChallengeIds.includes(c.id)
    ).reduce((acc, c) => {
      const isExam = progress.examCompletedChallengeIds.includes(c.id);
      return acc + (isExam ? Math.round(c.xp * 1.5) : c.xp);
    }, 0);
    const achXp = ACHIEVEMENTS.filter((a) =>
      progress.unlockedAchievementIds.includes(a.id)
    ).reduce((acc, a) => acc + a.xpBonus, 0);
    return challengeXp + achXp;
  }, [
    progress.completedChallengeIds,
    progress.examCompletedChallengeIds,
    progress.unlockedAchievementIds,
  ]);

  const operatorRank = useMemo(() => {
    const count = progress.completedChallengeIds.length;
    if (count >= 16) return 'Fantasma en el Sistema (Maestro CLI)';
    if (count >= 10) return 'Arquitecto Senior de Sistemas';
    if (count >= 5) return 'Administrador SysAdmin Intermedio';
    if (count >= 1) return 'Operador de Consola Junior';
    return 'Recluta en Entrenamiento';
  }, [progress.completedChallengeIds.length]);

  const currentDirectoryNode: VFSNode | null = useMemo(() => {
    if (shell === 'bash') {
      return getLinuxNodeByPath(systemState.bashRoot, systemState.bashCwd);
    }
    return getWinNodeByPath(systemState.cmdRoot, systemState.cmdCwd);
  }, [shell, systemState]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const selectChallenge = (challenge: GuidedChallenge) => {
    setActiveChallengeId(challenge.id);
    setShell(challenge.shell);
    setSelectedFilePreview(null);
    setActiveSection('sandbox');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const evaluateProgressAndAchievements = (
    rawCmd: string,
    usedShell: ShellMode,
    nextState: SystemHealthState,
    entry: TerminalHistoryEntry
  ) => {
    setProgress((prev) => {
      const updatedSteps = new Set(prev.completedStepIds);
      const updatedChallenges = new Set(prev.completedChallengeIds);
      const updatedExamChallenges = new Set(prev.examCompletedChallengeIds);
      const updatedAchievements = new Set(prev.unlockedAchievementIds);
      let newlyUnlockedTitles: string[] = [];

      for (const ch of GUIDED_CHALLENGES) {
        for (const st of ch.steps) {
          if (!updatedSteps.has(st.id)) {
            if (st.validate(rawCmd, usedShell, nextState, entry)) {
              updatedSteps.add(st.id);
            }
          }
        }
        const allStepsDone = ch.steps.every((s) => updatedSteps.has(s.id));
        if (allStepsDone && !updatedChallenges.has(ch.id)) {
          updatedChallenges.add(ch.id);
          if (examMode) {
            updatedExamChallenges.add(ch.id);
          }
          const earnedXp = examMode ? Math.round(ch.xp * 1.5) : ch.xp;
          newlyUnlockedTitles.push(
            `Reto superado${examMode ? ' (Modo Examen)' : ''}: ${ch.title} (+${earnedXp} XP)`
          );
        }
      }

      const nextUsedBash = prev.usedBash || usedShell === 'bash';
      const nextUsedCmd = prev.usedCmd || usedShell === 'cmd';
      const nextUsedPipeAndRedirect =
        prev.usedPipeAndRedirect ||
        (rawCmd.includes('|') &&
          (rawCmd.includes('>') || rawCmd.includes('>>')));
      const nextTotalCmds = prev.totalCommandsRun + 1;

      const tryUnlock = (achId: string) => {
        if (!updatedAchievements.has(achId)) {
          updatedAchievements.add(achId);
          const found = ACHIEVEMENTS.find((a) => a.id === achId);
          if (found) {
            newlyUnlockedTitles.push(`Logro desbloqueado: ${found.title}`);
          }
        }
      };

      if (nextTotalCmds >= 1) tryUnlock('ach-first-cmd');
      if (nextUsedBash && nextUsedCmd) tryUnlock('ach-bilingual');

      const completedObjs = GUIDED_CHALLENGES.filter((c) =>
        updatedChallenges.has(c.id)
      );
      if (completedObjs.some((c) => c.category === 'ficheros')) {
        tryUnlock('ach-files');
      }
      if (completedObjs.some((c) => c.category === 'permisos')) {
        tryUnlock('ach-permissions');
      }
      if (completedObjs.some((c) => c.category === 'redes')) {
        tryUnlock('ach-net-defender');
      }
      if (updatedExamChallenges.size >= 1) {
        tryUnlock('ach-exam-mode');
      }
      if (
        nextState.bashDisks.every((d) => d.repaired) ||
        nextState.cmdDisks.every((d) => d.repaired)
      ) {
        tryUnlock('ach-disk-surgeon');
      }
      if (
        nextState.dismComponentStoreHealthy &&
        nextState.sfcSystemFilesHealthy
      ) {
        tryUnlock('ach-system-doctor');
      }
      if (
        !nextState.bashProcesses.some((p) => p.isRogue) ||
        !nextState.cmdProcesses.some((p) => p.isRogue)
      ) {
        tryUnlock('ach-process-hunter');
      }
      if (nextUsedPipeAndRedirect) {
        tryUnlock('ach-pipe-master');
      }
      if (updatedChallenges.size >= 8) {
        tryUnlock('ach-halfway');
      }
      if (updatedChallenges.size === GUIDED_CHALLENGES.length) {
        tryUnlock('ach-ghost-master');
      }

      if (newlyUnlockedTitles.length > 0) {
        triggerToast(newlyUnlockedTitles[0]);
      }

      return {
        ...prev,
        completedStepIds: Array.from(updatedSteps),
        completedChallengeIds: Array.from(updatedChallenges),
        examCompletedChallengeIds: Array.from(updatedExamChallenges),
        unlockedAchievementIds: Array.from(updatedAchievements),
        usedBash: nextUsedBash,
        usedCmd: nextUsedCmd,
        usedPipeAndRedirect: nextUsedPipeAndRedirect,
        totalCommandsRun: nextTotalCmds,
      };
    });
  };

  const handleRunCommand = (cmdOverride?: string, targetShell?: ShellMode) => {
    const activeShell = targetShell ?? shell;
    if (targetShell && targetShell !== shell) {
      setShell(targetShell);
    }
    const raw = (cmdOverride ?? inputCmd).trim();
    if (!raw) return;

    const cwdBefore =
      activeShell === 'bash' ? systemState.bashCwd : systemState.cmdCwd;
    const result = executeCommand(
      raw,
      activeShell,
      systemState,
      cmdHistoryList
    );

    setSystemState(result.nextState);
    setInputCmd('');
    setHistoryCursor(-1);

    if (result.clearHistoryRequested) {
      setCmdHistoryList([]);
    } else {
      setCmdHistoryList((prev) => [...prev, raw]);
    }

    if (result.clearRequested) {
      setHistory([]);
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const newEntry: TerminalHistoryEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      shell: activeShell,
      cwd: cwdBefore,
      command: raw,
      output: result.output,
      status: result.status,
      didactic: result.didactic,
    };

    setHistory((prev) => [...prev, newEntry]);
    evaluateProgressAndAchievements(
      raw,
      activeShell,
      result.nextState,
      newEntry
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistoryList.length === 0) return;
      const nextIdx =
        historyCursor === -1
          ? cmdHistoryList.length - 1
          : Math.max(0, historyCursor - 1);
      setHistoryCursor(nextIdx);
      setInputCmd(cmdHistoryList[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor === -1) return;
      if (historyCursor + 1 >= cmdHistoryList.length) {
        setHistoryCursor(-1);
        setInputCmd('');
      } else {
        const nextIdx = historyCursor + 1;
        setHistoryCursor(nextIdx);
        setInputCmd(cmdHistoryList[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputCmd.split(' ');
      const lastToken = parts[parts.length - 1] || '';
      if (!currentDirectoryNode?.children) return;
      const names = Object.keys(currentDirectoryNode.children);
      const match = names.find((n) =>
        n.toLowerCase().startsWith(lastToken.toLowerCase())
      );
      if (match) {
        parts[parts.length - 1] = match;
        setInputCmd(parts.join(' '));
      }
    }
  };

  const handleClearSavedTerminalHistory = () => {
    setHistory([DEFAULT_WELCOME_ENTRY]);
    setCmdHistoryList(['uname -a']);
    setSessionRestoredBanner(false);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // ignore storage errors
    }
    triggerToast(
      'Historial de la terminal eliminado de localStorage y reiniciado.'
    );
  };

  const handleExportTerminalLog = () => {
    const nowStr = new Date().toLocaleString('es-ES');
    const separator =
      '--------------------------------------------------------------------------------';
    const doubleSeparator =
      '================================================================================';

    const entryBlocks = history.map((entry, idx) => {
      const seq = String(idx + 1).padStart(3, '0');
      const shellLabel =
        entry.shell === 'bash' ? 'GNU/BASH (Linux)' : 'CMD/POWERSHELL (Windows)';
      const statusLabel =
        entry.status === 'success'
          ? 'OK (Código 0)'
          : entry.status === 'warning'
            ? 'ADVERTENCIA'
            : 'ERROR';
      const promptLine =
        entry.shell === 'bash'
          ? `sysadmin@ghost-srv:${entry.cwd}$ ${entry.command}`
          : `PS ${entry.cwd}> ${entry.command}`;

      return [
        separator,
        `[ENTRADA #${seq}]  Hora: ${entry.timestamp}  |  Consola: ${shellLabel}  |  Estado: ${statusLabel}`,
        separator,
        `COMANDO EJECUTADO:`,
        `  ${promptLine}`,
        ``,
        `SALIDA DE TERMINAL (STDOUT / STDERR):`,
        entry.output
          ? entry.output
              .split('\n')
              .map((line) => `  ${line}`)
              .join('\n')
          : '  (Sin salida en pantalla)',
        ``,
        `APUNTE DIDÁCTICO PARA REVISIÓN DEL ESTUDIANTE:`,
        `  • Qué hizo       : ${entry.didactic.summary}`,
        `  • Equivalencia   : ${entry.didactic.posixVsWinEquivalent}`,
        `  • Regla de Oro   : ${entry.didactic.securityAndSafetyTip}`,
      ].join('\n');
    });

    const logLines = [
      doubleSeparator,
      ' REGISTRO DE AUDITORÍA Y APRENDIZAJE DE TERMINAL (CLI SANDBOX LOG)',
      ' Un Fantasma en el Sistema — https://www.unfantasmaenelsistema.com/',
      doubleSeparator,
      `Operador / Estudiante : ${progress.studentName}`,
      `Rango de Sistema      : ${operatorRank} (${totalXp} XP)`,
      `Fecha de exportación  : ${nowStr}`,
      `Reto Guiado Activo    : Reto ${activeChallenge.number} - ${activeChallenge.title}`,
      `Entradas en consola   : ${history.length} ejecuciones registradas`,
      `Comandos en historial : ${cmdHistoryList.length} comandos almacenados`,
      '',
      '--- ÍNDICE RÁPIDO DE COMANDOS EJECUTADOS (HISTORIAL) ---',
      ...(cmdHistoryList.length > 0
        ? cmdHistoryList.map(
            (cmd, i) => `  ${String(i + 1).padStart(4, ' ')}. ${cmd}`
          )
        : ['  (Sin comandos registrados)']),
      '',
      '--- TRAZA COMPLETA DE SESIÓN (COMANDOS, SALIDAS Y ANÁLISIS DIDÁCTICO) ---',
      ...(entryBlocks.length > 0
        ? entryBlocks
        : ['(La pantalla de la terminal está actualmente vacía)']),
      doubleSeparator,
      ' Fin del archivo de registro (.TXT) — Generado por CLI Sandbox',
      doubleSeparator,
    ];

    const blob = new Blob([logLines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `log-terminal-${progress.studentName.replace(/\s+/g, '_')}-${dateStamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(
      `Historial de terminal exportado (${history.length} entradas) en formato .TXT profesional.`
    );
  };

  const handleResetSandbox = () => {
    setSystemState(createInitialSystemState());
    setSelectedFilePreview(null);
    triggerToast(
      'Sistema de ficheros, discos, red y procesos restaurados al estado inicial.'
    );
  };

  const handleResetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
    setSystemState(createInitialSystemState());
    setHistory([DEFAULT_WELCOME_ENTRY]);
    setCmdHistoryList(['uname -a']);
    setSessionRestoredBanner(false);
    try {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // ignore storage errors
    }
    triggerToast('Progreso, logros e historial de sesión reiniciados por completo.');
  };

  const handleExportReport = () => {
    const lines = [
      '====================================================================',
      ' DIPLOMA / INFORME DE CERTIFICACIÓN - ENTRENADOR CLI SANDBOX',
      ' Un Fantasma en el Sistema - https://www.unfantasmaenelsistema.com/',
      '====================================================================',
      `Operador / Alumno    : ${progress.studentName}`,
      `Rango Alcanzado      : ${operatorRank}`,
      `Fecha de emisión     : ${new Date().toLocaleString('es-ES')}`,
      `Experiencia Total    : ${totalXp} XP`,
      `Comandos ejecutados  : ${progress.totalCommandsRun}`,
      `Retos completados    : ${progress.completedChallengeIds.length} / ${GUIDED_CHALLENGES.length} (${progress.examCompletedChallengeIds.length} en Modo Examen)`,
      `Logros desbloqueados : ${progress.unlockedAchievementIds.length} / ${ACHIEVEMENTS.length}`,
      '',
      '--- DETALLE DE RETOS GUIADOS (16 ESCENARIOS) ---',
      ...GUIDED_CHALLENGES.map((c) => {
        const done = progress.completedChallengeIds.includes(c.id);
        const exam = progress.examCompletedChallengeIds.includes(c.id);
        return `[${done ? (exam ? 'EXAMEN ✓  ' : 'COMPLETADO') : 'PENDIENTE '}] Reto ${c.number}: ${c.title} (${c.shell.toUpperCase()} - ${c.xp} XP)`;
      }),
      '',
      '--- LOGROS TÉCNICOS DESBLOQUEADOS ---',
      ...ACHIEVEMENTS.map((a) => {
        const unlocked = progress.unlockedAchievementIds.includes(a.id);
        return `[${unlocked ? 'DESBLOQUEADO' : 'BLOQUEADO   '}] ${a.title} (+${a.xpBonus} XP): ${a.description}`;
      }),
      '====================================================================',
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-cli-${progress.studentName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJsonBackup = () => {
    const backupBundle = {
      progress,
      session: {
        history,
        cmdHistoryList,
        systemState,
        shell,
        activeChallengeId,
        lastSavedAt: new Date().toLocaleTimeString('es-ES'),
      },
    };
    const blob = new Blob([JSON.stringify(backupBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sesion-y-progreso-cli-sandbox.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && parsed.progress && Array.isArray(parsed.progress.completedChallengeIds)) {
          setProgress({ ...DEFAULT_PROGRESS, ...parsed.progress });
          if (parsed.session) {
            if (Array.isArray(parsed.session.history)) {
              setHistory(parsed.session.history);
            }
            if (Array.isArray(parsed.session.cmdHistoryList)) {
              setCmdHistoryList(parsed.session.cmdHistoryList);
            }
            if (parsed.session.systemState) {
              setSystemState(parsed.session.systemState);
            }
            if (parsed.session.shell) {
              setShell(parsed.session.shell);
            }
          }
          triggerToast('Sesión de terminal y progreso restaurados con éxito.');
        } else if (parsed && Array.isArray(parsed.completedChallengeIds)) {
          setProgress({ ...DEFAULT_PROGRESS, ...parsed });
          triggerToast('Copia de seguridad de progreso restaurada con éxito.');
        }
      } catch {
        triggerToast('Error al leer el archivo JSON de respaldo.');
      }
    };
    reader.readAsText(file);
  };

  const lastHistoryEntry = history[history.length - 1];

  const quickSuggestions = useMemo(() => {
    if (shell === 'bash') {
      return [
        'ls -la',
        'ps aux',
        'ss -tulnp',
        'sudo ufw enable',
        'sudo fsck -y /dev/sdb1',
        'chmod 600 id_rsa',
        'sha256sum deploy.sh',
        'man fsck',
      ];
    }
    return [
      'dir /a',
      'tasklist',
      'netstat -ano',
      'ipconfig /flushdns',
      'chkdsk D: /f /r',
      'dism /online /cleanup-image /restorehealth',
      'sfc /scannow',
      'Get-Volume',
    ];
  }, [shell]);

  const filteredChallenges = useMemo(() => {
    if (categoryFilter === 'all') return GUIDED_CHALLENGES;
    return GUIDED_CHALLENGES.filter((c) => c.category === categoryFilter);
  }, [categoryFilter]);

  const filteredManual = useMemo(() => {
    return COMMAND_REFERENCE.filter((item) => {
      const matchesCat =
        categoryFilter === 'all' || item.category === categoryFilter;
      const q = manualSearch.trim().toLowerCase();
      if (!q) return matchesCat;
      return (
        matchesCat &&
        (item.bashCmd.toLowerCase().includes(q) ||
          item.cmdPowershell.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q))
      );
    });
  }, [categoryFilter, manualSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4 Nav Links) — Zone 3 (1 Primary CTA) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Brand Title with non-distorted logo */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('sandbox');
          }}
          className="flex items-center gap-3 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          <img
            src="./assets/aistudio/icono_81a3db5b.png"
            alt="Logo Un Fantasma en el Sistema"
            referrerPolicy="no-referrer"
            className="h-9 w-9 object-contain shrink-0"
          />
          <span>CLI Sandbox · Un Fantasma en el Sistema</span>
        </a>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setActiveSection('sandbox')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'sandbox'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Laboratorio Dual
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('retos')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'retos'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Retos Guiados ({progress.completedChallengeIds.length}/
            {GUIDED_CHALLENGES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('manual')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'manual'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Referencia y Simulador
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('logros')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'logros'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Logros y Certificado ({progress.unlockedAchievementIds.length}/
            {ACHIEVEMENTS.length})
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <span>unfantasmaenelsistema.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Mobile Nav Strip */}
      <div className="flex md:hidden items-center justify-between gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('sandbox')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeSection === 'sandbox'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Laboratorio
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('retos')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeSection === 'retos'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Retos ({progress.completedChallengeIds.length}/
          {GUIDED_CHALLENGES.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('manual')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeSection === 'manual'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Referencia
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('logros')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeSection === 'logros'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Logros ({progress.unlockedAchievementIds.length}/
          {ACHIEVEMENTS.length})
        </button>
      </div>

      {/* Workspace Control Sub-Toolbar */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Interactive Console Mode Selector + Practice/Exam Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShell('bash');
                  setSelectedFilePreview(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  shell === 'bash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                GNU/Bash (Linux)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShell('cmd');
                  setSelectedFilePreview(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  shell === 'cmd'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CMD / PowerShell (Windows)
              </button>
            </div>

            {/* Guided Practice vs Exam Mode */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setExamMode(false)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  !examMode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Modo Guiado
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamMode(true);
                  setShowHintStepId(null);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  examMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Oculta pistas y autocompletado para otorgar +50% XP adicional"
              >
                Modo Examen (+50% XP)
              </button>
            </div>
          </div>

          {/* Right Workspace Utilities & Telemetry */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            <span>
              Rango:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {operatorRank}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Experiencia:{' '}
              <strong className="text-sky-600 dark:text-sky-400">
                {totalXp} XP
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleResetSandbox}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Restaurar archivos, discos, red y procesos del laboratorio"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Entorno</span>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              aria-label="Cambiar tema claro u oscuro"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900 dark:bg-slate-800 text-white border border-sky-500/50 shadow-lg max-w-md">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        {activeSection === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT ZONE (7 cols): Interactive Simulated Terminal + Live System State Inspector */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Terminal Emulator Window */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
                {/* Terminal Title Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Terminal
                      className={`w-4 h-4 shrink-0 ${
                        shell === 'bash' ? 'text-emerald-400' : 'text-sky-400'
                      }`}
                    />
                    <span className="font-mono text-xs font-medium text-slate-200 truncate">
                      {shell === 'bash'
                        ? `sysadmin@ghost-srv:${systemState.bashCwd}`
                        : `Administrador: Windows Server 2025 (CMD / PowerShell) — ${systemState.cmdCwd}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 shrink-0 tabular-nums">
                    <span title="Tu historial de comandos y salida se guarda automáticamente en localStorage">
                      Sesión guardada ({cmdHistoryList.length} cmds)
                    </span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={handleExportTerminalLog}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-semibold text-sky-300 hover:text-white bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 rounded-md transition-colors whitespace-nowrap shrink-0"
                      title="Descargar todo el historial de comandos, salidas y apuntes didácticos en un archivo .TXT profesional"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Log (.TXT)</span>
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
                      title="Limpia la salida en pantalla pero conserva el historial de comandos (↑/↓)"
                    >
                      Limpiar pantalla
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={handleClearSavedTerminalHistory}
                      className="text-rose-400 hover:text-rose-300 transition-colors whitespace-nowrap shrink-0"
                      title="Elimina el historial de la terminal guardado en localStorage"
                    >
                      Borrar historial
                    </button>
                  </div>
                </div>

                {/* Restored Session Notice Banner */}
                {sessionRestoredBanner && (
                  <div className="px-4 py-1.5 bg-sky-950/60 border-b border-sky-800/40 flex items-center justify-between gap-2 text-[11px] text-sky-200">
                    <span>
                      Sesión anterior recuperada desde localStorage ({history.length} entradas de consola y {cmdHistoryList.length} comandos en historial ↑/↓).
                    </span>
                    <button
                      type="button"
                      onClick={() => setSessionRestoredBanner(false)}
                      className="text-sky-400 hover:text-white font-medium shrink-0"
                    >
                      Entendido
                    </button>
                  </div>
                )}

                {/* Terminal Scrollable Output Viewport */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="p-4 h-[370px] overflow-y-auto font-mono text-xs leading-relaxed space-y-3 cursor-text select-text"
                >
                  {history.length === 0 && (
                    <div className="text-slate-500">
                      Consola limpia. Escribe{' '}
                      <code className="text-slate-300">help</code>,{' '}
                      <code className="text-slate-300">history</code> o pulsa la flecha{' '}
                      <code className="text-slate-300">↑</code> para recuperar tus comandos previos.
                    </div>
                  )}

                  {history.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.shell === 'bash' ? (
                          <span className="text-emerald-400 font-semibold">
                            sysadmin@ghost-srv:{item.cwd}$
                          </span>
                        ) : (
                          <span className="text-sky-400 font-semibold">
                            PS {item.cwd}&gt;
                          </span>
                        )}
                        <span className="text-white font-semibold">
                          {item.command}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-auto tabular-nums">
                          {item.timestamp}
                        </span>
                      </div>
                      {item.output && (
                        <pre
                          className={`whitespace-pre-wrap break-words pl-2 border-l border-slate-800 ${
                            item.status === 'error'
                              ? 'text-rose-400'
                              : item.status === 'warning'
                                ? 'text-amber-300'
                                : 'text-slate-300'
                          }`}
                        >
                          {item.output}
                        </pre>
                      )}
                    </div>
                  ))}

                  {/* Active Prompt Input Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {shell === 'bash' ? (
                      <span className="text-emerald-400 font-semibold shrink-0">
                        sysadmin@ghost-srv:{systemState.bashCwd}$
                      </span>
                    ) : (
                      <span className="text-sky-400 font-semibold shrink-0">
                        PS {systemState.cmdCwd}&gt;
                      </span>
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputCmd}
                      onChange={(e) => setInputCmd(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        shell === 'bash'
                          ? 'Comando Bash (ej. ls -la, ss -tulnp, sudo ufw enable, man fsck)...'
                          : 'Comando CMD/PS (ej. dir /a, netstat -ano, chkdsk D: /f /r, Get-Volume)...'
                      }
                      className="flex-1 bg-transparent text-white placeholder-slate-600 focus:outline-none font-mono text-xs"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => handleRunCommand()}
                      className="px-3 py-1 text-xs font-sans font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      Ejecutar ↵
                    </button>
                  </div>
                  <div ref={terminalEndRef} />
                </div>

                {/* Quick Command Palette Bar (hidden in Exam Mode to keep exam authentic) */}
                {!examMode ? (
                  <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[11px] font-sans text-slate-400 whitespace-nowrap shrink-0">
                      Comandos rápidos:
                    </span>
                    {quickSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleRunCommand(sug)}
                        className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-amber-950/40 border-t border-amber-800/40 text-[11px] text-amber-300 flex items-center justify-between">
                    <span>
                      Modo Examen Activo: Escribe los comandos manualmente en la terminal para ganar +50% XP.
                    </span>
                    <span>Autocompletado de ficheros con tecla Tab permitido</span>
                  </div>
                )}
              </section>

              {/* Live System State Inspector (VFS, Disks, Processes, Networking) */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Telemetría en Vivo del Entorno ({shell === 'bash' ? 'Linux POSIX' : 'Windows Server'})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Inspecciona en tiempo real los cambios sobre ficheros, discos, procesos y red.
                    </p>
                  </div>

                  {/* Interactive Inspector Tab Buttons (4 tabs) */}
                  <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {(
                      [
                        { id: 'vfs', label: 'Ficheros y Permisos' },
                        { id: 'discos', label: 'Discos e Integridad' },
                        { id: 'procesos', label: 'Procesos' },
                        { id: 'redes', label: 'Red y Firewall' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setInspectorTab(t.id)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          inspectorTab === t.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab 1: Virtual File System */}
                {inspectorTab === 'vfs' && (
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>
                        Ruta activa:{' '}
                        <strong className="text-slate-900 dark:text-slate-200">
                          {shell === 'bash'
                            ? systemState.bashCwd
                            : systemState.cmdCwd}
                        </strong>
                      </span>
                      <span>
                        Haz clic en un fichero para previsualizar contenido y hash
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <th className="py-2 pr-3 font-medium">Nombre</th>
                            <th className="py-2 px-3 font-medium">Tipo</th>
                            <th className="py-2 px-3 font-medium">
                              {shell === 'bash'
                                ? 'Permisos (Octal)'
                                : 'Atributos NTFS'}
                            </th>
                            <th className="py-2 px-3 font-medium">
                              {shell === 'bash'
                                ? 'Propietario'
                                : 'ACL / Seguridad'}
                            </th>
                            <th className="py-2 pl-3 text-right font-medium">
                              Tamaño
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70 font-mono tabular-nums">
                          {Object.values(
                            currentDirectoryNode?.children || {}
                          ).map((node) => (
                            <tr
                              key={node.name}
                              onClick={() => {
                                if (node.type === 'dir') {
                                  handleRunCommand(`cd ${node.name}`);
                                } else {
                                  setSelectedFilePreview(node);
                                }
                              }}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {node.type === 'dir' ? (
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                                )}
                                <span>{node.name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {node.type === 'dir' ? 'Directorio' : 'Fichero'}
                              </td>
                              <td className="py-2.5 px-3">
                                {shell === 'bash' ? (
                                  <span
                                    className={
                                      node.octal === '777'
                                        ? 'text-amber-500 font-semibold'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }
                                  >
                                    {node.permissions} ({node.octal})
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      node.attributes.includes('H') ||
                                      node.attributes.includes('S')
                                        ? 'text-amber-500 font-semibold'
                                        : 'text-sky-600 dark:text-sky-400'
                                    }
                                  >
                                    [{node.attributes.join(', ') || 'Normal'}]
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                                {shell === 'bash' ? node.owner : node.acl}
                              </td>
                              <td className="py-2.5 pl-3 text-right text-slate-500 dark:text-slate-400">
                                {node.size} B
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedFilePreview && (
                      <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            Contenido de {selectedFilePreview.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleRunCommand(
                                  shell === 'bash'
                                    ? `sha256sum ${selectedFilePreview.name}`
                                    : `certutil -hashfile ${selectedFilePreview.name} SHA256`
                                )
                              }
                              className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
                            >
                              Calcular Hash SHA-256
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedFilePreview(null)}
                              className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                        <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {selectedFilePreview.content || '(Archivo vacío)'}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Disks & System Integrity */}
                {inspectorTab === 'discos' && (
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(shell === 'bash'
                        ? systemState.bashDisks
                        : systemState.cmdDisks
                      ).map((disk) => (
                        <div
                          key={disk.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-900 dark:text-white">
                              <HardDrive className="w-4 h-4 text-sky-500" />
                              <span>
                                {disk.id} ({disk.fsType})
                              </span>
                            </div>
                            {disk.repaired ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-4 h-4" />
                                <span>● SANO (Healthy)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <ShieldAlert className="w-4 h-4" />
                                <span>
                                  ▲ CORRUPTO ({disk.errorsFound} errores)
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                            Punto de montaje: {disk.mount} · Uso: {disk.used} de{' '}
                            {disk.size}
                          </div>
                          {!disk.repaired && !examMode && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRunCommand(
                                    shell === 'bash'
                                      ? `sudo fsck -y ${disk.id}`
                                      : `chkdsk ${disk.id} /f /r`
                                  )
                                }
                                className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors"
                              >
                                Ejecutar{' '}
                                {shell === 'bash'
                                  ? `sudo fsck -y ${disk.id}`
                                  : `chkdsk ${disk.id} /f /r`}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Integridad de Imagen Windows Server (WinSxS DISM &
                          System32 SFC)
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                          <span>
                            Almacén DISM:{' '}
                            <strong
                              className={
                                systemState.dismComponentStoreHealthy
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {systemState.dismComponentStoreHealthy
                                ? '● REPARADO'
                                : '▲ DAÑO EN COMPONENTES'}
                            </strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Archivos SFC:{' '}
                            <strong
                              className={
                                systemState.sfcSystemFilesHealthy
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {systemState.sfcSystemFilesHealthy
                                ? '● ÍNTEGROS'
                                : '▲ DLL CORRUPTAS'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Process Table */}
                {inspectorTab === 'procesos' && (
                  <div className="pt-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-sans">
                          <th className="py-2 pr-3 font-medium">PID</th>
                          <th className="py-2 px-3 font-medium">Proceso</th>
                          <th className="py-2 px-3 font-medium">Usuario</th>
                          <th className="py-2 px-3 font-medium">CPU / Mem</th>
                          <th className="py-2 px-3 font-medium">Estado</th>
                          <th className="py-2 pl-3 text-right font-medium">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
                        {(shell === 'bash'
                          ? systemState.bashProcesses
                          : systemState.cmdProcesses
                        ).map((proc) => (
                          <tr key={proc.pid}>
                            <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-white">
                              {proc.pid}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                              {proc.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                              {proc.user}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {proc.cpu} · {proc.mem}
                            </td>
                            <td className="py-2.5 px-3">
                              {proc.isRogue ? (
                                <span className="text-rose-500 font-semibold">
                                  ▲ {proc.status}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  ● {proc.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              {proc.isRogue && !examMode ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRunCommand(
                                      shell === 'bash'
                                        ? `sudo kill -9 ${proc.pid}`
                                        : `taskkill /PID ${proc.pid} /F`
                                    )
                                  }
                                  className="px-2.5 py-1 text-[11px] font-sans font-medium bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                                >
                                  Terminar PID {proc.pid}
                                </button>
                              ) : (
                                <span className="text-slate-400 font-sans">
                                  {proc.isRogue ? 'PID ' + proc.pid : 'Sistema'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 4: Networking, Sockets & Firewall */}
                {inspectorTab === 'redes' && (
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Cortafuegos Linux (UFW Netfilter)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {systemState.bashFirewallEnabled
                              ? '● ACTIVO (Política DENY INCOMING)'
                              : '▲ INACTIVO (Puertos expuestos)'}
                          </div>
                        </div>
                        {!systemState.bashFirewallEnabled && !examMode && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRunCommand('sudo ufw enable', 'bash')
                            }
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                          >
                            Activar UFW
                          </button>
                        )}
                      </div>

                      <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Caché Resolver DNS Windows
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {systemState.cmdDnsFlushed
                              ? '● SANEADA (ipconfig /flushdns)'
                              : '▲ ENTRADAS SOSPECHOSAS EN CACHÉ'}
                          </div>
                        </div>
                        {!systemState.cmdDnsFlushed && !examMode && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRunCommand('ipconfig /flushdns', 'cmd')
                            }
                            className="px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded"
                          >
                            Purgar DNS
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Usa <code className="font-mono text-slate-900 dark:text-white">ss -tulnp</code> en Bash o{' '}
                      <code className="font-mono text-slate-900 dark:text-white">netstat -ano</code> en CMD/PowerShell para auditar los puertos abiertos y su PID asociado.
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT ZONE (5 cols): Guided Challenge Deck + Immediate Didactic Feedback */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Guided Challenge Card */}
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Reto {activeChallenge.number} de {GUIDED_CHALLENGES.length}{' '}
                    · {activeChallenge.categoryLabel} ·{' '}
                    {activeChallenge.difficulty} ·{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {examMode
                        ? `${Math.round(activeChallenge.xp * 1.5)} XP (Modo Examen)`
                        : `${activeChallenge.xp} XP`}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSection('retos')}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-medium whitespace-nowrap shrink-0"
                  >
                    Ver los 16 retos
                  </button>
                </div>

                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activeChallenge.number}. {activeChallenge.title}
                  </h1>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeChallenge.scenario}
                  </p>
                </div>

                {shell !== activeChallenge.shell && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      Este reto está diseñado para la consola{' '}
                      <strong>
                        {activeChallenge.shell === 'bash'
                          ? 'GNU/Bash (Linux)'
                          : 'CMD / PowerShell (Windows)'}
                      </strong>
                      .
                    </span>
                    <button
                      type="button"
                      onClick={() => setShell(activeChallenge.shell)}
                      className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-md whitespace-nowrap shrink-0"
                    >
                      Cambiar a {activeChallenge.shell.toUpperCase()}
                    </button>
                  </div>
                )}

                {/* Steps Checklist */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Pasos del reto:
                    </span>
                    {examMode && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Modo Examen: Pistas desactivadas
                      </span>
                    )}
                  </div>
                  {activeChallenge.steps.map((step, idx) => {
                    const isDone = progress.completedStepIds.includes(step.id);
                    const hintOpen = !examMode && showHintStepId === step.id;
                    return (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-lg border transition-colors ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isDone
                                  ? 'text-emerald-500'
                                  : 'text-slate-400 dark:text-slate-600'
                              }`}
                            />
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                                <span className="font-semibold">
                                  Paso {idx + 1}:
                                </span>{' '}
                                {step.instruction}
                              </p>
                              {!examMode && (
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowHintStepId(
                                        hintOpen ? null : step.id
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline"
                                  >
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    <span>
                                      {hintOpen
                                        ? 'Ocultar pista'
                                        : 'Ver pista y comando'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (shell !== activeChallenge.shell) {
                                        setShell(activeChallenge.shell);
                                      }
                                      setInputCmd(step.exampleCommand);
                                      inputRef.current?.focus();
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span>Insertar en consola</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                              isDone
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {isDone ? '✓ Completado' : 'Pendiente'}
                          </span>
                        </div>

                        {hintOpen && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                            <p className="text-slate-600 dark:text-slate-300">
                              {step.hint}
                            </p>
                            <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 text-slate-100 font-mono text-xs">
                              <code>{step.exampleCommand}</code>
                              <button
                                type="button"
                                onClick={() => {
                                  handleRunCommand(
                                    step.exampleCommand,
                                    activeChallenge.shell
                                  );
                                }}
                                className="px-2.5 py-1 text-[11px] font-sans font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded whitespace-nowrap shrink-0"
                              >
                                Ejecutar ahora
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Challenge Navigation Footer */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = GUIDED_CHALLENGES.findIndex(
                        (c) => c.id === activeChallenge.id
                      );
                      const prev =
                        GUIDED_CHALLENGES[
                          (idx - 1 + GUIDED_CHALLENGES.length) %
                            GUIDED_CHALLENGES.length
                        ];
                      selectChallenge(prev);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    ← Reto Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = GUIDED_CHALLENGES.findIndex(
                        (c) => c.id === activeChallenge.id
                      );
                      const next =
                        GUIDED_CHALLENGES[(idx + 1) % GUIDED_CHALLENGES.length];
                      selectChallenge(next);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Siguiente Reto</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </section>

              {/* Immediate Didactic Feedback Panel with Cross-OS Equivalents */}
              {lastHistoryEntry && (
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Retroalimentación Didáctica Inmediata
                    </h2>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {lastHistoryEntry.didactic.shell.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-sky-600 dark:text-sky-400">
                    $ {lastHistoryEntry.didactic.command}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {lastHistoryEntry.didactic.summary}
                  </p>

                  {/* Cross-OS Equivalent Callout */}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    {lastHistoryEntry.didactic.posixVsWinEquivalent}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Desglose sintáctico del comando:
                    </div>
                    <div className="space-y-1.5">
                      {lastHistoryEntry.didactic.technicalBreakdown.map(
                        (item, i) => (
                          <div
                            key={i}
                            className="text-xs flex items-baseline gap-2"
                          >
                            <code className="font-mono font-semibold text-slate-900 dark:text-white shrink-0">
                              {item.token}
                            </code>
                            <span className="text-slate-600 dark:text-slate-400">
                              — {item.meaning}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">
                      Regla de Oro de Seguridad / Producción:
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {lastHistoryEntry.didactic.securityAndSafetyTip}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: RETOS GUIADOS CATALOG (16 SCENARIOS) */}
        {activeSection === 'retos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Catálogo de 16 Retos Guiados (Linux Bash & Windows CMD/PowerShell)
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Entrena desde operaciones básicas hasta auditoría de red, PowerShell moderno, reparación de discos y criptografía SHA-256.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'Todos (16)' },
                    { id: 'ficheros', label: 'Ficheros' },
                    { id: 'permisos', label: 'Permisos y SHA256' },
                    { id: 'discos', label: 'Discos (chkdsk/fsck)' },
                    { id: 'sistema', label: 'Sistema y PowerShell' },
                    { id: 'redirecciones', label: 'Redirecciones' },
                    { id: 'redes', label: 'Redes y Firewall' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === tab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredChallenges.map((ch) => {
                const completed = progress.completedChallengeIds.includes(
                  ch.id
                );
                const examDone = progress.examCompletedChallengeIds.includes(
                  ch.id
                );
                const doneCount = ch.steps.filter((s) =>
                  progress.completedStepIds.includes(s.id)
                ).length;

                return (
                  <article
                    key={ch.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {ch.shell === 'bash' ? 'GNU/Bash' : 'CMD / PowerShell'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ch.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ch.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{ch.xp} XP</span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {ch.number}. {ch.title}
                      </h2>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ch.scenario}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          completed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {completed
                          ? examDone
                            ? '✓ Superado (Modo Examen)'
                            : '✓ Reto Completado'
                          : `Progreso: ${doneCount}/${ch.steps.length} pasos`}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectChallenge(ch)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Abrir en Laboratorio
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: MANUAL, COMPARATIVE CLI REFERENCE & INTERACTIVE PERMISSIONS CALCULATOR */}
        {activeSection === 'manual' && (
          <div className="space-y-6">
            {/* Interactive POSIX & NTFS Permissions Calculator */}
            <PermissionsCalculator
              onSendCommand={(cmd, targetShell) => {
                setActiveSection('sandbox');
                handleRunCommand(cmd, targetShell);
              }}
            />

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 pt-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Diccionario Comparado de Comandos (Linux Bash vs Windows CMD / PowerShell)
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Consulta la sintaxis real, banderas críticas y lanza cualquier comando directamente al emulador.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Buscar comando (chkdsk, ufw, sfc, sha256...)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredManual.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.categoryName}</span>
                    <span>Nivel de riesgo: {item.riskLevel}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                        <span>GNU/Bash (Linux)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShell('bash');
                            setActiveSection('sandbox');
                            setInputCmd(item.exampleBash);
                          }}
                          className="underline hover:text-white"
                        >
                          Probar
                        </button>
                      </div>
                      <code className="block font-mono text-xs text-slate-200">
                        {item.exampleBash}
                      </code>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-sky-400 font-semibold">
                        <span>CMD / PowerShell</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShell('cmd');
                            setActiveSection('sandbox');
                            setInputCmd(item.exampleCmd);
                          }}
                          className="underline hover:text-white"
                        >
                          Probar
                        </button>
                      </div>
                      <code className="block font-mono text-xs text-slate-200">
                        {item.exampleCmd}
                      </code>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    Parámetros clave: {item.keyFlags.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: LOGROS, CERTIFICADO Y RESPALDO */}
        {activeSection === 'logros' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Logros, Certificación y Respaldo de Progreso
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Personaliza tu certificado técnico, exporta tu avance en JSON o completa los 12 logros del laboratorio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Certificado (.TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileImportRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar JSON</span>
                </button>
                <input
                  ref={fileImportRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            {/* Interactive Certificate Preview Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <img
                  src="./assets/aistudio/icono_81a3db5b.png"
                  alt="Logo Un Fantasma en el Sistema"
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 object-contain shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                    Credencial Técnica de Laboratorio CLI · Un Fantasma en el Sistema
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="operator-name"
                      className="text-xs text-slate-500 dark:text-slate-400"
                    >
                      Operador:
                    </label>
                    <input
                      id="operator-name"
                      type="text"
                      value={progress.studentName}
                      onChange={(e) =>
                        setProgress((p) => ({
                          ...p,
                          studentName: e.target.value,
                        }))
                      }
                      className="px-2.5 py-1 text-sm font-bold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Rango actual: <strong>{operatorRank}</strong> · Retos en Modo Examen:{' '}
                    <strong>{progress.examCompletedChallengeIds.length}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto tabular-nums">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Experiencia</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {totalXp} XP
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Retos</div>
                  <div className="text-lg font-bold text-emerald-500">
                    {progress.completedChallengeIds.length}/
                    {GUIDED_CHALLENGES.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Logros</div>
                  <div className="text-lg font-bold text-amber-500">
                    {progress.unlockedAchievementIds.length}/
                    {ACHIEVEMENTS.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Comandos</div>
                  <div className="text-lg font-bold text-sky-500">
                    {progress.totalCommandsRun}
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = progress.unlockedAchievementIds.includes(
                  ach.id
                );
                return (
                  <div
                    key={ach.id}
                    className={`p-5 rounded-xl border flex items-start gap-4 transition-colors ${
                      unlocked
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        unlocked
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {ach.title}
                        </h3>
                        <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                          +{ach.xpBonus} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ach.description}
                      </p>
                      <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {ach.conditionText} ·{' '}
                        <strong
                          className={
                            unlocked
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500'
                          }
                        >
                          {unlocked ? '✓ Desbloqueado' : 'Bloqueado'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Clean Educational Footer with Non-Distorted Brand Logo and Website Link */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <img
              src="./assets/aistudio/icono_81a3db5b.png"
              alt="Logo Un Fantasma en el Sistema"
              referrerPolicy="no-referrer"
              className="h-8 w-8 object-contain shrink-0"
            />
            <span>
              <strong>Entrenador de Línea de Comandos (CLI Sandbox)</strong> ·
              Simulador educativo dual Linux Bash / Windows CMD & PowerShell.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>https://www.unfantasmaenelsistema.com/</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
