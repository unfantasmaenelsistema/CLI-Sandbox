import {
  DidacticAnalysis,
  ShellMode,
  SystemHealthState,
  VFSNode,
} from '../types/cli';
import { md5Hex, sha256Hex, utf8Length } from './hash';

// Usuario de la consola Linux y sus grupos (en Ubuntu el primer usuario está en adm y sudo)
const BASH_USER = 'sysadmin';
const BASH_GROUPS = ['sysadmin', 'adm', 'sudo', 'www-data'];

type PermBit = 'r' | 'w' | 'x';

// Comprobación de permisos POSIX propietario/grupo/otros; root (sudo) lo puede todo
function canAccess(node: VFSNode, bit: PermBit, isSudo: boolean): boolean {
  if (isSudo) return true;
  const [user, group] = node.owner.split(':');
  const offset = user === BASH_USER ? 0 : BASH_GROUPS.includes(group || user) ? 3 : 6;
  const index = offset + (bit === 'r' ? 0 : bit === 'w' ? 1 : 2);
  return node.permissions[index] === bit;
}

function isOwner(node: VFSNode): boolean {
  return node.owner.split(':')[0] === BASH_USER;
}

function parentPath(absPath: string): string {
  const parts = absPath.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

// Motivo por el que no se puede crear o sobrescribir absPath (null si se puede)
function linuxWriteDenied(root: VFSNode, absPath: string, isSudo: boolean): string | null {
  const existing = getLinuxNodeByPath(root, absPath);
  if (existing) {
    if (existing.type === 'dir') return 'Es un directorio';
    return canAccess(existing, 'w', isSudo) ? null : 'Permiso denegado';
  }
  const dir = getLinuxNodeByPath(root, parentPath(absPath));
  if (!dir || dir.type !== 'dir') return 'No existe el archivo o el directorio';
  return canAccess(dir, 'w', isSudo) ? null : 'Permiso denegado';
}

// Ajusta el tamaño de cada fichero a los bytes reales de su contenido
function syncSizes(node: VFSNode): void {
  if (node.type === 'file') {
    node.size = utf8Length(node.content || '');
    return;
  }
  for (const child of Object.values(node.children || {})) syncSizes(child);
}

// Completa estados guardados con versiones anteriores (localStorage o JSON importado)
export function normalizeSystemState(state: SystemHealthState): SystemHealthState {
  return {
    ...state,
    bashFirewallRules: Array.isArray(state.bashFirewallRules) ? state.bashFirewallRules : [],
    bashDisks: state.bashDisks.map((d) => ({ ...d, mounted: d.mounted !== false })),
  };
}

export function createInitialSystemState(): SystemHealthState {
  const bashRoot: VFSNode = {
    name: '',
    type: 'dir',
    size: 4096,
    updatedAt: '2026-11-01 08:00',
    permissions: 'rwxr-xr-x',
    octal: '755',
    owner: 'root:root',
    attributes: [],
    acl: '',
    children: {
      home: {
        name: 'home',
        type: 'dir',
        size: 4096,
        updatedAt: '2026-11-01 08:00',
        permissions: 'rwxr-xr-x',
        octal: '755',
        owner: 'root:root',
        attributes: [],
        acl: '',
        children: {
          sysadmin: {
            name: 'sysadmin',
            type: 'dir',
            size: 4096,
            updatedAt: '2026-11-01 08:15',
            permissions: 'rwxr-xr-x',
            octal: '755',
            owner: 'sysadmin:sysadmin',
            attributes: [],
            acl: '',
            children: {
              '.bashrc': {
                name: '.bashrc',
                type: 'file',
                size: 512,
                updatedAt: '2026-10-15 10:20',
                permissions: 'rw-r--r--',
                octal: '644',
                owner: 'sysadmin:sysadmin',
                attributes: ['H'],
                acl: '',
                content:
                  '# ~/.bashrc: ejecutado por bash(1)\nalias ll="ls -la"\nexport PS1="\\u@\\h:\\w\\$ "',
              },
              'nginx.conf': {
                name: 'nginx.conf',
                type: 'file',
                size: 1420,
                updatedAt: '2026-10-29 19:40',
                permissions: 'rw-r--r--',
                octal: '644',
                owner: 'sysadmin:sysadmin',
                attributes: [],
                acl: '',
                content:
                  'user www-data;\nworker_processes auto;\nhttp {\n  server {\n    listen 80;\n    server_name unfantasmaenelsistema.local;\n  }\n}',
              },
              'deploy.sh': {
                name: 'deploy.sh',
                type: 'file',
                size: 840,
                updatedAt: '2026-10-30 14:12',
                permissions: 'rw-r--r--',
                octal: '644',
                owner: 'sysadmin:sysadmin',
                attributes: [],
                acl: '',
                content:
                  '#!/usr/bin/env bash\necho "Iniciando despliegue seguro en producción..."\nsystemctl reload nginx\necho "Despliegue completado."',
              },
              id_rsa: {
                name: 'id_rsa',
                type: 'file',
                size: 1679,
                updatedAt: '2026-10-20 09:05',
                permissions: 'rwxrwxrwx',
                octal: '777',
                owner: 'sysadmin:sysadmin',
                attributes: [],
                acl: '',
                content:
                  '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\n-----END OPENSSH PRIVATE KEY-----',
              },
              'temp_crash.dmp': {
                name: 'temp_crash.dmp',
                type: 'file',
                size: 65536,
                updatedAt: '2026-10-31 23:55',
                permissions: 'rw-rw-rw-',
                octal: '666',
                owner: 'sysadmin:sysadmin',
                attributes: [],
                acl: '',
                content: 'CORE_DUMP_CORRUPT_BUFFER_0x0048FF1A',
              },
              'notas_auditoria.txt': {
                name: 'notas_auditoria.txt',
                type: 'file',
                size: 380,
                updatedAt: '2026-11-01 07:30',
                permissions: 'rw-r--r--',
                octal: '644',
                owner: 'sysadmin:sysadmin',
                attributes: [],
                acl: '',
                content:
                  'Tareas pendientes SysAdmin:\n1. Limpiar temp_crash.dmp y respaldar nginx.conf en backups/\n2. Corregir permisos de id_rsa (600) y deploy.sh (750, root:www-data)\n3. Reparar /dev/sdb1: sudo umount /mnt/datos, sudo fsck -y /dev/sdb1 y volver a montarlo\n4. Terminar proceso runaway_syncd (PID 3104)\n5. Auditar puertos (sudo ss -tulnp), permitir SSH (sudo ufw allow OpenSSH) y activar firewall (sudo ufw enable)',
              },
            },
          },
        },
      },
      var: {
        name: 'var',
        type: 'dir',
        size: 4096,
        updatedAt: '2026-10-01 00:00',
        permissions: 'rwxr-xr-x',
        octal: '755',
        owner: 'root:root',
        attributes: [],
        acl: '',
        children: {
          log: {
            name: 'log',
            type: 'dir',
            size: 4096,
            updatedAt: '2026-11-01 08:00',
            permissions: 'rwxr-xr-x',
            octal: '755',
            owner: 'root:syslog',
            attributes: [],
            acl: '',
            children: {
              syslog: {
                name: 'syslog',
                type: 'file',
                size: 4120,
                updatedAt: '2026-11-01 08:12',
                permissions: 'rw-r-----',
                octal: '640',
                owner: 'root:adm',
                attributes: [],
                acl: '',
                content: [
                  'Nov 01 08:01:10 ghost-srv systemd[1]: Started OpenBSD Secure Shell server.',
                  'Nov 01 08:03:22 ghost-srv kernel: [142.104] EXT4-fs error (device sdb1): ext4_lookup: deleted inode referenced: 18421',
                  'Nov 01 08:04:01 ghost-srv nginx[1042]: INFO Worker process initialized cleanly.',
                  'Nov 01 08:05:19 ghost-srv kernel: [259.882] ERROR I/O failure on /dev/sdb1 block 99214, filesystem remounted read-only',
                  'Nov 01 08:07:44 ghost-srv sshd[2190]: Accepted publickey for sysadmin from 10.0.14.8 port 51922 ssh2',
                  'Nov 01 08:09:02 ghost-srv runaway_syncd[3104]: ERROR Memory allocation spike detected (94.8% RSS)',
                  'Nov 01 08:11:30 ghost-srv systemd[1]: ERROR Service nginx worker timeout waiting for upstream socket.',
                ].join('\n'),
              },
            },
          },
        },
      },
      etc: {
        name: 'etc',
        type: 'dir',
        size: 4096,
        updatedAt: '2026-10-01 00:00',
        permissions: 'rwxr-xr-x',
        octal: '755',
        owner: 'root:root',
        attributes: [],
        acl: '',
        children: {
          hosts: {
            name: 'hosts',
            type: 'file',
            size: 245,
            updatedAt: '2026-10-01 00:00',
            permissions: 'rw-r--r--',
            octal: '644',
            owner: 'root:root',
            attributes: [],
            acl: '',
            content:
              '127.0.0.1\tlocalhost\n127.0.1.1\tghost-srv.unfantasmaenelsistema.local\tghost-srv\n::1\t\tlocalhost ip6-localhost ip6-loopback',
          },
          fstab: {
            name: 'fstab',
            type: 'file',
            size: 310,
            updatedAt: '2026-10-01 00:00',
            permissions: 'rw-r--r--',
            octal: '644',
            owner: 'root:root',
            attributes: [],
            acl: '',
            content:
              '/dev/sda1  /          ext4  errors=remount-ro  0  1\n/dev/sdb1  /mnt/datos ext4  defaults           0  2',
          },
        },
      },
    },
  };

  const cmdRoot: VFSNode = {
    name: 'C:',
    type: 'dir',
    size: 0,
    updatedAt: '01/11/2026 08:00',
    permissions: 'rwxr-xr-x',
    octal: '755',
    owner: 'SYSTEM',
    attributes: ['D'],
    acl: 'NT AUTHORITY\\SYSTEM:(F)',
    children: {
      Users: {
        name: 'Users',
        type: 'dir',
        size: 0,
        updatedAt: '01/11/2026 08:00',
        permissions: 'rwxr-xr-x',
        octal: '755',
        owner: 'SYSTEM',
        attributes: ['D'],
        acl: 'NT AUTHORITY\\SYSTEM:(F)',
        children: {
          Administrador: {
            name: 'Administrador',
            type: 'dir',
            size: 0,
            updatedAt: '01/11/2026 08:10',
            permissions: 'rwxr-xr-x',
            octal: '755',
            owner: 'Administrador',
            attributes: ['D'],
            acl: 'BUILTIN\\Administradores:(F)',
            children: {
              Proyectos: {
                name: 'Proyectos',
                type: 'dir',
                size: 0,
                updatedAt: '01/11/2026 08:15',
                permissions: 'rwxr-xr-x',
                octal: '755',
                owner: 'Administrador',
                attributes: ['D'],
                acl: 'BUILTIN\\Administradores:(F)',
                children: {
                  'balance_2026.xlsx': {
                    name: 'balance_2026.xlsx',
                    type: 'file',
                    size: 48200,
                    updatedAt: '30/10/2026 17:45',
                    permissions: 'rw-r--r--',
                    octal: '644',
                    owner: 'Administrador',
                    attributes: ['A'],
                    acl: 'BUILTIN\\Administradores:(F), USUARIOS:(RX)',
                    content:
                      '[Hoja de Cálculo Corporativa: Balance Consolidado 2026]',
                  },
                  'credenciales.txt': {
                    name: 'credenciales.txt',
                    type: 'file',
                    size: 1280,
                    updatedAt: '31/10/2026 22:10',
                    permissions: 'rw-r--r--',
                    octal: '644',
                    owner: 'Administrador',
                    attributes: ['A', 'H', 'S'],
                    acl: 'TODOS:(RX)',
                    content:
                      'VAULT_ENDPOINT=https://vault.unfantasmaenelsistema.local\nRECOVERY_TOKEN=GHOST-9941-SYSADMIN-KEY',
                  },
                  'leeme_sysadmin.txt': {
                    name: 'leeme_sysadmin.txt',
                    type: 'file',
                    size: 685,
                    updatedAt: '01/11/2026 08:00',
                    permissions: 'rw-r--r--',
                    octal: '644',
                    owner: 'Administrador',
                    attributes: ['A'],
                    acl: 'BUILTIN\\Administradores:(F)',
                    content:
                      'Incidencias Windows Server 2025:\r\n- Mover balance_2026.xlsx a carpeta Archivo\r\n- Limpiar atributos oculto/sistema de credenciales.txt (attrib -h -s +r) y asegurar ACL con icacls\r\n- Reparar unidad D: con chkdsk D: /f /r o Repair-Volume\r\n- Reparar imagen WinSxS con DISM /RestoreHealth y sfc /scannow\r\n- Terminar proceso intruso crypto_miner.exe (PID 4812)\r\n- Auditar conexiones (netstat -ano) y vaciar caché DNS (ipconfig /flushdns)',
                  },
                  'cache_old.tmp': {
                    name: 'cache_old.tmp',
                    type: 'file',
                    size: 15360,
                    updatedAt: '28/10/2026 11:10',
                    permissions: 'rw-r--r--',
                    octal: '644',
                    owner: 'Administrador',
                    attributes: ['A'],
                    acl: 'TODOS:(F)',
                    content: 'TMP_SESSION_CACHE_00192',
                  },
                },
              },
            },
          },
        },
      },
      Windows: {
        name: 'Windows',
        type: 'dir',
        size: 0,
        updatedAt: '01/11/2026 08:00',
        permissions: 'rwxr-xr-x',
        octal: '755',
        owner: 'TrustedInstaller',
        attributes: ['D'],
        acl: 'NT SERVICE\\TrustedInstaller:(F)',
        children: {
          System32: {
            name: 'System32',
            type: 'dir',
            size: 0,
            updatedAt: '01/11/2026 08:00',
            permissions: 'rwxr-xr-x',
            octal: '755',
            owner: 'TrustedInstaller',
            attributes: ['D'],
            acl: 'NT SERVICE\\TrustedInstaller:(F)',
            children: {
              'kernel32.dll': {
                name: 'kernel32.dll',
                type: 'file',
                size: 782336,
                updatedAt: '15/09/2026 12:00',
                permissions: 'rwxr-xr-x',
                octal: '755',
                owner: 'TrustedInstaller',
                attributes: ['A', 'S'],
                acl: 'NT SERVICE\\TrustedInstaller:(F)',
                content: 'MZ_PE32_PLUS_KERNEL32_BINARY',
              },
            },
          },
        },
      },
    },
  };

  syncSizes(bashRoot);

  return {
    bashCwd: '/home/sysadmin',
    bashRoot,
    bashProcesses: [
      {
        pid: 1,
        name: 'systemd',
        user: 'root',
        cpu: '0.1%',
        mem: '0.8%',
        status: 'Running',
        command: '/sbin/init splash',
        critical: true,
      },
      {
        pid: 842,
        name: 'sshd',
        user: 'root',
        cpu: '0.2%',
        mem: '1.1%',
        status: 'Running',
        command: 'sshd: /usr/sbin/sshd -D',
        port: 22,
        critical: true,
      },
      {
        pid: 1042,
        name: 'nginx',
        user: 'www-data',
        cpu: '1.4%',
        mem: '2.6%',
        status: 'Running',
        command: 'nginx: master process /usr/sbin/nginx',
        port: 80,
      },
      {
        pid: 3104,
        name: 'runaway_syncd',
        user: 'sysadmin',
        cpu: '96.4%',
        mem: '78.2%',
        status: 'Hung / High CPU',
        command: '/usr/local/bin/runaway_syncd --infinite-loop',
        port: 9091,
        isRogue: true,
      },
    ],
    bashDisks: [
      {
        id: '/dev/sda1',
        mount: '/',
        fsType: 'ext4',
        size: '80G',
        used: '28G (35%)',
        status: 'Healthy',
        errorsFound: 0,
        repaired: true,
        mounted: true,
      },
      {
        id: '/dev/sdb1',
        mount: '/mnt/datos',
        fsType: 'ext4',
        size: '250G',
        used: '142G (57%)',
        status: 'Corrupted (Inodes/Bad Sectors)',
        errorsFound: 14,
        repaired: false,
        mounted: true,
      },
    ],
    bashFirewallEnabled: false,
    bashFirewallRules: [],
    bashNginxActive: true,
    cmdCwd: 'C:\\Users\\Administrador\\Proyectos',
    cmdRoot,
    cmdProcesses: [
      {
        pid: 4,
        name: 'System',
        user: 'SYSTEM',
        cpu: '0.2%',
        mem: '148 K',
        status: 'Running',
        command: 'NT Kernel & System',
        port: 445,
        critical: true,
      },
      {
        pid: 912,
        name: 'svchost.exe',
        user: 'SYSTEM',
        cpu: '0.8%',
        mem: '28.440 K',
        status: 'Running',
        command: 'C:\\Windows\\System32\\svchost.exe -k netsvcs',
        port: 135,
        critical: true,
      },
      {
        pid: 1420,
        name: 'svchost.exe',
        user: 'NETWORK SERVICE',
        cpu: '0.4%',
        mem: '16.120 K',
        status: 'Running',
        command: 'C:\\Windows\\System32\\svchost.exe -k NetworkService',
        port: 53,
        critical: true,
      },
      {
        pid: 2680,
        name: 'explorer.exe',
        user: 'Administrador',
        cpu: '1.1%',
        mem: '84.910 K',
        status: 'Running',
        command: 'C:\\Windows\\explorer.exe',
      },
      {
        pid: 4812,
        name: 'crypto_miner.exe',
        user: 'Administrador',
        cpu: '98.7%',
        mem: '1.420.880 K',
        status: 'Hung / High CPU',
        command: 'C:\\Temp\\crypto_miner.exe --pool ghost-rogue:4444',
        port: 4444,
        isRogue: true,
      },
    ],
    cmdDisks: [
      {
        id: 'C:',
        mount: 'C:\\ (Sistema_OS)',
        fsType: 'NTFS',
        size: '120 GB',
        used: '64 GB (53%)',
        status: 'Healthy',
        errorsFound: 0,
        repaired: true,
      },
      {
        id: 'D:',
        mount: 'D:\\ (Datos_Raid)',
        fsType: 'NTFS',
        size: '500 GB',
        used: '310 GB (62%)',
        status: 'Corrupted (Inodes/Bad Sectors)',
        errorsFound: 9,
        repaired: false,
      },
    ],
    dismComponentStoreHealthy: false,
    sfcSystemFilesHealthy: false,
    cmdDnsFlushed: false,
    cmdFirewallEnabled: true,
  };
}

function cloneState(state: SystemHealthState): SystemHealthState {
  return JSON.parse(JSON.stringify(state));
}

export function octalToSymbolic(octal: string): string {
  const clean = octal.length === 4 ? octal.slice(1) : octal;
  const map: Record<string, string> = {
    '0': '---',
    '1': '--x',
    '2': '-w-',
    '3': '-wx',
    '4': 'r--',
    '5': 'r-x',
    '6': 'rw-',
    '7': 'rwx',
  };
  return clean
    .split('')
    .map((d) => map[d] || 'r--')
    .join('');
}

export function resolveLinuxPath(cwd: string, target: string): string {
  if (!target || target === '~') return '/home/sysadmin';
  let path = target.startsWith('~/')
    ? '/home/sysadmin/' + target.slice(2)
    : target.startsWith('/')
      ? target
      : cwd + '/' + target;
  const parts = path.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
}

export function resolveWinPath(cwd: string, target: string): string {
  if (!target) return cwd;
  const normalizedTarget = target.replace(/\//g, '\\');
  let combined = /^[A-Za-z]:/.test(normalizedTarget)
    ? normalizedTarget
    : cwd.replace(/\\$/, '') + '\\' + normalizedTarget;

  const driveMatch = combined.match(/^([A-Za-z]:)(.*)$/);
  const drive = driveMatch ? driveMatch[1].toUpperCase() : 'C:';
  const rest = driveMatch ? driveMatch[2] : combined;
  const parts = rest.split('\\').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.length === 0 ? `${drive}\\` : `${drive}\\${stack.join('\\')}`;
}

export function getLinuxNodeByPath(
  root: VFSNode,
  absPath: string
): VFSNode | null {
  if (absPath === '/') return root;
  const parts = absPath.split('/').filter(Boolean);
  let curr: VFSNode | undefined = root;
  for (const p of parts) {
    if (!curr || curr.type !== 'dir' || !curr.children) return null;
    curr = curr.children[p];
  }
  return curr || null;
}

export function getWinNodeByPath(
  root: VFSNode,
  absPath: string
): VFSNode | null {
  // El árbol de ficheros simulado es la unidad C:; D: es un volumen de datos solo para chkdsk
  const drive = absPath.match(/^([A-Za-z]):/);
  if (drive && drive[1].toUpperCase() !== 'C') return null;
  const clean = absPath.replace(/^[A-Za-z]:\\?/, '');
  if (!clean) return root;
  const parts = clean.split('\\').filter(Boolean);
  let curr: VFSNode | undefined = root;
  for (const p of parts) {
    if (!curr || curr.type !== 'dir' || !curr.children) return null;
    const key: string | undefined = Object.keys(curr.children).find(
      (k) => k.toLowerCase() === p.toLowerCase()
    );
    curr = key ? curr.children[key] : undefined;
  }
  return curr || null;
}

function writeLinuxFile(
  root: VFSNode,
  absPath: string,
  content: string,
  append: boolean
): boolean {
  const parts = absPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return false;
  const dirPath = '/' + parts.join('/');
  const dirNode = getLinuxNodeByPath(root, dirPath);
  if (!dirNode || dirNode.type !== 'dir') return false;
  if (!dirNode.children) dirNode.children = {};

  const existing = dirNode.children[fileName];
  if (existing && existing.type === 'dir') return false;

  const newContent =
    append && existing?.content
      ? `${existing.content}\n${content}`
      : content;

  dirNode.children[fileName] = {
    name: fileName,
    type: 'file',
    size: utf8Length(newContent),
    updatedAt: '2026-11-01 08:30',
    permissions: existing?.permissions || 'rw-r--r--',
    octal: existing?.octal || '644',
    owner: existing?.owner || 'sysadmin:sysadmin',
    attributes: [],
    acl: '',
    content: newContent,
  };
  return true;
}

function writeWinFile(
  root: VFSNode,
  absPath: string,
  content: string,
  append: boolean
): boolean {
  const clean = absPath.replace(/^[A-Za-z]:\\?/, '');
  const parts = clean.split('\\').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return false;
  const dirPath = 'C:\\' + parts.join('\\');
  const dirNode = getWinNodeByPath(root, dirPath);
  if (!dirNode || dirNode.type !== 'dir') return false;
  if (!dirNode.children) dirNode.children = {};

  const existingKey = Object.keys(dirNode.children).find(
    (k) => k.toLowerCase() === fileName.toLowerCase()
  );
  const existing = existingKey ? dirNode.children[existingKey] : undefined;
  if (existing && existing.type === 'dir') return false;

  const actualName = existingKey || fileName;
  const newContent =
    append && existing?.content
      ? `${existing.content}\n${content}`
      : content;

  dirNode.children[actualName] = {
    name: actualName,
    type: 'file',
    size: utf8Length(newContent),
    updatedAt: '01/11/2026 08:30',
    permissions: 'rw-r--r--',
    octal: '644',
    owner: 'Administrador',
    attributes: existing?.attributes || ['A'],
    acl: existing?.acl || 'BUILTIN\\Administradores:(F)',
    content: newContent,
  };
  return true;
}

export function executeCommand(
  rawCommand: string,
  shell: ShellMode,
  currentState: SystemHealthState,
  commandHistory: string[] = []
): {
  nextState: SystemHealthState;
  output: string;
  status: 'success' | 'warning' | 'error';
  didactic: DidacticAnalysis;
  clearRequested?: boolean;
  clearHistoryRequested?: boolean;
} {
  const trimmed = rawCommand.trim();
  const nextState = cloneState(currentState);

  if (!trimmed) {
    return {
      nextState,
      output: '',
      status: 'success',
      didactic: buildDidactic(rawCommand, shell, 'success', nextState),
    };
  }

  // Handle chained commands separated by &&
  if (trimmed.includes('&&')) {
    const subCommands = trimmed
      .split('&&')
      .map((s) => s.trim())
      .filter(Boolean);
    let combinedOut: string[] = [];
    let latestState = nextState;
    let finalStatus: 'success' | 'warning' | 'error' = 'success';
    let clearFlag = false;
    let clearHistFlag = false;

    for (const sub of subCommands) {
      const res = executeSinglePipeline(sub, shell, latestState, commandHistory);
      latestState = res.nextState;
      if (res.clearRequested) clearFlag = true;
      if (res.clearHistoryRequested) clearHistFlag = true;
      if (res.output) combinedOut.push(res.output);
      if (res.status === 'error') {
        finalStatus = 'error';
        break;
      }
      if (res.status === 'warning' && finalStatus === 'success') {
        finalStatus = 'warning';
      }
    }

    return {
      nextState: latestState,
      output: combinedOut.join('\n'),
      status: finalStatus,
      didactic: buildDidactic(trimmed, shell, finalStatus, latestState),
      clearRequested: clearFlag,
      clearHistoryRequested: clearHistFlag,
    };
  }

  const singleResult = executeSinglePipeline(
    trimmed,
    shell,
    nextState,
    commandHistory
  );
  return {
    ...singleResult,
    didactic: buildDidactic(
      trimmed,
      shell,
      singleResult.status,
      singleResult.nextState
    ),
  };
}

function executeSinglePipeline(
  cmdString: string,
  shell: ShellMode,
  state: SystemHealthState,
  commandHistory: string[] = []
): {
  nextState: SystemHealthState;
  output: string;
  status: 'success' | 'warning' | 'error';
  clearRequested?: boolean;
  clearHistoryRequested?: boolean;
} {
  let redirectTarget: string | null = null;
  let isAppend = false;
  let mainCommandPart = cmdString;

  const appendMatch = cmdString.match(/^(.*?)\s*>>\s*([^\s>]+)\s*$/);
  const overwriteMatch = !appendMatch
    ? cmdString.match(/^(.*?)\s*>\s*([^\s>]+)\s*$/)
    : null;

  if (appendMatch) {
    mainCommandPart = appendMatch[1].trim();
    redirectTarget = appendMatch[2].replace(/['"]/g, '').trim();
    isAppend = true;
  } else if (overwriteMatch) {
    mainCommandPart = overwriteMatch[1].trim();
    redirectTarget = overwriteMatch[2].replace(/['"]/g, '').trim();
    isAppend = false;
  }

  const pipeSegments = mainCommandPart
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  let stdinBuffer: string | null = null;
  let lastStatus: 'success' | 'warning' | 'error' = 'success';
  let clearRequested = false;
  let clearHistoryRequested = false;

  for (let i = 0; i < pipeSegments.length; i++) {
    const seg = pipeSegments[i];
    const segResult: ReturnType<typeof runBashAtomic> =
      shell === 'bash'
        ? runBashAtomic(seg, state, stdinBuffer, commandHistory)
        : runCmdAtomic(seg, state, stdinBuffer, commandHistory);

    if (segResult.clearRequested) clearRequested = true;
    if (segResult.clearHistoryRequested) clearHistoryRequested = true;
    stdinBuffer = segResult.output;
    lastStatus = segResult.status;

    if (lastStatus === 'error') {
      break;
    }
  }

  const finalOutput = stdinBuffer ?? '';

  if (redirectTarget && lastStatus !== 'error') {
    if (shell === 'bash') {
      const targetPath = resolveLinuxPath(state.bashCwd, redirectTarget);
      // La redirección la abre tu shell con tu usuario: «sudo cmd > /etc/x» no sirve (usa sudo tee)
      const denied = linuxWriteDenied(state.bashRoot, targetPath, false);
      if (denied) {
        return {
          nextState: state,
          output: `bash: ${redirectTarget}: ${denied}${denied === 'Permiso denegado' ? ' (la redirección > la hace tu shell sin sudo; prueba: comando | sudo tee ' + redirectTarget + ')' : ''}`,
          status: 'error',
        };
      }
      const ok = writeLinuxFile(
        state.bashRoot,
        targetPath,
        finalOutput,
        isAppend
      );
      if (!ok) {
        return {
          nextState: state,
          output: `bash: ${redirectTarget}: No existe el directorio o es un directorio`,
          status: 'error',
        };
      }
      return {
        nextState: state,
        output: `[Redirección ${isAppend ? '>> (anexado)' : '> (sobrescritura)'} completada en ${targetPath} (${finalOutput.length} bytes escritos)]`,
        status: 'success',
      };
    } else {
      const targetPath = resolveWinPath(state.cmdCwd, redirectTarget);
      const ok = writeWinFile(
        state.cmdRoot,
        targetPath,
        finalOutput,
        isAppend
      );
      if (!ok) {
        return {
          nextState: state,
          output: `El sistema no puede encontrar la ruta especificada: ${redirectTarget}`,
          status: 'error',
        };
      }
      return {
        nextState: state,
        output: `[Flujo estándar redirigido ${isAppend ? '(>>)' : '(>)'} correctamente hacia ${targetPath}]`,
        status: 'success',
      };
    }
  }

  return {
    nextState: state,
    output: finalOutput,
    status: lastStatus,
    clearRequested,
    clearHistoryRequested,
  };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
      inQuotes = !inQuotes;
      quoteChar = inQuotes ? ch : '';
      continue;
    }
    if (ch === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

const BASH_MAN_PAGES: Record<string, string> = {
  fsck: 'NOMBRE: fsck - comprueba y repara un sistema de ficheros Linux\nSINOPSIS: sudo fsck [-y] [-f] /dev/sdX\nDESCRIPCIÓN: Analiza superbloques, inodos huérfanos y mapas de bits de bloques en particiones ext2/ext3/ext4.',
  chmod:
    'NOMBRE: chmod - cambia los bits de modo de acceso de un fichero\nSINOPSIS: chmod <octal> <fichero> (ej. chmod 600 id_rsa, chmod 750 deploy.sh)\nNOTACIÓN OCTAL: 4 (lectura r), 2 (escritura w), 1 (ejecución x).',
  chown:
    'NOMBRE: chown - cambia el propietario y grupo de un fichero\nSINOPSIS: sudo chown [usuario][:grupo] <fichero>',
  ss: 'NOMBRE: ss - utilidad para investigar sockets de red\nSINOPSIS: ss -tulnp\nOPCIONES: -t (TCP), -u (UDP), -l (Listening), -n (numérico), -p (mostrar PID/proceso).',
  ufw: 'NOMBRE: ufw - programa para gestionar el cortafuegos Netfilter\nSINOPSIS: sudo ufw <enable|disable|status>',
  ps: 'NOMBRE: ps - informa de una instantánea de los procesos actuales\nSINOPSIS: ps aux | ps -ef',
  kill: 'NOMBRE: kill - envía una señal a un proceso\nSINOPSIS: sudo kill -9 <PID> (envía SIGKILL para terminación inmediata).',
  grep: 'NOMBRE: grep - imprime líneas que concuerdan con un patrón\nSINOPSIS: grep [-i] [-n] PATRÓN [FICHERO]',
  sha256sum:
    'NOMBRE: sha256sum - calcula y verifica resúmenes de mensaje SHA256 (256-bit)\nSINOPSIS: sha256sum <fichero> > lista.sha256  |  sha256sum -c lista.sha256 (comprueba que nada ha cambiado)',
  mount: 'NOMBRE: mount - monta un sistema de ficheros\nSINOPSIS: mount (lista los montados) | sudo mount /dev/sdb1 | sudo mount -a (todo lo de /etc/fstab)',
  umount:
    'NOMBRE: umount - desmonta un sistema de ficheros\nSINOPSIS: sudo umount /mnt/datos | sudo umount /dev/sdb1\nNOTA: no se puede desmontar si algún proceso (o tu propia shell con cd) está dentro.',
  tee: 'NOMBRE: tee - lee de la entrada estándar y escribe en la salida y en ficheros\nSINOPSIS: comando | sudo tee [-a] /etc/fichero\nNOTA: «sudo echo x > /etc/f» falla porque la redirección la hace tu shell sin privilegios; con «| sudo tee» escribe root.',
  find: 'NOMBRE: find - busca ficheros en una jerarquía de directorios\nSINOPSIS: find [ruta] [-name "*.log"] [-type f|d]',
  wc: 'NOMBRE: wc - cuenta líneas, palabras y bytes\nSINOPSIS: wc [-l] [-w] [-c] [fichero]',
};

function runBashAtomic(
  seg: string,
  state: SystemHealthState,
  stdin: string | null,
  commandHistory: string[] = []
): {
  output: string;
  status: 'success' | 'warning' | 'error';
  clearRequested?: boolean;
  clearHistoryRequested?: boolean;
} {
  const tokens = tokenize(seg);
  if (tokens.length === 0) return { output: '', status: 'success' };

  let isSudo = false;
  if (tokens[0] === 'sudo') {
    isSudo = true;
    tokens.shift();
  }
  if (tokens.length === 0) {
    return {
      output: 'usage: sudo -h | -K | -k | -V | comando',
      status: 'warning',
    };
  }

  const cmd = tokens[0];
  const args = tokens.slice(1);

  switch (cmd) {
    case 'clear':
      return { output: '', status: 'success', clearRequested: true };

    case 'history': {
      if (args.includes('-c')) {
        return {
          output: '[Historial de comandos de la sesión borrado de memoria y localStorage]',
          status: 'success',
          clearHistoryRequested: true,
        };
      }
      const list = [...commandHistory, seg];
      return {
        output: list
          .map((item, idx) => `${String(idx + 1).padStart(5)}  ${item}`)
          .join('\n'),
        status: 'success',
      };
    }

    case 'help':
      return {
        output: [
          'Comandos disponibles en GNU Bash (CLI Sandbox):',
          '  Navegación y Ficheros : pwd, ls [-la], stat <f>, cd <ruta>, mkdir [-p] <dir>, touch <f>, cp [-r], mv, rm [-rf], cat, head/tail [-n N], wc [-lwc], find [ruta] [-name patrón] [-type f|d], echo',
          '  Integridad y Manual   : sha256sum <f>, sha256sum -c <lista>, md5sum <f>, man <comando>, id, whoami, uname -a, free -h',
          '  Filtrado y Redirección: grep [-i -v -n -c] <patrón> [f], comando | grep <patrón>, comando > fichero, comando >> fichero, comando | sudo tee [-a] fichero',
          '  Permisos y Seguridad  : chmod <600|755|u+x|go-rwx> <fichero>, sudo chown <usuario:grupo> <fichero>',
          '  Discos y Bloques      : lsblk, df -h, mount, sudo umount <punto|disp.>, sudo fsck -y /dev/sdb1, sudo mount <disp.|-a>',
          '  Procesos y Servicios  : ps aux, top, kill [-9] <PID>, sudo systemctl <status|restart|stop> <servicio>',
          '  Redes y Cortafuegos   : ss -tulnp / ss -tunp, ip a, ping <host>, sudo ufw <status|allow|deny|enable|disable>',
        ].join('\n'),
        status: 'success',
      };

    case 'man': {
      const topic = (args[0] || '').toLowerCase();
      if (!topic) {
        return {
          output: '¿Qué página de manual desea? Ejemplo: man fsck, man chmod, man ss',
          status: 'warning',
        };
      }
      const page = BASH_MAN_PAGES[topic];
      if (!page) {
        return {
          output: `No hay entrada de manual para ${topic}. Prueba con: ${Object.keys(BASH_MAN_PAGES).join(', ')}`,
          status: 'warning',
        };
      }
      return { output: page, status: 'success' };
    }

    case 'pwd':
      return { output: state.bashCwd, status: 'success' };

    case 'whoami':
      return { output: isSudo ? 'root' : 'sysadmin', status: 'success' };

    case 'id':
      return {
        output: isSudo
          ? 'uid=0(root) gid=0(root) grupos=0(root)'
          : 'uid=1000(sysadmin) gid=1000(sysadmin) grupos=1000(sysadmin),4(adm),27(sudo),33(www-data)',
        status: 'success',
      };

    case 'hostname':
      return {
        output: 'ghost-srv.unfantasmaenelsistema.local',
        status: 'success',
      };

    case 'uname':
      return {
        output: args.includes('-a')
          ? 'Linux ghost-srv 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'
          : 'Linux',
        status: 'success',
      };

    case 'free': {
      const rogueAlive = state.bashProcesses.some((p) => p.isRogue);
      return {
        output: [
          '               total        used        free      shared  buff/cache   available',
          rogueAlive
            ? 'Mem:           16Gi        14Gi       512Mi       120Mi       1.4Gi       1.1Gi'
            : 'Mem:           16Gi       2.4Gi        11Gi        80Mi       2.5Gi        13Gi',
          'Swap:          4.0Gi       1.2Gi       2.8Gi',
        ].join('\n'),
        status: 'success',
      };
    }

    case 'cd': {
      const target = args[0] || '~';
      const resolved = resolveLinuxPath(state.bashCwd, target);
      const node = getLinuxNodeByPath(state.bashRoot, resolved);
      if (!node) {
        return {
          output: `bash: cd: ${target}: No existe el archivo o el directorio`,
          status: 'error',
        };
      }
      if (node.type !== 'dir') {
        return {
          output: `bash: cd: ${target}: No es un directorio`,
          status: 'error',
        };
      }
      state.bashCwd = resolved;
      return { output: '', status: 'success' };
    }

    case 'ls': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const pathArg = args.find((a) => !a.startsWith('-')) || state.bashCwd;
      const resolved = resolveLinuxPath(state.bashCwd, pathArg);
      const node = getLinuxNodeByPath(state.bashRoot, resolved);

      if (!node) {
        return {
          output: `ls: no se puede acceder a '${pathArg}': No existe el archivo o el directorio`,
          status: 'error',
        };
      }
      if (node.type === 'file') {
        return { output: node.name, status: 'success' };
      }
      const showHidden = flags.includes('a');
      const longFormat = flags.includes('l');
      const entries = Object.values(node.children || {}).filter(
        (child) => showHidden || !child.name.startsWith('.')
      );

      if (!longFormat) {
        return {
          output: entries
            .map((e) => (e.type === 'dir' ? `${e.name}/` : e.name))
            .join('  '),
          status: 'success',
        };
      }

      const lines = [`total ${entries.length * 4}`];
      for (const e of entries) {
        const prefix = e.type === 'dir' ? 'd' : '-';
        const [u, g] = e.owner.split(':');
        lines.push(
          `${prefix}${e.permissions}  1 ${u.padEnd(8)} ${(g || u).padEnd(8)} ${String(e.size).padStart(7)} ${e.updatedAt} ${e.type === 'dir' ? e.name + '/' : e.name}`
        );
      }
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'stat': {
      if (!args[0]) {
        return { output: 'stat: falta un operando', status: 'error' };
      }
      const abs = resolveLinuxPath(state.bashCwd, args[0]);
      const node = getLinuxNodeByPath(state.bashRoot, abs);
      if (!node) {
        return {
          output: `stat: no se puede efectuar 'stat' sobre '${args[0]}': No existe el archivo`,
          status: 'error',
        };
      }
      return {
        output: [
          `  Fichero: ${node.name}`,
          `  Tamaño: ${node.size}\tBloques: 8\t${node.type === 'dir' ? 'directorio' : 'fichero regular'}`,
          `Acceso: (0${node.octal}/${node.type === 'dir' ? 'd' : '-'}${node.permissions})  Uid: (${node.owner.split(':')[0]})   Gid: (${node.owner.split(':')[1] || node.owner.split(':')[0]})`,
          `Modificación: ${node.updatedAt}`,
        ].join('\n'),
        status: 'success',
      };
    }

    case 'sha256sum':
    case 'md5sum': {
      const hashOf = (text: string) => (cmd === 'md5sum' ? md5Hex(text) : sha256Hex(text));
      // sha256sum -c lista.sha256: vuelve a calcular cada hash y lo compara
      if (args.includes('-c') || args.includes('--check')) {
        const listArg = args.find((a) => !a.startsWith('-'));
        const listText = listArg
          ? getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, listArg))?.content
          : stdin;
        if (listText == null) {
          return { output: `${cmd}: ${listArg ?? '-'}: No existe el archivo o el directorio`, status: 'error' };
        }
        const results: string[] = [];
        let failures = 0;
        for (const line of listText.split('\n').filter((l) => l.trim())) {
          const m = line.match(/^([0-9a-fA-F]+)\s+\*?(.+)$/);
          if (!m) continue;
          const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, m[2].trim()));
          const ok = Boolean(node && node.type === 'file' && hashOf(node.content || '') === m[1].toLowerCase());
          if (!ok) failures += 1;
          results.push(`${m[2].trim()}: ${node ? (ok ? 'La suma coincide' : 'FALLÓ') : 'NO SE PUEDE LEER'}`);
        }
        if (failures) results.push(`${cmd}: ATENCIÓN: ${failures} suma(s) calculada(s) NO coincide(n)`);
        return { output: results.join('\n'), status: failures ? 'error' : 'success' };
      }
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        if (stdin !== null) return { output: `${hashOf(stdin)}  -`, status: 'success' };
        return { output: `${cmd}: falta el archivo a verificar`, status: 'error' };
      }
      const lines: string[] = [];
      for (const target of targets) {
        const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, target));
        if (!node) return { output: `${cmd}: ${target}: No existe el archivo o el directorio`, status: 'error' };
        if (node.type === 'dir') return { output: `${cmd}: ${target}: Es un directorio`, status: 'error' };
        if (!canAccess(node, 'r', isSudo)) return { output: `${cmd}: ${target}: Permiso denegado`, status: 'error' };
        lines.push(`${hashOf(node.content || '')}  ${target}`);
      }
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'mkdir': {
      const withParents = args.includes('-p');
      const dirTargets = args.filter((a) => !a.startsWith('-'));
      if (dirTargets.length === 0) {
        return { output: 'mkdir: falta un operando', status: 'error' };
      }
      for (const rawTarget of dirTargets) {
        const abs = resolveLinuxPath(state.bashCwd, rawTarget);
        const existing = getLinuxNodeByPath(state.bashRoot, abs);
        if (existing) {
          if (withParents && existing.type === 'dir') continue;
          return { output: `mkdir: no se puede crear el directorio «${rawTarget}»: El archivo ya existe`, status: 'error' };
        }
        const parts = abs.split('/').filter(Boolean);
        let curr = state.bashRoot;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (!curr.children) curr.children = {};
          if (!curr.children[p]) {
            if (i < parts.length - 1 && !withParents) {
              return { output: `mkdir: no se puede crear el directorio «${rawTarget}»: No existe el archivo o el directorio (usa mkdir -p)`, status: 'error' };
            }
            if (!canAccess(curr, 'w', isSudo)) {
              return { output: `mkdir: no se puede crear el directorio «${rawTarget}»: Permiso denegado`, status: 'error' };
            }
            curr.children[p] = {
              name: p,
              type: 'dir',
              size: 4096,
              updatedAt: '2026-11-01 08:30',
              permissions: 'rwxr-xr-x',
              octal: '755',
              owner: isSudo ? 'root:root' : 'sysadmin:sysadmin',
              attributes: [],
              acl: '',
              children: {},
            };
          } else if (curr.children[p].type !== 'dir') {
            return { output: `mkdir: no se puede crear el directorio «${rawTarget}»: No es un directorio`, status: 'error' };
          }
          curr = curr.children[p];
        }
      }
      return { output: '', status: 'success' };
    }

    case 'touch': {
      const fileTargets = args.filter((a) => !a.startsWith('-'));
      if (fileTargets.length === 0) {
        return { output: 'touch: falta un operando de archivo', status: 'error' };
      }
      for (const t of fileTargets) {
        const abs = resolveLinuxPath(state.bashCwd, t);
        const existing = getLinuxNodeByPath(state.bashRoot, abs);
        if (existing) {
          // touch sobre algo que ya existe solo actualiza la fecha: no cambia el contenido
          if (!canAccess(existing, 'w', isSudo) && !isOwner(existing)) {
            return { output: `touch: no se puede efectuar 'touch' sobre '${t}': Permiso denegado`, status: 'error' };
          }
          existing.updatedAt = '2026-11-01 08:30';
          continue;
        }
        const denied = linuxWriteDenied(state.bashRoot, abs, isSudo);
        if (denied) return { output: `touch: no se puede efectuar 'touch' sobre '${t}': ${denied}`, status: 'error' };
        writeLinuxFile(state.bashRoot, abs, '', false);
      }
      return { output: '', status: 'success' };
    }

    case 'cp':
    case 'mv': {
      const recursive = args.some((a) => /^-[a-zA-Z]*[rRa]/.test(a));
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return { output: `${cmd}: falta el operando de archivo de destino`, status: 'error' };
      }
      const srcPath = resolveLinuxPath(state.bashCwd, cleanArgs[0]);
      const srcNode = getLinuxNodeByPath(state.bashRoot, srcPath);
      if (!srcNode) {
        return { output: `${cmd}: no se puede efectuar 'stat' sobre '${cleanArgs[0]}': No existe el archivo o el directorio`, status: 'error' };
      }
      if (cmd === 'cp' && srcNode.type === 'dir' && !recursive) {
        return { output: `cp: -r no especificado; se omite el directorio '${cleanArgs[0]}'`, status: 'error' };
      }
      if (cmd === 'cp' && srcNode.type === 'file' && !canAccess(srcNode, 'r', isSudo)) {
        return { output: `cp: no se puede abrir '${cleanArgs[0]}' para lectura: Permiso denegado`, status: 'error' };
      }
      const destPath = resolveLinuxPath(state.bashCwd, cleanArgs[1]);
      const destNode = getLinuxNodeByPath(state.bashRoot, destPath);
      const finalDestPath =
        destNode && destNode.type === 'dir' ? `${destPath.replace(/\/$/, '')}/${srcNode.name}` : destPath;
      if (finalDestPath === srcPath || finalDestPath.startsWith(srcPath + '/')) {
        return { output: `${cmd}: no se puede ${cmd === 'cp' ? 'copiar' : 'mover'} '${cleanArgs[0]}' a un subdirectorio de sí mismo`, status: 'error' };
      }
      const existingDest = getLinuxNodeByPath(state.bashRoot, finalDestPath);
      if (existingDest?.type === 'dir' && srcNode.type === 'file') {
        return { output: `${cmd}: no se puede sobrescribir el directorio '${finalDestPath}' con un no directorio`, status: 'error' };
      }
      const denied = existingDest && srcNode.type === 'file'
        ? linuxWriteDenied(state.bashRoot, finalDestPath, isSudo)
        : (() => {
            const dir = getLinuxNodeByPath(state.bashRoot, parentPath(finalDestPath));
            if (!dir || dir.type !== 'dir') return 'No existe el archivo o el directorio';
            return canAccess(dir, 'w', isSudo) ? null : 'Permiso denegado';
          })();
      if (denied) {
        return { output: `${cmd}: no se puede crear '${cleanArgs[1]}': ${denied}`, status: 'error' };
      }
      if (cmd === 'mv') {
        const srcParent = getLinuxNodeByPath(state.bashRoot, parentPath(srcPath));
        if (!srcParent || !canAccess(srcParent, 'w', isSudo)) {
          return { output: `mv: no se puede mover '${cleanArgs[0]}': Permiso denegado`, status: 'error' };
        }
      }
      // Copia profunda del nodo (ficheros y carpetas con todo su contenido)
      const copy: VFSNode = JSON.parse(JSON.stringify(srcNode));
      const destName = finalDestPath.split('/').filter(Boolean).pop()!;
      copy.name = destName;
      if (cmd === 'cp') {
        copy.owner = isSudo ? 'root:root' : `${BASH_USER}:${BASH_USER}`;
        copy.updatedAt = '2026-11-01 08:30';
        if (existingDest && existingDest.type === 'file') {
          copy.permissions = existingDest.permissions;
          copy.octal = existingDest.octal;
          copy.owner = existingDest.owner;
        }
      }
      const destDir = getLinuxNodeByPath(state.bashRoot, parentPath(finalDestPath))!;
      if (!destDir.children) destDir.children = {};
      destDir.children[destName] = copy;
      if (cmd === 'mv') {
        const srcParent = getLinuxNodeByPath(state.bashRoot, parentPath(srcPath))!;
        const srcName = srcPath.split('/').filter(Boolean).pop()!;
        if (srcParent.children && srcParent.children[srcName] === srcNode) delete srcParent.children[srcName];
      }
      return { output: '', status: 'success' };
    }

    case 'rm': {
      const recursive = args.some((a) => /^-[a-zA-Z]*[rR]/.test(a));
      const force = args.some((a) => /^-[a-zA-Z]*f/.test(a));
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        return { output: 'rm: falta un operando', status: 'error' };
      }
      for (const t of targets) {
        const abs = resolveLinuxPath(state.bashCwd, t);
        if (abs === '/' || abs === '/home' || abs === '/etc' || abs === '/var') {
          return { output: `rm: bloqueado por el Sandbox de Seguridad: no se permite eliminar el directorio crítico ${abs}`, status: 'error' };
        }
        const name = abs.split('/').filter(Boolean).pop()!;
        const parent = getLinuxNodeByPath(state.bashRoot, parentPath(abs));
        const node = parent?.children?.[name];
        if (!parent || !node) {
          if (force) continue;
          return { output: `rm: no se puede borrar '${t}': No existe el archivo o el directorio`, status: 'error' };
        }
        if (node.type === 'dir' && !recursive) {
          return { output: `rm: no se puede borrar '${t}': Es un directorio (usa rm -r)`, status: 'error' };
        }
        // Borrar depende del permiso de escritura en el directorio que lo contiene, no del fichero
        if (!canAccess(parent, 'w', isSudo)) {
          return { output: `rm: no se puede borrar '${t}': Permiso denegado`, status: 'error' };
        }
        delete parent.children![name];
      }
      return { output: '', status: 'success' };
    }

    case 'cat':
    case 'head':
    case 'tail': {
      let count = 10;
      const fileArgs: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '-n' && args[i + 1]) {
          count = parseInt(args[++i], 10);
        } else if (/^-n\d+$/.test(a) || /^-\d+$/.test(a)) {
          count = parseInt(a.replace(/^-n?/, ''), 10);
        } else if (!a.startsWith('-')) {
          fileArgs.push(a);
        }
      }
      const texts: string[] = [];
      for (const fileArg of fileArgs) {
        const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, fileArg));
        if (!node) return { output: `${cmd}: ${fileArg}: No existe el archivo o el directorio`, status: 'error' };
        if (node.type === 'dir') return { output: `${cmd}: ${fileArg}: Es un directorio`, status: 'error' };
        if (!canAccess(node, 'r', isSudo)) return { output: `${cmd}: ${fileArg}: Permiso denegado`, status: 'error' };
        texts.push(node.content || '');
      }
      const text = fileArgs.length ? texts.join('\n') : stdin;
      if (text === null) {
        return { output: `${cmd}: falta el nombre del archivo`, status: 'error' };
      }
      if (Number.isNaN(count) || count < 0) {
        return { output: `${cmd}: número de líneas no válido`, status: 'error' };
      }
      const lines = text.split('\n');
      if (cmd === 'head') return { output: lines.slice(0, count).join('\n'), status: 'success' };
      if (cmd === 'tail') return { output: count === 0 ? '' : lines.slice(-count).join('\n'), status: 'success' };
      return { output: text, status: 'success' };
    }

    case 'wc': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const fileArg = args.find((a) => !a.startsWith('-'));
      let content = stdin ?? '';
      if (fileArg) {
        const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, fileArg));
        if (!node || node.type === 'dir') return { output: `wc: ${fileArg}: No existe el archivo o es un directorio`, status: 'error' };
        if (!canAccess(node, 'r', isSudo)) return { output: `wc: ${fileArg}: Permiso denegado`, status: 'error' };
        content = node.content || '';
      } else if (stdin === null) {
        return { output: 'wc: esperando entrada por tubería (|) o un fichero', status: 'error' };
      }
      // Los ficheros del simulador se guardan sin el salto de línea final: se cuenta como si lo tuvieran
      const lineCount = content ? content.split('\n').length : 0;
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const byteCount = content ? utf8Length(content) + 1 : 0;
      const parts: number[] = [];
      if (!flags || flags.includes('l')) parts.push(lineCount);
      if (!flags || flags.includes('w')) parts.push(wordCount);
      if (!flags || flags.includes('c')) parts.push(byteCount);
      return { output: `${parts.join(' ')}${fileArg ? ` ${fileArg}` : ''}`, status: 'success' };
    }

    case 'find': {
      const startArg = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const nameIdx = args.indexOf('-name');
      const typeIdx = args.indexOf('-type');
      const namePattern = nameIdx !== -1 ? args[nameIdx + 1] : null;
      const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : null;
      const startAbs = resolveLinuxPath(state.bashCwd, startArg);
      const startNode = getLinuxNodeByPath(state.bashRoot, startAbs);
      if (!startNode) return { output: `find: '${startArg}': No existe el archivo o el directorio`, status: 'error' };
      const regex = namePattern
        ? new RegExp('^' + namePattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
        : null;
      const found: string[] = [];
      const walk = (node: VFSNode, shown: string) => {
        const matchesType = !typeFilter || (typeFilter === 'd' ? node.type === 'dir' : node.type === 'file');
        if (matchesType && (!regex || regex.test(node.name))) found.push(shown);
        if (node.type === 'dir') {
          for (const child of Object.values(node.children || {})) {
            walk(child, `${shown.replace(/\/$/, '')}/${child.name}`);
          }
        }
      };
      walk(startNode, startArg);
      return { output: found.join('\n'), status: 'success' };
    }

    case 'tee': {
      const append = args.includes('-a');
      const targets = args.filter((a) => !a.startsWith('-'));
      const text = stdin ?? '';
      for (const t of targets) {
        const abs = resolveLinuxPath(state.bashCwd, t);
        const denied = linuxWriteDenied(state.bashRoot, abs, isSudo);
        if (denied) return { output: `tee: ${t}: ${denied}`, status: 'error' };
        writeLinuxFile(state.bashRoot, abs, text, append);
      }
      return { output: text, status: 'success' };
    }

    case 'echo':
      return { output: args.join(' '), status: 'success' };

    case 'grep': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      const ignoreCase = flags.includes('i');
      const invert = flags.includes('v');
      const numbered = flags.includes('n');
      const countOnly = flags.includes('c');
      const pattern = cleanArgs[0];
      if (!pattern) {
        return { output: 'Uso: grep [OPCIONES] PATRÓN [ARCHIVO]', status: 'error' };
      }
      let sourceText = stdin;
      if (cleanArgs[1]) {
        const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, cleanArgs[1]));
        if (!node) return { output: `grep: ${cleanArgs[1]}: No existe el archivo o el directorio`, status: 'error' };
        if (node.type === 'dir') return { output: `grep: ${cleanArgs[1]}: Es un directorio`, status: 'error' };
        if (!canAccess(node, 'r', isSudo)) return { output: `grep: ${cleanArgs[1]}: Permiso denegado`, status: 'error' };
        sourceText = node.content || '';
      }
      if (sourceText === null) {
        return { output: 'grep: esperando entrada por tubería (|) o ruta de archivo', status: 'error' };
      }
      const matches = (line: string) =>
        ignoreCase ? line.toLowerCase().includes(pattern.toLowerCase()) : line.includes(pattern);
      const matched = sourceText
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => matches(line) !== invert);
      if (countOnly) return { output: String(matched.length), status: 'success' };
      // Como grep real: sin coincidencias devuelve código 1 (no es un error de sintaxis)
      return {
        output: matched.map(({ line, n }) => (numbered ? `${n}:${line}` : line)).join('\n'),
        status: matched.length ? 'success' : 'warning',
      };
    }

    case 'chmod': {
      const cleanArgs = args.filter((a) => !/^-[a-zA-Z]+$/.test(a));
      if (cleanArgs.length < 2) {
        return { output: 'chmod: faltan operandos. Uso: chmod <modo> <archivo> (ej. 600, 755, u+x, go-rwx)', status: 'error' };
      }
      const mode = cleanArgs[0];
      const fileArg = cleanArgs[1];
      const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, fileArg));
      if (!node) {
        return { output: `chmod: no se puede acceder a '${fileArg}': No existe el archivo o el directorio`, status: 'error' };
      }
      // Solo el propietario o root pueden cambiar los permisos
      if (!isSudo && !isOwner(node)) {
        return { output: `chmod: cambiando los permisos de '${fileArg}': Operación no permitida`, status: 'error' };
      }
      const bits = node.permissions.split('');
      if (/^[0-7]{3,4}$/.test(mode)) {
        const normalized = mode.length === 4 ? mode.slice(1) : mode;
        node.octal = normalized;
        node.permissions = octalToSymbolic(normalized);
      } else if (/^([ugoa]*[+\-=][rwx]*)(,[ugoa]*[+\-=][rwx]*)*$/.test(mode)) {
        for (const clause of mode.split(',')) {
          const m = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/)!;
          const who = (m[1] || 'a').replace('a', 'ugo');
          for (const w of who) {
            const base = w === 'u' ? 0 : w === 'g' ? 3 : 6;
            (['r', 'w', 'x'] as const).forEach((perm, i) => {
              const has = m[3].includes(perm);
              if (m[2] === '+' && has) bits[base + i] = perm;
              if (m[2] === '-' && has) bits[base + i] = '-';
              if (m[2] === '=') bits[base + i] = has ? perm : '-';
            });
          }
        }
        node.permissions = bits.join('');
        node.octal = [0, 3, 6]
          .map((b) => (bits[b] === 'r' ? 4 : 0) + (bits[b + 1] === 'w' ? 2 : 0) + (bits[b + 2] === 'x' ? 1 : 0))
          .join('');
      } else {
        return { output: `chmod: modo inválido: «${mode}» (usa octal como 600/755 o simbólico como u+x, go-rwx)`, status: 'error' };
      }
      return { output: '', status: 'success' };
    }

    case 'chown': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return { output: 'chown: faltan operandos. Uso: sudo chown usuario:grupo <archivo>', status: 'error' };
      }
      const newOwner = cleanArgs[0];
      const fileArg = cleanArgs[1];
      const node = getLinuxNodeByPath(state.bashRoot, resolveLinuxPath(state.bashCwd, fileArg));
      if (!node) {
        return { output: `chown: no se puede acceder a '${fileArg}': No existe el archivo o el directorio`, status: 'error' };
      }
      // Cambiar el propietario de un fichero solo puede hacerlo root
      if (!isSudo) {
        return { output: `chown: cambiando el propietario de '${fileArg}': Operación no permitida (necesitas sudo)`, status: 'error' };
      }
      const [u, g] = newOwner.split(':');
      const currentGroup = node.owner.split(':')[1] || node.owner;
      node.owner = `${u || node.owner.split(':')[0]}:${g === undefined ? currentGroup : g || u}`;
      return { output: '', status: 'success' };
    }

    case 'lsblk': {
      const lines = [
        'NAME     MAJ:MIN  SIZE  TYPE  MOUNTPOINTS   ESTADO (simulador)',
        ...state.bashDisks.map(
          (d, i) =>
            `${d.id.replace('/dev/', '').padEnd(8)} 8:${String(i * 16 + 1).padEnd(5)} ${d.size.padStart(4)}  part  ${(d.mounted !== false ? d.mount : '').padEnd(13)} ${d.status}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'df': {
      const mounted = state.bashDisks.filter((d) => d.mounted !== false);
      const lines = [
        'S.ficheros     Tamaño  Usados        Montado en   Estado (simulador)',
        ...mounted.map(
          (d) => `${d.id.padEnd(14)} ${d.size.padStart(6)}  ${d.used.padEnd(13)} ${d.mount.padEnd(12)} ${d.status}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'umount': {
      if (!isSudo) return { output: 'umount: solo root puede desmontar (usa sudo umount)', status: 'error' };
      const target = args.find((a) => !a.startsWith('-'));
      const disk = state.bashDisks.find((d) => d.id === target || d.mount === target);
      if (!disk) return { output: `umount: ${target ?? ''}: no montado`, status: 'error' };
      if (disk.mount === '/') return { output: `umount: /: el objetivo está ocupado (es la raíz del sistema en uso)`, status: 'error' };
      if (disk.mounted === false) return { output: `umount: ${disk.mount}: no montado`, status: 'error' };
      if (state.bashCwd === disk.mount || state.bashCwd.startsWith(disk.mount + '/')) {
        return { output: `umount: ${disk.mount}: el objetivo está ocupado (sal del directorio con cd ~)`, status: 'error' };
      }
      disk.mounted = false;
      return { output: '', status: 'success' };
    }

    case 'mount': {
      const positional = args.filter((a) => !a.startsWith('-'));
      if (positional.length === 0 && !args.includes('-a')) {
        return {
          output: state.bashDisks
            .filter((d) => d.mounted !== false)
            .map((d) => `${d.id} on ${d.mount} type ${d.fsType} (rw,relatime)`)
            .join('\n'),
          status: 'success',
        };
      }
      if (!isSudo) return { output: 'mount: solo root puede montar (usa sudo mount)', status: 'error' };
      const targets = args.includes('-a')
        ? state.bashDisks.filter((d) => d.mounted === false)
        : state.bashDisks.filter((d) => positional.includes(d.id) || positional.includes(d.mount));
      if (targets.length === 0 && !args.includes('-a')) {
        return { output: `mount: ${positional[0]}: no se encuentra en /etc/fstab`, status: 'error' };
      }
      for (const d of targets) d.mounted = true;
      return { output: '', status: 'success' };
    }

    case 'fsck': {
      const targetDisk = args.find((a) => a.startsWith('/dev/')) || '/dev/sdb1';
      const disk = state.bashDisks.find((d) => d.id === targetDisk);
      if (!disk) {
        return { output: `fsck from util-linux 2.39.3\nfsck: no se encuentra el dispositivo de bloques ${targetDisk}`, status: 'error' };
      }
      if (!isSudo) {
        return { output: `fsck from util-linux 2.39.3\ne2fsck 1.47.0 (5-Feb-2023)\nfsck.ext4: Permiso denegado al intentar abrir ${targetDisk} (necesitas sudo)`, status: 'error' };
      }
      // Reparar un sistema de ficheros montado puede corromperlo: e2fsck se niega
      if (disk.mounted !== false) {
        return {
          output: `fsck from util-linux 2.39.3\ne2fsck 1.47.0 (5-Feb-2023)\n${targetDisk} está montado.\ne2fsck: No se puede continuar, abortando.\n[Desmonta primero el volumen: sudo umount ${disk.mount === '/' ? targetDisk : disk.mount}${disk.mount === '/' ? ' — la raíz se comprueba al arrancar' : ''}]`,
          status: 'error',
        };
      }
      if (!args.some((a) => /^-[a-zA-Z]*[yp]/.test(a))) {
        return {
          output: `fsck from util-linux 2.39.3\ne2fsck 1.47.0 (5-Feb-2023)\n${targetDisk} contiene un sistema de ficheros con errores, comprobación forzada.\nInodo 18421: referencia a inodo borrado. ¿Corregir? sí\n[Sin -y, e2fsck pregunta antes de cada corrección. Usa sudo fsck -y ${targetDisk} para aceptarlas todas]`,
          status: 'warning',
        };
      }
      disk.repaired = true;
      disk.status = 'Healthy';
      disk.errorsFound = 0;
      return {
        output: [
          `fsck from util-linux 2.39.3`,
          `e2fsck 1.47.0 (5-Feb-2023)`,
          `${targetDisk}: recuperando el journal`,
          `Paso 1: Verificando inodos, bloques y tamaños`,
          `  Inodo 18421 referenciado tras borrarse. ¿Corregir? sí`,
          `Paso 2: Verificando estructura de directorios`,
          `Paso 3: Verificando conectividad de directorios`,
          `Paso 4: Verificando contadores de referencia`,
          `Paso 5: Verificando resumen de grupos`,
          `  Diferencias en el mapa de bits de bloques: -99214. ¿Corregir? sí`,
          `${targetDisk}: ***** EL SISTEMA DE FICHEROS FUE MODIFICADO *****`,
          `${targetDisk}: 41290/16384000 ficheros (0.1% no contiguos), 37224448/65536000 bloques`,
          `[Vuelve a montarlo con: sudo mount ${targetDisk}]`,
        ].join('\n'),
        status: 'success',
      };
    }

    case 'ps':
    case 'top': {
      const lines = [
        'USER         PID  %CPU  %MEM  STAT  COMMAND',
        ...state.bashProcesses.map(
          (p) =>
            `${p.user.padEnd(11)} ${String(p.pid).padStart(4)}  ${p.cpu.padStart(4)}  ${p.mem.padStart(4)}  ${(p.isRogue ? 'R+' : 'Ss').padEnd(5)} ${p.command}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'kill': {
      const pidArg = args.find((a) => /^\d+$/.test(a));
      if (!pidArg) {
        return { output: 'kill: uso: kill [-15|-9] <PID>', status: 'error' };
      }
      const forceKill = args.some((a) => a === '-9' || a.toUpperCase() === '-KILL' || a.toUpperCase() === '-SIGKILL');
      const pid = Number(pidArg);
      const proc = state.bashProcesses.find((p) => p.pid === pid);
      if (!proc) {
        return { output: `bash: kill: (${pid}) - No existe el proceso`, status: 'error' };
      }
      // Solo puedes enviar señales a tus propios procesos; los de otros usuarios exigen root
      if (proc.user !== BASH_USER && !isSudo) {
        return { output: `bash: kill: (${pid}) - Operación no permitida (pertenece a ${proc.user}; necesitas sudo)`, status: 'error' };
      }
      if (proc.critical) {
        return {
          output: `kill: Operación bloqueada por el Sandbox: ${proc.name} (PID ${pid}) es un servicio crítico; matarlo dejaría el servidor sin ${proc.name === 'sshd' ? 'acceso remoto' : 'sistema'}.`,
          status: 'warning',
        };
      }
      // SIGTERM (la señal por defecto) se puede capturar o ignorar; SIGKILL no
      if (!forceKill && proc.status === 'Hung / High CPU') {
        return {
          output: `[El proceso ${pid} (${proc.name}) sigue en ejecución: ha ignorado SIGTERM (15). Si no responde, fuerza con kill -9 ${pid}]`,
          status: 'warning',
        };
      }
      state.bashProcesses = state.bashProcesses.filter((p) => p.pid !== pid);
      return {
        output: forceKill ? `[1]+  Terminado (killed)   ${proc.command}` : `[1]+  Terminado            ${proc.command}`,
        status: 'success',
      };
    }

    case 'systemctl': {
      const action = args[0] || 'status';
      const service = (args[1] || 'nginx').replace(/\.service$/, '');
      const changesState = ['restart', 'start', 'reload', 'stop', 'enable', 'disable'].includes(action);
      if (changesState && !isSudo) {
        return {
          output: `Failed to ${action} ${service}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${service}.service' for details. (usa sudo)`,
          status: 'error',
        };
      }
      if (service === 'nginx' && (action === 'restart' || action === 'start' || action === 'reload')) {
        state.bashNginxActive = true;
        return { output: '', status: 'success' };
      }
      if (service === 'nginx' && action === 'stop') {
        state.bashNginxActive = false;
        return { output: '', status: 'success' };
      }
      if (changesState) return { output: '', status: 'success' };
      const active = service !== 'nginx' || state.bashNginxActive;
      return {
        output: [
          `● ${service}.service - ${service === 'nginx' ? 'A high performance web server and a reverse proxy server' : service}`,
          `     Loaded: loaded (/lib/systemd/system/${service}.service; enabled; preset: enabled)`,
          active
            ? `     Active: active (running) since Sun 2026-11-01 08:00:00 UTC`
            : `     Active: inactive (dead)`,
          ...(active ? [`   Main PID: 1042 (${service})`] : []),
        ].join('\n'),
        status: active ? 'success' : 'warning',
      };
    }

    case 'ss':
    case 'netstat': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const listeningOnly = flags.includes('l');
      const showProcess = flags.includes('p');
      const sockets = [
        { state: 'LISTEN', local: '0.0.0.0:22', peer: '0.0.0.0:*', proc: 'sshd', pid: 842 },
        { state: 'LISTEN', local: '0.0.0.0:80', peer: '0.0.0.0:*', proc: 'nginx', pid: 1042 },
        { state: 'ESTAB', local: '10.0.14.10:22', peer: '10.0.14.8:51922', proc: 'sshd', pid: 2190 },
      ];
      const rogue = state.bashProcesses.find((p) => p.isRogue);
      if (rogue) {
        sockets.push({ state: 'LISTEN', local: `0.0.0.0:${rogue.port ?? 9091}`, peer: '0.0.0.0:*', proc: rogue.name, pid: rogue.pid });
      }
      const visible = sockets.filter((s) => (listeningOnly ? s.state === 'LISTEN' : true));
      const lines = [
        'Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  ' + (showProcess ? 'Process' : ''),
        ...visible.map(
          (s) =>
            `tcp    ${s.state.padEnd(7)} 0       128     ${s.local.padEnd(20)} ${s.peer.padEnd(18)} ${
              showProcess
                ? isSudo || s.proc === rogue?.name
                  ? `users:(("${s.proc}",pid=${s.pid},fd=3))`
                  : ''
                : ''
            }`
        ),
      ];
      if (showProcess && !isSudo) {
        lines.push('[Sin sudo, ss -p solo muestra el proceso de los sockets que son tuyos]');
      }
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'ufw': {
      if (!isSudo) {
        return { output: 'ERROR: Necesitas ser root para ejecutar este script (usa sudo ufw ...)', status: 'error' };
      }
      const sub = (args[0] || 'status').toLowerCase();
      const ruleArg = args[1];
      const normalizeRule = (r: string) => {
        const named: Record<string, string> = { openssh: '22/tcp', ssh: '22/tcp', http: '80/tcp', https: '443/tcp', 'nginx full': '80,443/tcp' };
        const key = r.toLowerCase();
        return named[key] ?? r;
      };
      if ((sub === 'allow' || sub === 'deny') && ruleArg) {
        const target = normalizeRule(args.slice(1).join(' '));
        const rule = `${target} ${sub === 'allow' ? 'ALLOW' : 'DENY'}`;
        state.bashFirewallRules = [...state.bashFirewallRules.filter((r) => !r.startsWith(`${target} `)), rule];
        return { output: 'Rules updated\nRules updated (v6)', status: 'success' };
      }
      if (sub === 'enable') {
        state.bashFirewallEnabled = true;
        const sshAllowed = state.bashFirewallRules.some((r) => /^(22|22\/tcp)\s+ALLOW$/.test(r));
        return {
          output: sshAllowed
            ? 'Command may disrupt existing ssh connections. Proceed with operation (y|n)? y\nFirewall is active and enabled on system startup'
            : 'Command may disrupt existing ssh connections. Proceed with operation (y|n)? y\nFirewall is active and enabled on system startup\n[¡CUIDADO! No hay regla para SSH (22/tcp): la política por defecto bloquea las conexiones entrantes y en un servidor remoto perderías el acceso. Antes de activar: sudo ufw allow OpenSSH]',
          status: sshAllowed ? 'success' : 'warning',
        };
      }
      if (sub === 'disable') {
        state.bashFirewallEnabled = false;
        return { output: 'Firewall stopped and disabled on system startup', status: 'warning' };
      }
      if (!state.bashFirewallEnabled) {
        return { output: 'Status: inactive', status: 'warning' };
      }
      return {
        output: [
          'Status: active',
          '',
          'To                         Action      From',
          '--                         ------      ----',
          ...state.bashFirewallRules.map((r) => {
            const [to, action] = r.split(/\s+(?=ALLOW$|DENY$)/);
            return `${to.padEnd(26)} ${action.padEnd(11)} Anywhere`;
          }),
        ].join('\n'),
        status: 'success',
      };
    }

    case 'ip':
    case 'ifconfig': {
      return {
        output: [
          '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN',
          '    inet 127.0.0.1/8 scope host lo',
          '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP',
          '    inet 10.0.14.10/24 brd 10.0.14.255 scope global eth0',
        ].join('\n'),
        status: 'success',
      };
    }

    case 'ping': {
      const host = args.find((a) => !a.startsWith('-')) || '8.8.8.8';
      return {
        output: [
          `PING ${host} (${host}) 56(84) bytes of data.`,
          `64 bytes from ${host}: icmp_seq=1 ttl=57 time=8.42 ms`,
          `64 bytes from ${host}: icmp_seq=2 ttl=57 time=8.19 ms`,
          `--- ${host} ping statistics ---`,
          `2 packets transmitted, 2 received, 0% packet loss, time 1002ms`,
        ].join('\n'),
        status: 'success',
      };
    }

    default:
      return {
        output: `bash: ${cmd}: comando no encontrado. Escribe 'help' o 'man <comando>' para consultar la ayuda.`,
        status: 'error',
      };
  }
}

function runCmdAtomic(
  seg: string,
  state: SystemHealthState,
  stdin: string | null,
  commandHistory: string[] = []
): {
  output: string;
  status: 'success' | 'warning' | 'error';
  clearRequested?: boolean;
  clearHistoryRequested?: boolean;
} {
  const tokens = tokenize(seg);
  if (tokens.length === 0) return { output: '', status: 'success' };

  const cmd = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  switch (cmd) {
    case 'cls':
    case 'clear':
      return { output: '', status: 'success', clearRequested: true };

    case 'history':
    case 'get-history':
    case 'doskey':
    case 'clear-history': {
      if (cmd === 'clear-history' || args.includes('-c')) {
        return {
          output: '[Historial de sesión en PowerShell/CMD eliminado de localStorage]',
          status: 'success',
          clearHistoryRequested: true,
        };
      }
      const list = [...commandHistory, seg];
      return {
        output: [
          '  Id CommandLine',
          '  -- -----------',
          ...list.map(
            (item, idx) => `${String(idx + 1).padStart(4)} ${item}`
          ),
        ].join('\n'),
        status: 'success',
      };
    }

    case 'help':
      return {
        output: [
          'Comandos disponibles en Windows CMD / PowerShell (CLI Sandbox):',
          '  Directorios y Ficheros : dir [/a], Get-ChildItem [-Force], cd, mkdir, copy, move, del [/f], rmdir [/s /q], Remove-Item [-Recurse], type, Get-Content, tree',
          '  Atributos y Permisos   : attrib [+/-r] [+/-h] [+/-s] <f>, icacls <f> /grant Administrador:(F)',
          '  Integridad Criptográf. : certutil -hashfile <f> SHA256|MD5, Get-FileHash <f> [-Algorithm MD5]',
          '  Discos y Volúmenes     : chkdsk D:, chkdsk D: /f /r, wmic logicaldisk, Get-Volume, Repair-Volume -DriveLetter D -SpotFix',
          '  Integridad de Sistema  : dism /online /cleanup-image /restorehealth, sfc /scannow, systeminfo',
          '  Gestión de Procesos    : tasklist, Get-Process, taskkill /PID <pid> /F, Stop-Process -Id <pid> -Force',
          '  Redes y DNS            : netstat -ano, ipconfig [/all | /flushdns], ping <host>',
          '  Tuberías y Redirección : comando | findstr [/i] <texto>, comando | Select-String <texto>, comando > archivo.txt, comando >> archivo.txt',
        ].join('\n'),
        status: 'success',
      };

    case 'whoami':
      return { output: 'ghost-win2025\\administrador', status: 'success' };

    case 'hostname':
      return { output: 'GHOST-WIN2025-SRV', status: 'success' };

    case 'ver':
    case 'systeminfo':
      return {
        output: [
          'Nombre de host:                            GHOST-WIN2025-SRV',
          'Nombre del sistema operativo:              Microsoft Windows Server 2025 Datacenter',
          'Versión del sistema:                       10.0.26100 N/D Compilación 26100',
          `Estado almacén de componentes (WinSxS):    ${state.dismComponentStoreHealthy ? 'SANO (Reparado)' : 'REQUIERE DISM /RestoreHealth'}`,
          `Integridad de archivos de sistema (SFC):   ${state.sfcSystemFilesHealthy ? 'VERIFICADO' : 'REQUIERE sfc /scannow'}`,
        ].join('\n'),
        status: 'success',
      };

    case 'cd':
    case 'chdir':
    case 'pwd': {
      if (cmd === 'pwd' || args.length === 0) {
        return { output: state.cmdCwd, status: 'success' };
      }
      const resolved = resolveWinPath(state.cmdCwd, args.join(' '));
      const node = getWinNodeByPath(state.cmdRoot, resolved);
      if (!node || node.type !== 'dir') {
        return {
          output: 'El sistema no puede encontrar la ruta especificada.',
          status: 'error',
        };
      }
      state.cmdCwd = resolved;
      return { output: '', status: 'success' };
    }

    case 'dir':
    case 'ls':
    case 'get-childitem': {
      const showAll = args.some(
        (a) => a.toLowerCase() === '/a' || a.toLowerCase() === '-force'
      );
      const pathArg =
        args.find((a) => !a.startsWith('/') && !a.startsWith('-')) ||
        state.cmdCwd;
      const resolved = resolveWinPath(state.cmdCwd, pathArg);
      const node = getWinNodeByPath(state.cmdRoot, resolved);
      if (!node || node.type !== 'dir') {
        return {
          output: 'No se encuentra el archivo o directorio.',
          status: 'error',
        };
      }
      const children = Object.values(node.children || {}).filter(
        (c) =>
          showAll ||
          (!c.attributes.includes('H') && !c.attributes.includes('S'))
      );

      const lines = [
        ` El volumen de la unidad C es Sistema_OS`,
        ` El número de serie del volumen es 94F1-88B2`,
        ``,
        ` Directorio de ${resolved}`,
        ``,
      ];

      for (const c of children) {
        const attrTag = `[${c.attributes.join('') || 'A'}]`.padEnd(6);
        if (c.type === 'dir') {
          lines.push(
            `${c.updatedAt}    <DIR>          ${attrTag} ${c.name}`
          );
        } else {
          lines.push(
            `${c.updatedAt}    ${String(c.size).padStart(14)} ${attrTag} ${c.name}`
          );
        }
      }
      lines.push(
        `               ${children.length} elemento(s) listados ${showAll ? '(incluyendo ocultos/sistema)' : '(usa dir /a o Get-ChildItem -Force para ver ocultos)'}`
      );
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'tree': {
      const dirNode = getWinNodeByPath(state.cmdRoot, state.cmdCwd);
      const items = Object.values(dirNode?.children || {});
      return {
        output: [
          `Listado de rutas de carpetas para el volumen Sistema_OS`,
          `${state.cmdCwd}`,
          ...items.map((it, idx) =>
            `${idx === items.length - 1 ? '└───' : '├───'}${it.name}`
          ),
        ].join('\n'),
        status: 'success',
      };
    }

    case 'certutil':
    case 'get-filehash': {
      const fileArg = args.find(
        (a) =>
          !a.startsWith('-') &&
          !a.startsWith('/') &&
          a.toUpperCase() !== 'SHA256' &&
          a.toUpperCase() !== 'MD5'
      );
      if (!fileArg) {
        return {
          output: 'Uso: certutil -hashfile <archivo> SHA256  |  Get-FileHash <archivo>',
          status: 'error',
        };
      }
      const abs = resolveWinPath(state.cmdCwd, fileArg);
      const node = getWinNodeByPath(state.cmdRoot, abs);
      if (!node || node.type === 'dir') {
        return {
          output: `CertUtil: -hashfile comando FALLIDO: El sistema no puede encontrar el archivo ${fileArg}`,
          status: 'error',
        };
      }
      const content = node.content || '';
      if (cmd === 'get-filehash') {
        // Get-FileHash usa SHA256 por defecto; -Algorithm MD5 también es válido
        const algIdx = args.findIndex((a) => a.toLowerCase() === '-algorithm');
        const alg = algIdx !== -1 ? (args[algIdx + 1] || 'SHA256').toUpperCase() : 'SHA256';
        const hash = (alg === 'MD5' ? md5Hex(content) : sha256Hex(content)).toUpperCase();
        return {
          output: [
            '',
            'Algorithm       Hash                                                                   Path',
            '---------       ----                                                                   ----',
            `${alg.padEnd(15)} ${hash.padEnd(70)} ${abs}`,
          ].join('\n'),
          status: 'success',
        };
      }
      // certutil -hashfile <archivo> [SHA256|MD5]: sin algoritmo usa SHA1, que el simulador no implementa
      const wantsMd5 = args.some((a) => a.toUpperCase() === 'MD5');
      const alg = wantsMd5 ? 'MD5' : 'SHA256';
      const hash = wantsMd5 ? md5Hex(content) : sha256Hex(content);
      return {
        output: [
          `Hash ${alg} de ${fileArg}:`,
          hash,
          `CertUtil: -hashfile comando completado correctamente.`,
        ].join('\n'),
        status: 'success',
      };
    }

    case 'mkdir':
    case 'md': {
      if (args.length === 0) {
        return {
          output: 'La sintaxis del comando no es correcta.',
          status: 'error',
        };
      }
      const abs = resolveWinPath(state.cmdCwd, args[0]);
      if (getWinNodeByPath(state.cmdRoot, abs)) {
        return {
          output: `Ya existe el subdirectorio o el archivo ${args[0]}.`,
          status: 'error',
        };
      }
      if (!/^C:/i.test(abs)) {
        return {
          output: 'El sistema no puede encontrar la ruta especificada.',
          status: 'error',
        };
      }
      const clean = abs.replace(/^[A-Za-z]:\\?/, '');
      const parts = clean.split('\\').filter(Boolean);
      let curr = state.cmdRoot;
      for (const p of parts) {
        if (!curr.children) curr.children = {};
        const existingKey = Object.keys(curr.children).find(
          (k) => k.toLowerCase() === p.toLowerCase()
        );
        if (!existingKey) {
          curr.children[p] = {
            name: p,
            type: 'dir',
            size: 0,
            updatedAt: '01/11/2026 08:30',
            permissions: 'rwxr-xr-x',
            octal: '755',
            owner: 'Administrador',
            attributes: ['D'],
            acl: 'BUILTIN\\Administradores:(F)',
            children: {},
          };
          curr = curr.children[p];
        } else {
          curr = curr.children[existingKey];
        }
      }
      return { output: '', status: 'success' };
    }

    case 'copy':
    case 'cp': {
      const cleanArgs = args.filter((a) => !a.startsWith('/'));
      if (cleanArgs.length < 2) {
        return {
          output: 'La sintaxis del comando no es correcta.',
          status: 'error',
        };
      }
      const srcPath = resolveWinPath(state.cmdCwd, cleanArgs[0]);
      const destPath = resolveWinPath(state.cmdCwd, cleanArgs[1]);
      const srcNode = getWinNodeByPath(state.cmdRoot, srcPath);
      if (!srcNode || srcNode.type === 'dir') {
        return {
          output: 'El sistema no puede encontrar el archivo especificado.',
          status: 'error',
        };
      }
      const destNode = getWinNodeByPath(state.cmdRoot, destPath);
      const finalDest =
        destNode && destNode.type === 'dir'
          ? `${destPath.replace(/\\$/, '')}\\${srcNode.name}`
          : destPath;
      writeWinFile(state.cmdRoot, finalDest, srcNode.content || '', false);
      return { output: '        1 archivo(s) copiado(s).', status: 'success' };
    }

    case 'move':
    case 'mv': {
      const cleanArgs = args.filter((a) => !a.startsWith('/'));
      if (cleanArgs.length < 2) {
        return {
          output: 'La sintaxis del comando no es correcta.',
          status: 'error',
        };
      }
      const srcPath = resolveWinPath(state.cmdCwd, cleanArgs[0]);
      const destPath = resolveWinPath(state.cmdCwd, cleanArgs[1]);
      const srcNode = getWinNodeByPath(state.cmdRoot, srcPath);
      if (!srcNode) {
        return {
          output: 'El sistema no puede encontrar el archivo especificado.',
          status: 'error',
        };
      }
      const destNode = getWinNodeByPath(state.cmdRoot, destPath);
      const finalDest =
        destNode && destNode.type === 'dir'
          ? `${destPath.replace(/\\$/, '')}\\${srcNode.name}`
          : destPath;
      const destParts = finalDest.replace(/^[A-Za-z]:\\?/, '').split('\\').filter(Boolean);
      const destName = destParts.pop()!;
      const destDir = getWinNodeByPath(state.cmdRoot, 'C:\\' + destParts.join('\\'));
      if (!destDir || destDir.type !== 'dir' || !/^C:/i.test(finalDest)) {
        return {
          output: 'El sistema no puede encontrar la ruta especificada.',
          status: 'error',
        };
      }
      if (finalDest.toLowerCase().startsWith(srcPath.toLowerCase() + '\\')) {
        return {
          output: 'El proceso no tiene acceso al archivo porque está siendo utilizado por otro proceso.',
          status: 'error',
        };
      }

      // Se mueve el nodo completo: una carpeta conserva su contenido
      const cleanSrc = srcPath.replace(/^[A-Za-z]:\\?/, '');
      const parts = cleanSrc.split('\\').filter(Boolean);
      const srcName = parts.pop()!;
      const parent = getWinNodeByPath(
        state.cmdRoot,
        'C:\\' + parts.join('\\')
      );
      if (parent?.children) {
        const key = Object.keys(parent.children).find(
          (k) => k.toLowerCase() === srcName.toLowerCase()
        );
        if (key) delete parent.children[key];
      }
      if (!destDir.children) destDir.children = {};
      const existingKey = Object.keys(destDir.children).find(
        (k) => k.toLowerCase() === destName.toLowerCase()
      );
      if (existingKey) delete destDir.children[existingKey];
      destDir.children[destName] = { ...srcNode, name: destName };
      return {
        output:
          srcNode.type === 'dir'
            ? 'Se han movido         1 directorio(s).'
            : 'Se han movido         1 archivo(s).',
        status: 'success',
      };
    }

    case 'del':
    case 'erase':
    case 'rm':
    case 'remove-item': {
      const cleanArgs = args.filter(
        (a) => !a.startsWith('/') && !a.startsWith('-')
      );
      if (cleanArgs.length === 0) {
        return {
          output: 'La sintaxis del comando no es correcta.',
          status: 'error',
        };
      }
      const targetPath = resolveWinPath(state.cmdCwd, cleanArgs[0]);
      const clean = targetPath.replace(/^[A-Za-z]:\\?/, '');
      const parts = clean.split('\\').filter(Boolean);
      const name = parts.pop()!;
      const parent = getWinNodeByPath(
        state.cmdRoot,
        'C:\\' + parts.join('\\')
      );
      const key = parent?.children
        ? Object.keys(parent.children).find(
            (k) => k.toLowerCase() === name.toLowerCase()
          )
        : undefined;
      if (!parent?.children || !key) {
        return {
          output: `No se pudo encontrar ${targetPath}`,
          status: 'error',
        };
      }
      const target = parent.children[key];
      const isPowerShell = cmd === 'remove-item' || cmd === 'rm';
      const recurse = args.some((a) => a.toLowerCase() === '-recurse');
      if (target.type === 'dir' && !(isPowerShell && recurse)) {
        return {
          output: isPowerShell
            ? `Remove-Item: El elemento ${targetPath} tiene elementos secundarios y no se especificó el parámetro Recurse.`
            : `${targetPath}\\*, ¿Está seguro (S/N)? [del borra los archivos de dentro, no la carpeta: usa rmdir /s /q]`,
          status: 'error',
        };
      }
      if (target.attributes.includes('R') && !args.some((a) => a.toLowerCase() === '/f' || a.toLowerCase() === '-force')) {
        return {
          output: isPowerShell
            ? `Remove-Item: No se puede quitar el elemento ${targetPath}: no tiene suficientes permisos de acceso (solo lectura; usa -Force).`
            : `${targetPath}\nAcceso denegado. (el archivo es de solo lectura: quita el atributo con attrib -r o usa del /f)`,
          status: 'error',
        };
      }
      delete parent.children[key];
      return { output: '', status: 'success' };
    }

    case 'rmdir':
    case 'rd': {
      const recurse = args.some((a) => a.toLowerCase() === '/s');
      const targetArg = args.find((a) => !a.startsWith('/'));
      if (!targetArg) {
        return { output: 'La sintaxis del comando no es correcta.', status: 'error' };
      }
      const targetPath = resolveWinPath(state.cmdCwd, targetArg);
      const node = getWinNodeByPath(state.cmdRoot, targetPath);
      if (!node) {
        return { output: 'El sistema no puede encontrar el archivo especificado.', status: 'error' };
      }
      if (node.type !== 'dir') {
        return { output: 'El nombre del directorio no es válido.', status: 'error' };
      }
      if (Object.keys(node.children || {}).length > 0 && !recurse) {
        return { output: 'El directorio no está vacío. (usa rmdir /s /q para borrarlo con su contenido)', status: 'error' };
      }
      if (targetPath.toLowerCase() === state.cmdCwd.toLowerCase() || state.cmdCwd.toLowerCase().startsWith(targetPath.toLowerCase() + '\\')) {
        return { output: 'El proceso no tiene acceso al archivo porque está siendo utilizado por otro proceso.', status: 'error' };
      }
      const parts = targetPath.replace(/^[A-Za-z]:\\?/, '').split('\\').filter(Boolean);
      const name = parts.pop()!;
      const parent = getWinNodeByPath(state.cmdRoot, 'C:\\' + parts.join('\\'));
      const key = parent?.children ? Object.keys(parent.children).find((k) => k.toLowerCase() === name.toLowerCase()) : undefined;
      if (!parent?.children || !key || /^C:\\?(Windows|Users)?$/i.test(targetPath)) {
        return { output: 'Acceso denegado.', status: 'error' };
      }
      delete parent.children[key];
      return { output: '', status: 'success' };
    }

    case 'type':
    case 'cat':
    case 'get-content': {
      if (args.length === 0 && stdin !== null) {
        return { output: stdin, status: 'success' };
      }
      if (args.length === 0) {
        return {
          output: 'La sintaxis del comando no es correcta.',
          status: 'error',
        };
      }
      const abs = resolveWinPath(state.cmdCwd, args[0]);
      const node = getWinNodeByPath(state.cmdRoot, abs);
      if (!node || node.type === 'dir') {
        return {
          output: 'El sistema no puede encontrar el archivo especificado.',
          status: 'error',
        };
      }
      return { output: node.content || '', status: 'success' };
    }

    case 'echo':
      return { output: args.join(' '), status: 'success' };

    case 'findstr':
    case 'select-string': {
      const cleanArgs = args.filter(
        (a) => !a.startsWith('/') && !a.startsWith('-')
      );
      const pattern = cleanArgs[0];
      if (!pattern) {
        return {
          output: 'FINDSTR: falta cadena de búsqueda',
          status: 'error',
        };
      }
      let sourceText = stdin;
      if (cleanArgs[1]) {
        const abs = resolveWinPath(state.cmdCwd, cleanArgs[1]);
        const node = getWinNodeByPath(state.cmdRoot, abs);
        if (!node || node.type === 'dir') {
          return {
            output: `FINDSTR: no se puede abrir ${cleanArgs[1]}`,
            status: 'error',
          };
        }
        sourceText = node.content || '';
      }
      if (sourceText === null) {
        return {
          output: 'FINDSTR: esperando entrada desde tubería (|) o archivo',
          status: 'error',
        };
      }
      // findstr distingue mayúsculas salvo con /I; Select-String no las distingue salvo con -CaseSensitive
      const lowerArgs = args.map((a) => a.toLowerCase());
      const ignoreCase =
        cmd === 'findstr' ? lowerArgs.includes('/i') : !lowerArgs.includes('-casesensitive');
      const invert = cmd === 'findstr' && lowerArgs.includes('/v');
      const lines = sourceText
        .split('\n')
        .map((l) => l.replace(/\r$/, ''))
        .filter((l) =>
          (ignoreCase ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern)) !== invert
        );
      return { output: lines.join('\n'), status: lines.length ? 'success' : 'warning' };
    }

    case 'attrib': {
      const flags = args.filter((a) => /^[+-][rhsai]$/i.test(a));
      const targetArg = args.find((a) => !/^[+-][rhsai]$/i.test(a));
      if (!targetArg) {
        const dirNode = getWinNodeByPath(state.cmdRoot, state.cmdCwd);
        const list = Object.values(dirNode?.children || {}).map(
          (c) =>
            `${c.attributes.join('').padEnd(8)} ${state.cmdCwd}\\${c.name}`
        );
        return { output: list.join('\n'), status: 'success' };
      }
      const abs = resolveWinPath(state.cmdCwd, targetArg);
      const node = getWinNodeByPath(state.cmdRoot, abs);
      if (!node) {
        return {
          output: `No se encuentra el archivo - ${targetArg}`,
          status: 'error',
        };
      }
      const attrSet = new Set(node.attributes);
      for (const f of flags) {
        const op = f[0];
        const letter = f[1].toUpperCase();
        if (op === '+') attrSet.add(letter);
        if (op === '-') attrSet.delete(letter);
      }
      node.attributes = Array.from(attrSet);
      return {
        output: `Atributos actualizados para ${node.name}: [${node.attributes.join(', ') || 'Normal'}]`,
        status: 'success',
      };
    }

    case 'icacls': {
      if (args.length === 0) {
        return {
          output: 'Uso: icacls <archivo> [/grant Usuario:(Permiso)]',
          status: 'error',
        };
      }
      const abs = resolveWinPath(state.cmdCwd, args[0]);
      const node = getWinNodeByPath(state.cmdRoot, abs);
      if (!node) {
        return {
          output: `${args[0]}: El sistema no puede encontrar el archivo especificado.`,
          status: 'error',
        };
      }
      const grantIdx = args.findIndex((a) => a.toLowerCase() === '/grant');
      if (grantIdx !== -1 && args[grantIdx + 1]) {
        // /grant añade (o sustituye) la entrada de ese usuario sin borrar las demás
        const rule = args[grantIdx + 1];
        const principal = rule.split(':')[0].toLowerCase();
        const entries = node.acl
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e && e.split(':')[0].toLowerCase() !== principal);
        node.acl = [rule, ...entries].join(', ');
        return {
          output: `archivo procesado: ${args[0]}\nSe procesaron correctamente 1 archivos; error al procesar 0 archivos`,
          status: 'success',
        };
      }
      return {
        output: `${args[0]} ${node.acl}\nSe procesaron correctamente 1 archivos.`,
        status: 'success',
      };
    }

    case 'wmic':
    case 'get-volume': {
      const header =
        'DriveLetter  FileSystem  Size      Used            HealthStatus';
      return {
        output: [
          header,
          '-----------  ----------  --------  --------------  ------------------------------',
          ...state.cmdDisks.map(
            (d) =>
              `${d.id.padEnd(12)} ${d.fsType.padEnd(11)} ${d.size.padEnd(9)} ${d.used.padEnd(15)} ${d.status}`
          ),
        ].join('\n'),
        status: 'success',
      };
    }

    case 'repair-volume': {
      const letterIdx = args.findIndex((a) => a.toLowerCase() === '-driveletter');
      const letter = letterIdx !== -1 ? (args[letterIdx + 1] || '').replace(':', '').toUpperCase() : '';
      if (!letter) {
        return {
          output: 'Repair-Volume: falta el parámetro -DriveLetter (ej. Repair-Volume -DriveLetter D -Scan)',
          status: 'error',
        };
      }
      const disk = state.cmdDisks.find((d) => d.id.toUpperCase() === `${letter}:`);
      if (!disk) {
        return {
          output: `Repair-Volume: No se encontró ningún objeto MSFT_Volume con la propiedad 'DriveLetter' igual a '${letter}'.`,
          status: 'error',
        };
      }
      const lower = args.map((a) => a.toLowerCase());
      // -Scan solo examina; -SpotFix y -OfflineScanAndFix corrigen
      if (!lower.includes('-spotfix') && !lower.includes('-offlinescanandfix')) {
        return {
          output: disk.repaired ? 'NoErrorsFound' : 'ScanNeeded / SpotFixNeeded (vuelve a ejecutarlo con -SpotFix para corregir)',
          status: disk.repaired ? 'success' : 'warning',
        };
      }
      if (letter === 'C') {
        return {
          output: 'Repair-Volume: el volumen del sistema está en uso; la corrección se programa para el próximo reinicio.',
          status: 'warning',
        };
      }
      disk.repaired = true;
      disk.status = 'Healthy';
      disk.errorsFound = 0;
      return { output: 'NoErrorsFound', status: 'success' };
    }

    case 'chkdsk': {
      const driveArg =
        args.find((a) => /^[a-zA-Z]:$/.test(a))?.toUpperCase() || 'C:';
      const hasFix = args.some((a) => a.toLowerCase() === '/f');
      const hasRecover = args.some((a) => a.toLowerCase() === '/r');
      const disk = state.cmdDisks.find((d) => d.id.toUpperCase() === driveArg);

      if (!disk) {
        return {
          output: `No se puede abrir el volumen ${driveArg} para acceso directo.`,
          status: 'error',
        };
      }

      if (!hasFix && !hasRecover) {
        return {
          output: [
            `El tipo del sistema de archivos es ${disk.fsType}.`,
            `ADVERTENCIA: no se especificó el parámetro /F (CHKDSK en modo solo lectura).`,
            `Etapa 1: Examen de la estructura básica del sistema de archivos...`,
            disk.repaired
              ? `  Windows examinó el sistema de archivos y no encontró problemas.`
              : `  [ERROR] Se encontraron ${disk.errorsFound} registros de archivo dañados en la tabla MFT y sectores defectuosos en ${driveArg}.`,
            disk.repaired
              ? `Estado del volumen ${driveArg}: SANO (Healthy)`
              : `Ejecute 'chkdsk ${driveArg} /f /r' para corregir errores y recuperar sectores defectuosos.`,
          ].join('\n'),
          status: disk.repaired ? 'success' : 'warning',
        };
      }

      // C: es el volumen del sistema en uso: chkdsk /f no puede bloquearlo y lo programa para el reinicio
      if (driveArg === 'C:') {
        return {
          output: [
            `El tipo del sistema de archivos es ${disk.fsType}.`,
            `No se puede ejecutar Chkdsk porque otro proceso ya está usando el volumen.`,
            `¿Desea que se prepare este volumen para que sea comprobado`,
            `la próxima vez que se reinicie el sistema? (S/N) S`,
            `Este volumen se comprobará la próxima vez que se reinicie el sistema.`,
          ].join('\n'),
          status: 'warning',
        };
      }

      disk.repaired = true;
      disk.status = 'Healthy';
      disk.errorsFound = 0;

      return {
        output: [
          `El tipo del sistema de archivos es ${disk.fsType}.`,
          `La etiqueta del volumen es ${disk.mount.replace(/^.*\((.*)\)$/, '$1')}.`,
          `Etapa 1: Examen de la estructura básica del sistema de archivos...`,
          `  Corrigiendo entrada dañada en segmento de registro de archivo 4812.`,
          `Etapa 2: Examen de la vinculación de nombres de archivos...`,
          `  Recuperando archivo huérfano Indice_2026.dat en directorio raíz.`,
          `Etapa 3: Examen de los descriptores de seguridad...`,
          hasRecover
            ? `Etapa 4 y 5: Buscando clústeres dañados en los datos del usuario y espacio libre (/R)...\n  Windows reemplazó los clústeres dañados en el sector lógico 0x0049A12.`
            : `Corrección lógica (/F) completada.`,
          `Windows realizó correcciones en el sistema de archivos. No se requiere más acción.`,
        ].join('\n'),
        status: 'success',
      };
    }

    case 'dism': {
      const joined = args.join(' ').toLowerCase();
      if (joined.includes('/restorehealth')) {
        state.dismComponentStoreHealthy = true;
        return {
          output: [
            `Herramienta Administración y mantenimiento de imágenes de implementación`,
            `Versión: 10.0.26100.1`,
            `Versión de imagen: 10.0.26100.2152`,
            `[==========================100.0%==========================]`,
            `La operación de restauración se completó correctamente. Se reparó el daño en el almacén de componentes (WinSxS).`,
            `La operación se completó correctamente.`,
          ].join('\n'),
          status: 'success',
        };
      }
      if (joined.includes('/scanhealth') || joined.includes('/checkhealth')) {
        return {
          output: state.dismComponentStoreHealthy
            ? 'No se detectaron daños en el almacén de componentes.\nLa operación se completó correctamente.'
            : 'El almacén de componentes se puede reparar. Ejecute: dism /online /cleanup-image /restorehealth',
          status: state.dismComponentStoreHealthy ? 'success' : 'warning',
        };
      }
      return {
        output:
          'Uso en Sandbox: dism /online /cleanup-image [/checkhealth | /scanhealth | /restorehealth]',
        status: 'warning',
      };
    }

    case 'sfc': {
      const joined = args.join(' ').toLowerCase();
      if (joined.includes('/scannow')) {
        // SFC repara System32 con las copias del almacén WinSxS: si el almacén está dañado, no puede
        const canRepair = state.dismComponentStoreHealthy;
        if (canRepair) state.sfcSystemFilesHealthy = true;
        return {
          output: [
            `Iniciando examen en el sistema. Este proceso tardará algún tiempo.`,
            `Iniciando la fase de comprobación del examen del sistema.`,
            `Se completó la comprobación de 100%.`,
            canRepair
              ? `Protección de recursos de Windows encontró archivos dañados y los reparó correctamente.`
              : `Protección de recursos de Windows encontró archivos dañados pero no pudo reparar algunos de ellos.\n[El origen de las reparaciones (WinSxS) también está dañado: ejecuta antes dism /online /cleanup-image /restorehealth y repite sfc /scannow]`,
          ].join('\n'),
          status: canRepair ? 'success' : 'warning',
        };
      }
      return {
        output: 'Uso en Sandbox: sfc /scannow',
        status: 'warning',
      };
    }

    case 'tasklist':
    case 'get-process':
    case 'ps': {
      const lines = [
        'Nombre de imagen               PID Sesión           Uso de mem   Estado',
        '========================= ======== ================ ============ ===============',
        ...state.cmdProcesses.map(
          (p) =>
            `${p.name.padEnd(25)} ${String(p.pid).padStart(8)} Services         ${p.mem.padStart(12)} ${p.status}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'taskkill':
    case 'stop-process': {
      const pidIdx = args.findIndex(
        (a) => a.toLowerCase() === '/pid' || a.toLowerCase() === '-id'
      );
      const imIdx = args.findIndex(
        (a) => a.toLowerCase() === '/im' || a.toLowerCase() === '-name'
      );

      let targetProc = undefined;
      if (pidIdx !== -1 && args[pidIdx + 1]) {
        const pid = Number(args[pidIdx + 1]);
        targetProc = state.cmdProcesses.find((p) => p.pid === pid);
      } else if (imIdx !== -1 && args[imIdx + 1]) {
        const im = args[imIdx + 1].toLowerCase();
        targetProc = state.cmdProcesses.find(
          (p) => p.name.toLowerCase() === im
        );
      }

      if (!targetProc) {
        return {
          output:
            'ERROR: no se encontró el proceso o faltan argumentos (/PID <id> /F o /IM <imagen> /F).',
          status: 'error',
        };
      }

      if (targetProc.critical) {
        return {
          output: `ACCESO DENEGADO por el Sandbox: ${targetProc.name} (PID ${targetProc.pid}) es un proceso crítico del sistema operativo Windows.`,
          status: 'warning',
        };
      }

      // taskkill sin /F solo pide el cierre y un proceso colgado no lo atiende
      // (Stop-Process ya termina el proceso directamente)
      const forced = args.some((a) => a.toLowerCase() === '/f');
      if (cmd === 'taskkill' && !forced && targetProc.status === 'Hung / High CPU') {
        return {
          output: `ERROR: el proceso "${targetProc.name}" con PID ${targetProc.pid} no se pudo terminar.\nRazón: Este proceso solo se puede terminar forzosamente (con la opción /F).`,
          status: 'error',
        };
      }

      state.cmdProcesses = state.cmdProcesses.filter(
        (p) => p.pid !== targetProc!.pid
      );
      return {
        output: `CORRECTO: se terminó el proceso "${targetProc.name}" con PID ${targetProc.pid}.`,
        status: 'success',
      };
    }

    case 'netstat': {
      const lines = [
        'Conexiones activas',
        '',
        '  Proto  Dirección local        Dirección remota       Estado           PID',
        '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING        912',
        '  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING        4',
      ];
      const rogue = state.cmdProcesses.find((p) => p.isRogue);
      if (rogue) {
        lines.push(
          `  TCP    192.168.1.50:49812     203.0.113.88:4444      ESTABLISHED      ${rogue.pid}  <-- [${rogue.name}]`
        );
      }
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'ipconfig': {
      const lowerArgs = args.map((a) => a.toLowerCase());
      if (lowerArgs.includes('/flushdns')) {
        state.cmdDnsFlushed = true;
        return {
          output: [
            'Configuración IP de Windows',
            '',
            'Se vació correctamente la caché de resolución de DNS.',
          ].join('\n'),
          status: 'success',
        };
      }
      return {
        output: [
          'Configuración IP de Windows',
          '',
          'Adaptador de Ethernet Ethernet0:',
          '   Sufijo DNS específico para la conexión. . : unfantasmaenelsistema.local',
          '   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.50',
          '   Máscara de subred . . . . . . . . . . . . : 255.255.255.0',
          '   Puerta de enlace predeterminada . . . . . : 192.168.1.1',
        ].join('\n'),
        status: 'success',
      };
    }

    case 'ping': {
      const host = args.find((a) => !a.startsWith('/')) || '8.8.8.8';
      return {
        output: [
          `Haciendo ping a ${host} con 32 bytes de datos:`,
          `Respuesta desde ${host}: bytes=32 tiempo=9ms TTL=118`,
          `Respuesta desde ${host}: bytes=32 tiempo=8ms TTL=118`,
          `Estadísticas de ping para ${host}:`,
          `    Paquetes: enviados = 2, recibidos = 2, perdidos = 0 (0% perdidos)`,
        ].join('\n'),
        status: 'success',
      };
    }

    default:
      return {
        output: `'${tokens[0]}' no se reconoce como un comando interno o externo, programa o cmdlet ejecutable. Escribe 'help' para ver la guía.`,
        status: 'error',
      };
  }
}

function buildDidactic(
  rawCommand: string,
  shell: ShellMode,
  status: 'success' | 'warning' | 'error',
  _state: SystemHealthState
): DidacticAnalysis {
  const clean = rawCommand.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('chkdsk') || lower.includes('repair-volume')) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Comprobación de integridad física y lógica del sistema de ficheros NTFS (Check Disk / Storage Repair).',
      posixVsWinEquivalent:
        'Equivalente en Linux: sudo fsck -y /dev/sdX  ↔  Windows: chkdsk X: /f /r  |  Repair-Volume -DriveLetter X -SpotFix',
      technicalBreakdown: [
        {
          token: 'chkdsk / Repair-Volume',
          meaning:
            'Herramientas nativas de Windows para verificar la tabla maestra de archivos (MFT).',
        },
        {
          token: '/f (-SpotFix)',
          meaning:
            'Corrige errores lógicos en la estructura del directorio e índices.',
        },
        {
          token: '/r',
          meaning:
            'Localiza sectores físicos defectuosos y recupera la información legible (implica /f).',
        },
      ],
      securityAndSafetyTip:
        'En producción, chkdsk /f requiere bloquear el volumen. Si es la unidad C:, programará el análisis para el próximo reinicio del servidor.',
      realWorldImpact:
        'Previene la pérdida silenciosa de datos (bit rot) y repara referencias cruzadas tras apagones abruptos.',
    };
  }

  if (lower.includes('fsck')) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Verificación y reparación de consistencia del sistema de archivos Linux (File System Consistency Check).',
      posixVsWinEquivalent:
        'Equivalente en Windows: chkdsk D: /f /r  ↔  Linux: sudo fsck -y /dev/sdb1',
      technicalBreakdown: [
        {
          token: 'sudo',
          meaning:
            'Eleva privilegios a superusuario (root) para acceder directamente al dispositivo de bloques.',
        },
        {
          token: 'fsck',
          meaning:
            'Front-end que invoca e2fsck para analizar superbloques, inodos y mapas de bits.',
        },
        {
          token: '-y',
          meaning:
            'Responde afirmativamente de forma automática a todas las correcciones de inodos huérfanos.',
        },
      ],
      securityAndSafetyTip:
        'Nunca ejecutes fsck sobre una partición montada en modo lectura/escritura activo en un sistema real sin antes desmontarla (umount) o montarla en solo lectura.',
      realWorldImpact:
        'Recupera particiones ext4/xfs que el kernel ha pasado a modo Read-Only por errores de entrada/salida.',
    };
  }

  if (lower.includes('sfc') || lower.includes('dism')) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Mantenimiento de la imagen base de Windows (WinSxS) y reparación de archivos protegidos del sistema.',
      posixVsWinEquivalent:
        'Equivalente en Linux: debsums -s / apt --fix-broken install / rpm -Va  ↔  Windows: DISM /RestoreHealth + sfc /scannow',
      technicalBreakdown: [
        {
          token: 'dism /RestoreHealth',
          meaning:
            'Verifica y repara el almacén de componentes base (C:\\Windows\\WinSxS).',
        },
        {
          token: 'sfc /scannow',
          meaning:
            'Compara cada librería .dll/.sys en System32 con la copia sana de WinSxS.',
        },
      ],
      securityAndSafetyTip:
        'Ejecuta siempre DISM /RestoreHealth antes de sfc /scannow: si el almacén local WinSxS está dañado, SFC no tendrá copias íntegras para restaurar los archivos.',
      realWorldImpact:
        'Resuelve pantallas azules (BSOD), fallos de Windows Update y corrupción de binarios críticos sin reinstalar el sistema operativo.',
    };
  }

  if (
    lower.includes('chmod') ||
    lower.includes('chown') ||
    lower.includes('attrib') ||
    lower.includes('icacls')
  ) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Control de acceso discrecional, cambio de propietario y endurecimiento de permisos/atributos.',
      posixVsWinEquivalent:
        'Linux: chmod 600 / sudo chown u:g  ↔  Windows: attrib +r -h / icacls archivo /grant Usuario:(F)',
      technicalBreakdown: [
        {
          token: 'chmod 600 / 750',
          meaning:
            'Notación octal POSIX: Propietario (r=4,w=2,x=1), Grupo y Otros.',
        },
        {
          token: 'chown u:g',
          meaning: 'Asigna el propietario y grupo de seguridad POSIX al inodo.',
        },
        {
          token: 'attrib / icacls',
          meaning:
            'Administra banderas NTFS (R, H, S, A) y listas de control de acceso (ACL).',
        },
      ],
      securityAndSafetyTip:
        'Evita siempre chmod 777 o permisos TODOS:(F). El cliente OpenSSH rechaza automáticamente claves privadas (id_rsa) si sus permisos son más abiertos que 600.',
      realWorldImpact:
        'Aplica el Principio de Mínimo Privilegio impidiendo escaladas de privilegios locales.',
    };
  }

  if (
    lower.includes('netstat') ||
    lower.startsWith('ss') ||
    lower.includes('ufw') ||
    lower.includes('ipconfig')
  ) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Auditoría de sockets de red, identificación de puertos en escucha, DNS y cortafuegos.',
      posixVsWinEquivalent:
        'Linux: ss -tulnp / sudo ufw enable  ↔  Windows: netstat -ano / ipconfig /flushdns',
      technicalBreakdown: [
        {
          token: 'ss -tulnp / netstat -ano',
          meaning:
            'Lista sockets TCP/UDP abiertos sin resolver nombres (-n) e incluye el PID del proceso.',
        },
        {
          token: 'ufw enable / flushdns',
          meaning:
            'Activa el filtrado de paquetes en el host o purga entradas DNS en caché.',
        },
      ],
      securityAndSafetyTip:
        'Cruza siempre el PID que muestra netstat -ano o ss -tulnp con la tabla de procesos para detectar troyanos o shells inversas.',
      realWorldImpact:
        'Permite descubrir servicios expuestos accidentalmente a Internet y mitigar ataques de suplantación DNS.',
    };
  }

  if (
    lower.includes('sha256sum') ||
    lower.includes('md5sum') ||
    lower.includes('certutil') ||
    lower.includes('get-filehash')
  ) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Verificación criptográfica de integridad de ficheros mediante funciones resumen SHA-256.',
      posixVsWinEquivalent:
        'Linux: sha256sum <archivo>  ↔  Windows: certutil -hashfile <archivo> SHA256  |  Get-FileHash <archivo>',
      technicalBreakdown: [
        {
          token: 'sha256sum / certutil',
          meaning:
            'Calcula un resumen único de 256 bits (64 caracteres hexadecimales) a partir del contenido.',
        },
      ],
      securityAndSafetyTip:
        'Compara siempre el hash SHA-256 antes de ejecutar scripts de despliegue o instaladores descargados con privilegios de administrador.',
      realWorldImpact:
        'Garantiza matemáticamente que un binario no ha sufrido corrupción ni alteración maliciosa en tránsito.',
    };
  }

  if (
    lower.includes('taskkill') ||
    lower.includes('stop-process') ||
    lower.includes('kill') ||
    lower.includes('tasklist') ||
    lower.includes('get-process') ||
    lower.startsWith('ps')
  ) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Inspección de la tabla de procesos en memoria y envío de señales de terminación por PID.',
      posixVsWinEquivalent:
        'Linux: ps aux + sudo kill -9 <PID>  ↔  Windows: tasklist + taskkill /PID <PID> /F (o Stop-Process -Id <PID> -Force)',
      technicalBreakdown: [
        {
          token: 'ps aux / tasklist',
          meaning:
            'Enumera procesos activos, su PID, propietario y consumo de CPU/RAM.',
        },
        {
          token: 'kill -9 / taskkill /F',
          meaning:
            'Fuerza la terminación inmediata desde el kernel sin esperar cierre ordenado.',
        },
      ],
      securityAndSafetyTip:
        'Verifica siempre el PID exacto antes de usar -9 (SIGKILL) o /F para no interrumpir transacciones de bases de datos o demonios críticos.',
      realWorldImpact:
        'Libera recursos de CPU y memoria secuestrados por procesos colgados, bucles infinitos o binarios no autorizados.',
    };
  }

  if (clean.includes('|') || clean.includes('>') || clean.includes('>>')) {
    return {
      command: clean,
      shell,
      status,
      summary:
        'Encadenamiento de flujos estándar (stdin/stdout) mediante tuberías y persistencia en fichero.',
      posixVsWinEquivalent:
        'Linux: cat log | grep ERROR > out.txt  ↔  Windows: type log | findstr ERROR > out.txt',
      technicalBreakdown: [
        {
          token: '| (Tubería / Pipe)',
          meaning:
            'Conecta el stdout del comando izquierdo con el stdin del filtro derecho (grep/findstr).',
        },
        {
          token: '> (Sobrescribir)',
          meaning:
            'Crea o trunca el archivo destino reemplazando todo su contenido previo.',
        },
        {
          token: '>> (Anexar / Append)',
          meaning:
            'Agrega las nuevas líneas al final del fichero conservando el historial existente.',
        },
      ],
      securityAndSafetyTip:
        'Ten especial cuidado al diferenciar > de >> sobre archivos de configuración o logs de auditoría: un solo > borrará todo el contenido previo.',
      realWorldImpact:
        'Base de la automatización en administración de sistemas y análisis forense de registros.',
    };
  }

  return {
    command: clean,
    shell,
    status,
    summary:
      shell === 'bash'
        ? 'Operación de navegación e inspección en consola GNU/Bash.'
        : 'Operación de gestión de archivos y entorno en consola Windows CMD/PowerShell.',
    posixVsWinEquivalent:
      'Linux: ls -la / cp / mv / rm / cat  ↔  Windows: dir /a / copy / move / del / type',
    technicalBreakdown: [
      {
        token: clean.split(' ')[0] || clean,
        meaning: 'Comando base ejecutado en el intérprete virtualizado.',
      },
      {
        token: clean.split(' ').slice(1).join(' ') || '(sin argumentos)',
        meaning: 'Parámetros, rutas o modificadores pasados al comando.',
      },
    ],
    securityAndSafetyTip:
      'Verifica siempre tu ruta actual (pwd / cd) y lista el contenido (ls -la / dir /a) antes de mover o eliminar ficheros.',
    realWorldImpact:
      'Permite administrar servidores remotos vía SSH o WinRM sin depender de interfaces gráficas pesadas.',
  };
}
