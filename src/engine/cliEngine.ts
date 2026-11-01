import {
  DidacticAnalysis,
  ShellMode,
  SystemHealthState,
  VFSNode,
} from '../types/cli';

function computeDeterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const base =
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0');
  return (base + '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4').slice(
    0,
    64
  );
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
                  'Tareas pendientes SysAdmin:\n1. Limpiar temp_crash.dmp y respaldar nginx.conf en backups/\n2. Corregir permisos de id_rsa (600) y deploy.sh (750, root:www-data)\n3. Reparar partición /dev/sdb1 con sudo fsck -y /dev/sdb1\n4. Terminar proceso runaway_syncd (PID 3104)\n5. Auditar puertos (ss -tulnp) y activar firewall (sudo ufw enable)',
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
      },
    ],
    bashFirewallEnabled: false,
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
  const clean = absPath.replace(/^[A-Za-z]:\\?/, '');
  if (!clean) return root;
  const parts = clean.split('\\').filter(Boolean);
  let curr: VFSNode | undefined = root;
  for (const p of parts) {
    if (!curr || curr.type !== 'dir' || !curr.children) return null;
    const key = Object.keys(curr.children).find(
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
    size: newContent.length,
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
    size: newContent.length,
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
    const segResult =
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
    'NOMBRE: sha256sum - calcula y verifica resúmenes de mensaje SHA256 (256-bit)\nSINOPSIS: sha256sum <fichero>',
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
          '  Navegación y Ficheros : pwd, ls [-la], stat <f>, cd <ruta>, mkdir [-p] <dir>, touch <f>, cp, mv, rm [-rf], cat, head, tail, wc -l, find, echo',
          '  Integridad y Manual   : sha256sum <f>, md5sum <f>, man <comando>, id, whoami, uname -a, free -h',
          '  Filtrado y Redirección: grep <patrón> [f], comando | grep <patrón>, comando > fichero, comando >> fichero',
          '  Permisos y Seguridad  : chmod <octal> <fichero>, sudo chown <usuario:grupo> <fichero>',
          '  Discos y Bloques      : lsblk, df -h, sudo fsck -y /dev/sdb1',
          '  Procesos y Servicios  : ps aux, top, sudo kill -9 <PID>, sudo systemctl <status|restart> <servicio>',
          '  Redes y Cortafuegos   : ss -tulnp, netstat -tulnp, ip a, ping <host>, sudo ufw <status|enable|disable>',
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
          : 'uid=1000(sysadmin) gid=1000(sysadmin) grupos=1000(sysadmin),27(sudo),33(www-data)',
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
      const target = args.find((a) => !a.startsWith('-'));
      if (!target) {
        return { output: `${cmd}: falta el archivo a verificar`, status: 'error' };
      }
      const abs = resolveLinuxPath(state.bashCwd, target);
      const node = getLinuxNodeByPath(state.bashRoot, abs);
      if (!node || node.type === 'dir') {
        return {
          output: `${cmd}: ${target}: No existe el archivo o es un directorio`,
          status: 'error',
        };
      }
      const hash = computeDeterministicHash(
        `${node.name}:${node.content || ''}`
      );
      const finalHash = cmd === 'md5sum' ? hash.slice(0, 32) : hash;
      return {
        output: `${finalHash}  ${target}`,
        status: 'success',
      };
    }

    case 'mkdir': {
      const dirTargets = args.filter((a) => !a.startsWith('-'));
      if (dirTargets.length === 0) {
        return { output: 'mkdir: falta un operando', status: 'error' };
      }
      for (const rawTarget of dirTargets) {
        const abs = resolveLinuxPath(state.bashCwd, rawTarget);
        const parts = abs.split('/').filter(Boolean);
        let curr = state.bashRoot;
        for (const p of parts) {
          if (!curr.children) curr.children = {};
          if (!curr.children[p]) {
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
          }
          curr = curr.children[p];
        }
      }
      return {
        output: `Directorio creado correctamente: ${dirTargets.join(', ')}`,
        status: 'success',
      };
    }

    case 'touch': {
      const fileTargets = args.filter((a) => !a.startsWith('-'));
      if (fileTargets.length === 0) {
        return {
          output: 'touch: falta un operando de archivo',
          status: 'error',
        };
      }
      for (const t of fileTargets) {
        const abs = resolveLinuxPath(state.bashCwd, t);
        writeLinuxFile(state.bashRoot, abs, '', true);
      }
      return { output: '', status: 'success' };
    }

    case 'cp': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return {
          output: 'cp: falta el operando de archivo de destino',
          status: 'error',
        };
      }
      const srcPath = resolveLinuxPath(state.bashCwd, cleanArgs[0]);
      const destRaw = cleanArgs[1];
      const destPath = resolveLinuxPath(state.bashCwd, destRaw);
      const srcNode = getLinuxNodeByPath(state.bashRoot, srcPath);
      if (!srcNode) {
        return {
          output: `cp: no se puede efectuar 'stat' sobre '${cleanArgs[0]}': No existe el archivo o el directorio`,
          status: 'error',
        };
      }
      const destNode = getLinuxNodeByPath(state.bashRoot, destPath);
      const finalDestPath =
        destNode && destNode.type === 'dir'
          ? `${destPath.replace(/\/$/, '')}/${srcNode.name}`
          : destPath;

      writeLinuxFile(
        state.bashRoot,
        finalDestPath,
        srcNode.content || '',
        false
      );
      return {
        output: `'${cleanArgs[0]}' -> '${finalDestPath}'`,
        status: 'success',
      };
    }

    case 'mv': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return {
          output: 'mv: falta el operando de archivo de destino',
          status: 'error',
        };
      }
      const srcPath = resolveLinuxPath(state.bashCwd, cleanArgs[0]);
      const destPath = resolveLinuxPath(state.bashCwd, cleanArgs[1]);
      const srcNode = getLinuxNodeByPath(state.bashRoot, srcPath);
      if (!srcNode) {
        return {
          output: `mv: no se puede efectuar 'stat' sobre '${cleanArgs[0]}': No existe el archivo`,
          status: 'error',
        };
      }
      const destNode = getLinuxNodeByPath(state.bashRoot, destPath);
      const finalDestPath =
        destNode && destNode.type === 'dir'
          ? `${destPath.replace(/\/$/, '')}/${srcNode.name}`
          : destPath;

      writeLinuxFile(
        state.bashRoot,
        finalDestPath,
        srcNode.content || '',
        false
      );

      const srcParts = srcPath.split('/').filter(Boolean);
      const srcName = srcParts.pop()!;
      const srcParent = getLinuxNodeByPath(
        state.bashRoot,
        '/' + srcParts.join('/')
      );
      if (srcParent?.children) {
        delete srcParent.children[srcName];
      }
      return {
        output: `Movido '${cleanArgs[0]}' -> '${finalDestPath}'`,
        status: 'success',
      };
    }

    case 'rm': {
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        return { output: 'rm: falta un operando', status: 'error' };
      }
      for (const t of targets) {
        const abs = resolveLinuxPath(state.bashCwd, t);
        if (abs === '/' || abs === '/home' || abs === '/etc') {
          return {
            output: `rm: bloqueado por el Sandbox de Seguridad: no se permite eliminar el directorio crítico ${abs}`,
            status: 'error',
          };
        }
        const parts = abs.split('/').filter(Boolean);
        const name = parts.pop()!;
        const parent = getLinuxNodeByPath(
          state.bashRoot,
          '/' + parts.join('/')
        );
        if (!parent?.children || !parent.children[name]) {
          return {
            output: `rm: no se puede borrar '${t}': No existe el archivo o el directorio`,
            status: 'error',
          };
        }
        delete parent.children[name];
      }
      return {
        output: `Eliminado: ${targets.join(', ')}`,
        status: 'success',
      };
    }

    case 'cat':
    case 'head':
    case 'tail': {
      let text = stdin;
      const fileArg = args.find((a) => !a.startsWith('-'));
      if (fileArg) {
        const abs = resolveLinuxPath(state.bashCwd, fileArg);
        const node = getLinuxNodeByPath(state.bashRoot, abs);
        if (!node) {
          return {
            output: `${cmd}: ${fileArg}: No existe el archivo o el directorio`,
            status: 'error',
          };
        }
        if (node.type === 'dir') {
          return {
            output: `${cmd}: ${fileArg}: Es un directorio`,
            status: 'error',
          };
        }
        text = node.content || '';
      }
      if (text === null) {
        return {
          output: `${cmd}: falta el nombre del archivo`,
          status: 'error',
        };
      }
      const lines = text.split('\n');
      if (cmd === 'head') return { output: lines.slice(0, 5).join('\n'), status: 'success' };
      if (cmd === 'tail') return { output: lines.slice(-5).join('\n'), status: 'success' };
      return { output: text, status: 'success' };
    }

    case 'wc': {
      const content = stdin ?? '';
      const lineCount = content ? content.split('\n').length : 0;
      return { output: `${lineCount}`, status: 'success' };
    }

    case 'find': {
      const dirNode = getLinuxNodeByPath(state.bashRoot, state.bashCwd);
      const list = Object.keys(dirNode?.children || {}).map(
        (k) => `${state.bashCwd}/${k}`
      );
      return { output: list.join('\n'), status: 'success' };
    }

    case 'echo':
      return { output: args.join(' '), status: 'success' };

    case 'grep': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      const ignoreCase = args.some((a) => a.includes('i'));
      const pattern = cleanArgs[0];
      if (!pattern) {
        return {
          output: 'Uso: grep [OPCIONES] PATRÓN [ARCHIVO]',
          status: 'error',
        };
      }
      let sourceText = stdin;
      if (cleanArgs[1]) {
        const abs = resolveLinuxPath(state.bashCwd, cleanArgs[1]);
        const node = getLinuxNodeByPath(state.bashRoot, abs);
        if (!node || node.type === 'dir') {
          return {
            output: `grep: ${cleanArgs[1]}: No existe el archivo`,
            status: 'error',
          };
        }
        sourceText = node.content || '';
      }
      if (sourceText === null) {
        return {
          output: 'grep: esperando entrada por tubería (|) o ruta de archivo',
          status: 'error',
        };
      }
      const matched = sourceText
        .split('\n')
        .filter((line) =>
          ignoreCase
            ? line.toLowerCase().includes(pattern.toLowerCase())
            : line.includes(pattern)
        );
      return { output: matched.join('\n'), status: 'success' };
    }

    case 'chmod': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return {
          output: 'chmod: faltan operandos. Uso: chmod <modo_octal> <archivo>',
          status: 'error',
        };
      }
      const mode = cleanArgs[0];
      const fileArg = cleanArgs[1];
      const abs = resolveLinuxPath(state.bashCwd, fileArg);
      const node = getLinuxNodeByPath(state.bashRoot, abs);
      if (!node) {
        return {
          output: `chmod: no se puede acceder a '${fileArg}': No existe el archivo`,
          status: 'error',
        };
      }
      if (/^[0-7]{3,4}$/.test(mode)) {
        const normalized = mode.length === 4 ? mode.slice(1) : mode;
        node.octal = normalized;
        node.permissions = octalToSymbolic(normalized);
      } else if (mode === '+x' || mode === 'u+x') {
        node.octal = '755';
        node.permissions = 'rwxr-xr-x';
      } else {
        return {
          output: `chmod: modo inválido: '${mode}' (usa formato octal de 3 dígitos como 600, 644, 750, 755)`,
          status: 'error',
        };
      }
      return {
        output: `Permisos de '${fileArg}' actualizados a ${node.octal} (${node.permissions})`,
        status: 'success',
      };
    }

    case 'chown': {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      if (cleanArgs.length < 2) {
        return {
          output:
            'chown: faltan operandos. Uso: sudo chown usuario:grupo <archivo>',
          status: 'error',
        };
      }
      const newOwner = cleanArgs[0];
      const fileArg = cleanArgs[1];
      const abs = resolveLinuxPath(state.bashCwd, fileArg);
      const node = getLinuxNodeByPath(state.bashRoot, abs);
      if (!node) {
        return {
          output: `chown: no se puede acceder a '${fileArg}': No existe el archivo`,
          status: 'error',
        };
      }
      node.owner = newOwner.includes(':')
        ? newOwner
        : `${newOwner}:${newOwner}`;
      return {
        output: `Propietario de '${fileArg}' cambiado a ${node.owner}`,
        status: 'success',
      };
    }

    case 'lsblk':
    case 'df': {
      const lines = [
        'FILESYSTEM      SIZE   USED          MOUNTPOINT   STATUS',
        ...state.bashDisks.map(
          (d) =>
            `${d.id.padEnd(15)} ${d.size.padEnd(6)} ${d.used.padEnd(13)} ${d.mount.padEnd(12)} ${d.status}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'fsck': {
      const targetDisk =
        args.find((a) => a.startsWith('/dev/')) || '/dev/sdb1';
      const disk = state.bashDisks.find((d) => d.id === targetDisk);
      if (!disk) {
        return {
          output: `fsck from util-linux 2.39.3\nfsck: no se encuentra el dispositivo de bloques ${targetDisk}`,
          status: 'error',
        };
      }
      if (!isSudo && !args.includes('-y')) {
        return {
          output: `fsck from util-linux 2.39.3\n[AVISO] Para reparar inodos dañados en ${targetDisk} ejecuta: sudo fsck -y ${targetDisk}`,
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
          `${targetDisk}: recovering journal`,
          `Paso 1: Verificando inodos, bloques y tamaños...`,
          `  Inodo huérfano 18421 detectado en superbloque -> CORREGIDO (-y)`,
          `Paso 2: Verificando estructura de directorios...`,
          `Paso 3: Verificando conectividad de directorios...`,
          `Paso 4: Verificando contadores de referencia...`,
          `Paso 5: Verificando resumen de mapa de bits de bloques (bloque 99214)... REASIGNADO`,
          `${targetDisk}: ***** EL SISTEMA DE FICHEROS FUE MODIFICADO Y SANEADO *****`,
          `${targetDisk}: 41.290/16.384.000 ficheros (0.1% no contiguos), 142G/250G bloques [HEALTHY]`,
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
        return {
          output: 'kill: uso: kill [-9] <PID>',
          status: 'error',
        };
      }
      const pid = Number(pidArg);
      const proc = state.bashProcesses.find((p) => p.pid === pid);
      if (!proc) {
        return {
          output: `bash: kill: (${pid}) - No existe el proceso`,
          status: 'error',
        };
      }
      if (proc.critical) {
        return {
          output: `kill: Operación bloqueada por el Sandbox: el proceso ${proc.name} (PID ${pid}) es un servicio crítico del kernel.`,
          status: 'warning',
        };
      }
      state.bashProcesses = state.bashProcesses.filter((p) => p.pid !== pid);
      return {
        output: `[1]+  Killed (SIGKILL)        ${proc.command} (PID ${pid})`,
        status: 'success',
      };
    }

    case 'systemctl': {
      const action = args[0] || 'status';
      const service = args[1] || 'nginx';
      if (action === 'restart' || action === 'start' || action === 'reload') {
        state.bashNginxActive = true;
        return {
          output: `[OK] Servicio '${service}.service' reiniciado y verificado correctamente por systemd.`,
          status: 'success',
        };
      }
      return {
        output: [
          `● ${service}.service - Servidor de alto rendimiento ${service}`,
          `     Loaded: loaded (/lib/systemd/system/${service}.service; enabled)`,
          `     Active: active (running) since Sun 2026-11-01 08:00:00 UTC`,
          `   Main PID: 1042 (${service})`,
        ].join('\n'),
        status: 'success',
      };
    }

    case 'ss':
    case 'netstat': {
      const lines = [
        'Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process',
        'tcp    LISTEN  0       128     0.0.0.0:22           0.0.0.0:*          users:(("sshd",pid=842,fd=3))',
        'tcp    LISTEN  0       511     0.0.0.0:80           0.0.0.0:*          users:(("nginx",pid=1042,fd=6))',
      ];
      const rogue = state.bashProcesses.find((p) => p.isRogue);
      if (rogue) {
        lines.push(
          `tcp    ESTAB   0       0       10.0.14.10:9091      198.51.100.44:6667 users:(("${rogue.name}",pid=${rogue.pid},fd=4)) [SOSPECHOSO]`
        );
      }
      return { output: lines.join('\n'), status: 'success' };
    }

    case 'ufw': {
      const sub = (args[0] || 'status').toLowerCase();
      if (sub === 'enable') {
        state.bashFirewallEnabled = true;
        return {
          output:
            'Firewall is active and enabled on system startup\nReglas aplicadas: ALLOW 22/tcp (OpenSSH), ALLOW 80/tcp (Nginx), DENY INCOMING default.',
          status: 'success',
        };
      }
      if (sub === 'disable') {
        state.bashFirewallEnabled = false;
        return {
          output: 'Firewall stopped and disabled on system startup',
          status: 'warning',
        };
      }
      return {
        output: state.bashFirewallEnabled
          ? 'Estado: activo\nHacia                      Acción      Desde\n-----                      ------      -----\n22/tcp                     ALLOW       Anywhere\n80/tcp                     ALLOW       Anywhere'
          : 'Estado: inactivo (Ejecuta "sudo ufw enable" para activar el cortafuegos)',
        status: state.bashFirewallEnabled ? 'success' : 'warning',
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
          '  Directorios y Ficheros : dir [/a], Get-ChildItem [-Force], cd, mkdir, copy, move, del, type, Get-Content, tree',
          '  Atributos y Permisos   : attrib [+/-r] [+/-h] [+/-s] <f>, icacls <f> /grant Administrador:(F)',
          '  Integridad Criptográf. : certutil -hashfile <f> SHA256, Get-FileHash <f>',
          '  Discos y Volúmenes     : chkdsk D:, chkdsk D: /f /r, wmic logicaldisk, Get-Volume, Repair-Volume -DriveLetter D -SpotFix',
          '  Integridad de Sistema  : dism /online /cleanup-image /restorehealth, sfc /scannow, systeminfo',
          '  Gestión de Procesos    : tasklist, Get-Process, taskkill /PID <pid> /F, Stop-Process -Id <pid> -Force',
          '  Redes y DNS            : netstat -ano, ipconfig [/all | /flushdns], ping <host>',
          '  Tuberías y Redirección : comando | findstr <texto>, comando > archivo.txt, comando >> archivo.txt',
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
      const hash = computeDeterministicHash(
        `${node.name}:${node.content || ''}`
      );
      return {
        output: [
          `Hash SHA256 de ${fileArg}:`,
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
      return {
        output: `Directorio creado correctamente: ${abs}`,
        status: 'success',
      };
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
      writeWinFile(state.cmdRoot, finalDest, srcNode.content || '', false);

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
      return {
        output: 'Se han movido         1 archivo(s).',
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
      delete parent.children[key];
      return {
        output: `Archivo eliminado correctamente: ${name}`,
        status: 'success',
      };
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
      const lines = sourceText
        .split('\n')
        .filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
      return { output: lines.join('\n'), status: 'success' };
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
        const rule = args[grantIdx + 1];
        node.acl = `${rule}, BUILTIN\\Administradores:(F)`;
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
      const dDrive = state.cmdDisks.find((d) => d.id.toUpperCase() === 'D:');
      if (dDrive) {
        dDrive.repaired = true;
        dDrive.status = 'Healthy';
        dDrive.errorsFound = 0;
      }
      return {
        output: [
          'PowerShell Storage Module - Repair-Volume (DriveLetter D)',
          'Analizando registros MFT y clústeres dañados con -SpotFix...',
          'NoErrorsFound / AllCorruptionsFixed: El volumen D: (Datos_Raid) se ha reparado y su estado es Healthy.',
        ].join('\n'),
        status: 'success',
      };
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

      disk.repaired = true;
      disk.status = 'Healthy';
      disk.errorsFound = 0;

      return {
        output: [
          `El tipo del sistema de archivos es ${disk.fsType}.`,
          `La etiqueta del volumen es Datos_Raid.`,
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
        state.sfcSystemFilesHealthy = true;
        return {
          output: [
            `Iniciando examen en el sistema. Este proceso tardará algún tiempo.`,
            `Iniciando la fase de comprobación del examen del sistema.`,
            `Se completó la comprobación de 100%.`,
            state.dismComponentStoreHealthy
              ? `Protección de recursos de Windows encontró archivos dañados (kernel32_mui.dll, netapi32.dll) y los reparó correctamente desde WinSxS.`
              : `Protección de recursos de Windows reparó los archivos principales, pero se recomienda ejecutar 'dism /online /cleanup-image /restorehealth' para sanear la imagen origen.`,
          ].join('\n'),
          status: 'success',
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
        'Libera recursos de CPU y memoria secuestrados por procesos zombis, bucles infinitos o binarios no autorizados.',
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
