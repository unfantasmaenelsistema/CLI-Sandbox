export type ShellMode = 'bash' | 'cmd';

export type ChallengeCategory =
  | 'ficheros'
  | 'permisos'
  | 'discos'
  | 'sistema'
  | 'redirecciones'
  | 'redes';

export interface VFSNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  size: number;
  updatedAt: string;
  // Linux specific
  permissions: string; // e.g. 'rwxr-xr-x' or 'rw-r--r--'
  octal: string; // e.g. '755', '644', '600'
  owner: string; // e.g. 'sysadmin:sysadmin' or 'root:root'
  // Windows specific
  attributes: string[]; // e.g. ['A'], ['A', 'R', 'H', 'S']
  acl: string; // e.g. 'BUILTIN\\Administradores:(F), USUARIOS:(RX)'
  sha256?: string;
  children?: Record<string, VFSNode>;
}

export interface ProcessItem {
  pid: number;
  name: string;
  user: string;
  cpu: string;
  mem: string;
  status: 'Running' | 'Hung / High CPU' | 'Sleeping';
  command: string;
  port?: number;
  critical?: boolean;
  isRogue?: boolean;
}

export interface DiskVolume {
  id: string; // '/dev/sda1', '/dev/sdb1', 'C:', 'D:'
  mount: string;
  fsType: string;
  size: string;
  used: string;
  status: 'Healthy' | 'Corrupted (Inodes/Bad Sectors)';
  errorsFound: number;
  repaired: boolean;
}

export interface NetworkSocket {
  proto: 'TCP' | 'UDP';
  localAddress: string;
  foreignAddress: string;
  state: 'LISTEN' | 'ESTABLISHED' | 'TIME_WAIT';
  pid: number;
  processName: string;
  suspicious?: boolean;
}

export interface SystemHealthState {
  // Linux state
  bashCwd: string;
  bashRoot: VFSNode;
  bashProcesses: ProcessItem[];
  bashDisks: DiskVolume[];
  bashFirewallEnabled: boolean;
  bashNginxActive: boolean;
  // Windows state
  cmdCwd: string;
  cmdRoot: VFSNode;
  cmdProcesses: ProcessItem[];
  cmdDisks: DiskVolume[];
  dismComponentStoreHealthy: boolean;
  sfcSystemFilesHealthy: boolean;
  cmdDnsFlushed: boolean;
  cmdFirewallEnabled: boolean;
}

export interface DidacticAnalysis {
  command: string;
  shell: ShellMode;
  status: 'success' | 'warning' | 'error';
  summary: string;
  posixVsWinEquivalent: string;
  technicalBreakdown: {
    token: string;
    meaning: string;
  }[];
  securityAndSafetyTip: string;
  realWorldImpact: string;
}

export interface TerminalHistoryEntry {
  id: string;
  timestamp: string;
  shell: ShellMode;
  cwd: string;
  command: string;
  output: string;
  status: 'success' | 'warning' | 'error';
  didactic: DidacticAnalysis;
}

export interface ChallengeStep {
  id: string;
  instruction: string;
  hint: string;
  exampleCommand: string;
  validate: (
    cmd: string,
    shell: ShellMode,
    state: SystemHealthState,
    lastEntry?: TerminalHistoryEntry
  ) => boolean;
}

export interface GuidedChallenge {
  id: string;
  number: string;
  title: string;
  category: ChallengeCategory;
  categoryLabel: string;
  shell: ShellMode;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  xp: number;
  scenario: string;
  learningObjective: string;
  steps: ChallengeStep[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  conditionText: string;
  xpBonus: number;
  category: string;
}
