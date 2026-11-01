import { Achievement, ChallengeCategory } from '../types/cli';

export interface CommandReferenceItem {
  id: string;
  category: ChallengeCategory;
  categoryName: string;
  bashCmd: string;
  cmdPowershell: string;
  description: string;
  exampleBash: string;
  exampleCmd: string;
  riskLevel: 'Seguro' | 'Precaución' | 'Crítico (Root/Admin)';
  keyFlags: string[];
}

export const COMMAND_REFERENCE: CommandReferenceItem[] = [
  {
    id: 'ref-ls-dir',
    category: 'ficheros',
    categoryName: 'Gestión de Ficheros',
    bashCmd: 'ls -la  |  stat <fichero>',
    cmdPowershell: 'dir /a  |  Get-ChildItem -Force',
    description:
      'Lista todos los archivos y subdirectorios, incluyendo elementos ocultos, permisos POSIX o atributos NTFS, propietarios y tamaños en bytes.',
    exampleBash: 'ls -la /home/sysadmin',
    exampleCmd: 'dir /a C:\\Users\\Administrador\\Proyectos',
    riskLevel: 'Seguro',
    keyFlags: ['-l (formato largo)', '-a (mostrar ocultos)', '/a (todos los atributos en CMD)', '-Force (ocultos en PowerShell)'],
  },
  {
    id: 'ref-mkdir-move',
    category: 'ficheros',
    categoryName: 'Gestión de Ficheros',
    bashCmd: 'mkdir -p / mv / cp / rm',
    cmdPowershell: 'mkdir / move / copy / del / Remove-Item',
    description:
      'Creación de árboles de directorios, movimiento/renombrado, copia de respaldo y eliminación controlada de ficheros.',
    exampleBash: 'mkdir -p backups && cp nginx.conf backups/',
    exampleCmd: 'mkdir Archivo && move balance_2026.xlsx Archivo',
    riskLevel: 'Precaución',
    keyFlags: ['-p (crea padres en Bash)', '-r (recursivo)', '/F /Q (forzar borrado en CMD)'],
  },
  {
    id: 'ref-hash-verify',
    category: 'ficheros',
    categoryName: 'Integridad y Criptografía',
    bashCmd: 'sha256sum <fichero>  |  md5sum',
    cmdPowershell: 'certutil -hashfile <fichero> SHA256  |  Get-FileHash',
    description:
      'Calcula la huella criptográfica SHA-256 de un binario o script para verificar que no haya sido alterado ni troyanizado.',
    exampleBash: 'sha256sum deploy.sh',
    exampleCmd: 'certutil -hashfile balance_2026.xlsx SHA256',
    riskLevel: 'Seguro',
    keyFlags: ['SHA256 (algoritmo criptográfico estándar)', '-hashfile (bandera certutil)'],
  },
  {
    id: 'ref-chmod-attrib',
    category: 'permisos',
    categoryName: 'Permisos y Atributos',
    bashCmd: 'chmod <octal> <fichero>',
    cmdPowershell: 'attrib [+/-][r/h/s] <fichero>',
    description:
      'Modifica los permisos de lectura (4), escritura (2) y ejecución (1) en Linux o los atributos de Solo lectura (R), Oculto (H) y Sistema (S) en Windows.',
    exampleBash: 'chmod 600 /home/sysadmin/id_rsa',
    exampleCmd: 'attrib -h -s +r C:\\Users\\Administrador\\Proyectos\\credenciales.txt',
    riskLevel: 'Precaución',
    keyFlags: ['600 (solo dueño rw-)', '750 (dueño rwx, grupo r-x)', '+r (solo lectura)', '-h -s (limpiar oculto/sistema)'],
  },
  {
    id: 'ref-chown-icacls',
    category: 'permisos',
    categoryName: 'Permisos y Atributos',
    bashCmd: 'sudo chown usuario:grupo <fichero>',
    cmdPowershell: 'icacls <fichero> /grant Usuario:(F)',
    description:
      'Cambia el propietario y grupo asignado a un inodo en sistemas POSIX o administra listas de control de acceso (ACL) discrecionales en NTFS.',
    exampleBash: 'sudo chown root:www-data /home/sysadmin/deploy.sh',
    exampleCmd: 'icacls credenciales.txt /grant Administrador:(F)',
    riskLevel: 'Crítico (Root/Admin)',
    keyFlags: ['-R (recursivo)', '/grant (otorgar ACL)', '(F) Control Total', '(RX) Lectura y Ejecución'],
  },
  {
    id: 'ref-fsck-chkdsk',
    category: 'discos',
    categoryName: 'Comprobación de Discos',
    bashCmd: 'sudo fsck -y /dev/sdX  |  lsblk',
    cmdPowershell: 'chkdsk X: /f /r  |  Repair-Volume -DriveLetter D -SpotFix',
    description:
      'Verifica la integridad lógica del sistema de ficheros (ext4/NTFS), repara inodos huérfanos en el superbloque y reubica sectores defectuosos.',
    exampleBash: 'sudo fsck -y /dev/sdb1',
    exampleCmd: 'chkdsk D: /f /r',
    riskLevel: 'Crítico (Root/Admin)',
    keyFlags: ['-y (asumir sí a reparaciones en fsck)', '/f (corregir errores lógicos)', '/r (localizar sectores físicos dañados)'],
  },
  {
    id: 'ref-sfc-dism',
    category: 'sistema',
    categoryName: 'Herramientas de Sistema',
    bashCmd: 'sudo systemctl restart <servicio>  |  journalctl',
    cmdPowershell: 'dism /Online /Cleanup-Image /RestoreHealth & sfc /scannow',
    description:
      'En Windows, DISM repara el almacén de componentes (WinSxS) corrupto y SFC verifica y restaura librerías críticas (.dll/.sys) protegidas en System32.',
    exampleBash: 'sudo systemctl restart nginx',
    exampleCmd: 'dism /online /cleanup-image /restorehealth',
    riskLevel: 'Crítico (Root/Admin)',
    keyFlags: ['/RestoreHealth (repara almacén base WinSxS)', '/scannow (escanea y repara ficheros de sistema)'],
  },
  {
    id: 'ref-ps-taskkill',
    category: 'sistema',
    categoryName: 'Herramientas de Sistema',
    bashCmd: 'ps aux  |  sudo kill -9 <PID>',
    cmdPowershell: 'tasklist  |  taskkill /PID <PID> /F  |  Stop-Process -Id <PID> -Force',
    description:
      'Inspecciona la tabla de procesos activos en memoria y envía señales de terminación inmediata (SIGKILL / terminación forzada) a procesos bloqueados o maliciosos.',
    exampleBash: 'sudo kill -9 3104',
    exampleCmd: 'taskkill /PID 4812 /F',
    riskLevel: 'Crítico (Root/Admin)',
    keyFlags: ['aux (todos los procesos en Bash)', '-9 (señal SIGKILL)', '/PID (por identificador)', '/F o -Force (forzar cierre)'],
  },
  {
    id: 'ref-redirections',
    category: 'redirecciones',
    categoryName: 'Redirecciones y Tuberías',
    bashCmd: 'comando | grep "PATRON" > salida.txt',
    cmdPowershell: 'comando | findstr "PATRON" > salida.txt  |  Select-String',
    description:
      'Conecta la salida estándar (stdout) de un proceso con la entrada estándar (stdin) de otro mediante tuberías (|) y vuelca el resultado a fichero (> sobrescribe, >> añade).',
    exampleBash: 'cat /var/log/syslog | grep ERROR > /home/sysadmin/errores.log',
    exampleCmd: 'tasklist | findstr svchost > servicios_red.txt',
    riskLevel: 'Seguro',
    keyFlags: ['| (pipe / tubería)', '> (sobrescribir fichero)', '>> (añadir al final del fichero)'],
  },
  {
    id: 'ref-netstat-ss',
    category: 'redes',
    categoryName: 'Redes y Cortafuegos',
    bashCmd: 'ss -tulnp  |  sudo ufw enable  |  ip a',
    cmdPowershell: 'netstat -ano  |  ipconfig /flushdns  |  ping',
    description:
      'Audita puertos TCP/UDP en escucha y conexiones establecidas junto con el PID propietario, limpia la caché de resolución DNS y activa el cortafuegos del host.',
    exampleBash: 'ss -tulnp',
    exampleCmd: 'netstat -ano',
    riskLevel: 'Precaución',
    keyFlags: ['-tulnp (TCP/UDP en escucha con PID en Linux)', '-ano (todas las conexiones y PIDs en Windows)', '/flushdns (vaciar caché DNS)'],
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-cmd',
    title: 'Primera Señal en Consola',
    description: 'Ejecutaste tu primer comando en el entorno seguro del laboratorio CLI.',
    conditionText: 'Ejecutar 1 comando válido en cualquier consola',
    xpBonus: 25,
    category: 'Iniciación',
  },
  {
    id: 'ach-bilingual',
    title: 'Operador Bilingüe (POSIX & Win32/PS)',
    description: 'Alternaste y ejecutaste comandos tanto en GNU/Bash como en Windows CMD/PowerShell.',
    conditionText: 'Ejecutar comandos en ambas consolas (Bash y CMD/PS)',
    xpBonus: 50,
    category: 'Versatilidad',
  },
  {
    id: 'ach-files',
    title: 'Arquitecto de Directorios',
    description: 'Completaste un reto guiado de organización y limpieza de ficheros sin pérdida de datos.',
    conditionText: 'Completar cualquier reto de Gestión de Ficheros',
    xpBonus: 75,
    category: 'Ficheros',
  },
  {
    id: 'ach-permissions',
    title: 'Guardián del Principio de Mínimo Privilegio',
    description: 'Blindaste claves privadas y archivos críticos usando chmod/chown o attrib/icacls.',
    conditionText: 'Completar un reto de Permisos y Seguridad',
    xpBonus: 100,
    category: 'Seguridad',
  },
  {
    id: 'ach-disk-surgeon',
    title: 'Cirujano de Sistemas de Archivos',
    description: 'Diagnosticaste y reparaste sectores e inodos dañados mediante chkdsk /f /r o fsck -y.',
    conditionText: 'Reparar un volumen dañado con chkdsk o fsck',
    xpBonus: 120,
    category: 'Almacenamiento',
  },
  {
    id: 'ach-system-doctor',
    title: 'Especialista en Integridad WinSxS',
    description: 'Restauraste la imagen del sistema con DISM /RestoreHealth y reparaste binarios con sfc /scannow.',
    conditionText: 'Reparar el almacén de componentes con DISM y SFC',
    xpBonus: 150,
    category: 'Sistema',
  },
  {
    id: 'ach-process-hunter',
    title: 'Cazador de Procesos Zombi',
    description: 'Identificaste procesos maliciosos o colgados mediante ps/tasklist y los neutralizaste por PID.',
    conditionText: 'Terminar un proceso descontrolado con kill -9, taskkill /F o Stop-Process',
    xpBonus: 100,
    category: 'Procesos',
  },
  {
    id: 'ach-pipe-master',
    title: 'Maestro de Flujos y Tuberías',
    description: 'Combinaste tuberías (|) con filtrado (grep/findstr) y redirección a fichero (> o >>).',
    conditionText: 'Ejecutar una cadena con tubería y redirección de salida',
    xpBonus: 110,
    category: 'Redirecciones',
  },
  {
    id: 'ach-net-defender',
    title: 'Centinela de Red y Cortafuegos',
    description: 'Auditaste puertos activos (ss/netstat), activaste el firewall UFW y saneaste la caché DNS.',
    conditionText: 'Completar un reto de Redes y Cortafuegos',
    xpBonus: 140,
    category: 'Redes',
  },
  {
    id: 'ach-exam-mode',
    title: 'Certificación bajo Presión (Modo Examen)',
    description: 'Superaste un reto completo con el Modo Examen activo (sin pistas ni autocompletado asistido).',
    conditionText: 'Completar cualquier reto con Modo Examen activado',
    xpBonus: 175,
    category: 'Excelencia',
  },
  {
    id: 'ach-halfway',
    title: 'Administrador de Sistemas Senior',
    description: 'Superaste al menos 8 retos guiados del laboratorio demostrando dominio técnico.',
    conditionText: 'Completar 8 o más retos guiados',
    xpBonus: 200,
    category: 'Progreso',
  },
  {
    id: 'ach-ghost-master',
    title: 'Un Fantasma en el Sistema',
    description: 'Completaste el 100% de los 16 retos de administración en Linux y Windows sin dañar el entorno.',
    conditionText: 'Completar los 16 retos guiados del entrenador',
    xpBonus: 500,
    category: 'Maestría',
  },
];
