import { GuidedChallenge, VFSNode } from '../types/cli';

function getLinuxNode(root: VFSNode, pathStr: string): VFSNode | null {
  const parts = pathStr.split('/').filter(Boolean);
  let curr: VFSNode | undefined = root;
  for (const p of parts) {
    if (!curr || curr.type !== 'dir' || !curr.children) return null;
    curr = curr.children[p];
  }
  return curr || null;
}

function getWinNode(root: VFSNode, pathStr: string): VFSNode | null {
  const clean = pathStr.replace(/^[A-Za-z]:\\?/, '').replace(/\//g, '\\');
  const parts = clean.split('\\').filter(Boolean);
  let curr: VFSNode | undefined = root;
  for (const p of parts) {
    if (!curr || curr.type !== 'dir' || !curr.children) return null;
    const matchKey: string | undefined = Object.keys(curr.children).find(
      (k) => k.toLowerCase() === p.toLowerCase()
    );
    curr = matchKey ? curr.children[matchKey] : undefined;
  }
  return curr || null;
}

export const GUIDED_CHALLENGES: GuidedChallenge[] = [
  {
    id: 'reto-01-bash-files',
    number: '01',
    title: 'Organización y Respaldo en Servidor Linux',
    category: 'ficheros',
    categoryLabel: 'Gestión de Ficheros',
    shell: 'bash',
    difficulty: 'Básico',
    xp: 100,
    scenario:
      'El directorio /home/sysadmin contiene archivos de configuración sueltos y un archivo temporal corrupto (temp_crash.dmp). Debes crear una carpeta de respaldos, copiar la configuración crítica y eliminar el volcado basura.',
    learningObjective:
      'Dominar ls, mkdir, cp y rm en Bash manteniendo la higiene del directorio de trabajo.',
    steps: [
      {
        id: 'r1-s1',
        instruction:
          'Inspecciona los archivos presentes en /home/sysadmin (incluyendo ocultos) con ls.',
        hint: 'Escribe ls -la para ver todos los detalles del directorio actual.',
        exampleCommand: 'ls -la',
        validate: (cmd, shell) =>
          shell === 'bash' && /^ls(\s+-[a-zA-Z]+)?/i.test(cmd.trim()),
      },
      {
        id: 'r1-s2',
        instruction:
          'Crea un directorio llamado backups dentro de /home/sysadmin.',
        hint: 'Usa mkdir backups o mkdir -p backups.',
        exampleCommand: 'mkdir backups',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(state.bashRoot, '/home/sysadmin/backups');
          return Boolean(node && node.type === 'dir');
        },
      },
      {
        id: 'r1-s3',
        instruction:
          'Copia el archivo nginx.conf dentro de la carpeta backups/ y elimina el archivo basura temp_crash.dmp.',
        hint: 'Ejecuta cp nginx.conf backups/ && rm temp_crash.dmp.',
        exampleCommand: 'cp nginx.conf backups/ && rm temp_crash.dmp',
        validate: (_cmd, _shell, state) => {
          const copied = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/backups/nginx.conf'
          );
          const trash = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/temp_crash.dmp'
          );
          return Boolean(copied && !trash);
        },
      },
    ],
  },
  {
    id: 'reto-02-cmd-files',
    number: '02',
    title: 'Auditoría de Directorio Corporativo en Windows',
    category: 'ficheros',
    categoryLabel: 'Gestión de Ficheros',
    shell: 'cmd',
    difficulty: 'Básico',
    xp: 100,
    scenario:
      'En C:\\Users\\Administrador\\Proyectos existen archivos ocultos y temporales desordenados. Necesitas listar todos los elementos, crear la carpeta Archivo y mover allí el informe financiero.',
    learningObjective:
      'Utilizar dir /a (o Get-ChildItem -Force), mkdir y move en consola Windows CMD/PowerShell.',
    steps: [
      {
        id: 'r2-s1',
        instruction:
          'Lista todos los archivos del directorio actual incluyendo archivos ocultos y de sistema.',
        hint: 'En CMD utiliza dir /a o en PowerShell Get-ChildItem -Force.',
        exampleCommand: 'dir /a',
        validate: (cmd, shell) =>
          shell === 'cmd' && /^(dir|ls|get-childitem)/i.test(cmd.trim()),
      },
      {
        id: 'r2-s2',
        instruction:
          'Crea una carpeta llamada Archivo en C:\\Users\\Administrador\\Proyectos.',
        hint: 'Usa mkdir Archivo o md Archivo.',
        exampleCommand: 'mkdir Archivo',
        validate: (_cmd, _shell, state) => {
          const node = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\Archivo'
          );
          return Boolean(node && node.type === 'dir');
        },
      },
      {
        id: 'r2-s3',
        instruction:
          'Mueve el fichero balance_2026.xlsx dentro de la carpeta Archivo.',
        hint: 'Ejecuta move balance_2026.xlsx Archivo',
        exampleCommand: 'move balance_2026.xlsx Archivo',
        validate: (_cmd, _shell, state) => {
          const moved = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\Archivo\\balance_2026.xlsx'
          );
          return Boolean(moved);
        },
      },
    ],
  },
  {
    id: 'reto-03-bash-perms',
    number: '03',
    title: 'Blindaje de Clave SSH y Script de Despliegue',
    category: 'permisos',
    categoryLabel: 'Permisos y Seguridad',
    shell: 'bash',
    difficulty: 'Intermedio',
    xp: 140,
    scenario:
      'Una auditoría de seguridad detectó que la clave privada id_rsa tiene permisos 777 (abierta a todos los usuarios) y el script deploy.sh no es ejecutable ni pertenece a root:www-data.',
    learningObjective:
      'Aplicar el principio de mínimo privilegio mediante chmod octal (600, 750) y chown.',
    steps: [
      {
        id: 'r3-s1',
        instruction:
          'Restringe los permisos de /home/sysadmin/id_rsa a 600 (solo lectura y escritura para el propietario).',
        hint: 'Ejecuta chmod 600 id_rsa',
        exampleCommand: 'chmod 600 id_rsa',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(state.bashRoot, '/home/sysadmin/id_rsa');
          return Boolean(node && node.octal === '600');
        },
      },
      {
        id: 'r3-s2',
        instruction:
          'Otorga permisos 750 al script /home/sysadmin/deploy.sh para que el propietario pueda ejecutarlo y el grupo solo leer/ejecutar.',
        hint: 'Ejecuta chmod 750 deploy.sh',
        exampleCommand: 'chmod 750 deploy.sh',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(state.bashRoot, '/home/sysadmin/deploy.sh');
          return Boolean(node && (node.octal === '750' || node.octal === '755'));
        },
      },
      {
        id: 'r3-s3',
        instruction:
          'Cambia el propietario de deploy.sh a root:www-data utilizando sudo chown.',
        hint: 'Ejecuta sudo chown root:www-data deploy.sh',
        exampleCommand: 'sudo chown root:www-data deploy.sh',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(state.bashRoot, '/home/sysadmin/deploy.sh');
          return Boolean(node && node.owner === 'root:www-data');
        },
      },
    ],
  },
  {
    id: 'reto-04-cmd-perms',
    number: '04',
    title: 'Recuperación de Atributos y ACLs en Windows',
    category: 'permisos',
    categoryLabel: 'Permisos y Seguridad',
    shell: 'cmd',
    difficulty: 'Intermedio',
    xp: 140,
    scenario:
      'Un script malicioso ocultó el archivo credenciales.txt asignándole atributos de Sistema (+s) y Oculto (+h). Debes limpiarlo, protegerlo como Solo Lectura (+r) y asegurar su ACL con icacls.',
    learningObjective:
      'Gestionar atributos NTFS con attrib y listas de control de acceso con icacls.',
    steps: [
      {
        id: 'r4-s1',
        instruction:
          'Elimina los atributos Oculto (-h) y Sistema (-s) y añade Solo Lectura (+r) sobre credenciales.txt.',
        hint: 'Usa attrib -h -s +r credenciales.txt',
        exampleCommand: 'attrib -h -s +r credenciales.txt',
        validate: (_cmd, _shell, state) => {
          const node = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\credenciales.txt'
          );
          if (!node) return false;
          return (
            !node.attributes.includes('H') &&
            !node.attributes.includes('S') &&
            node.attributes.includes('R')
          );
        },
      },
      {
        id: 'r4-s2',
        instruction:
          'Concede control total explícito al Administrador sobre credenciales.txt usando icacls.',
        hint: 'Ejecuta icacls credenciales.txt /grant Administrador:(F)',
        exampleCommand: 'icacls credenciales.txt /grant Administrador:(F)',
        validate: (cmd, shell, state) => {
          const node = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\credenciales.txt'
          );
          return (
            shell === 'cmd' &&
            /icacls\s+.*credenciales\.txt/i.test(cmd) &&
            Boolean(node && node.acl.includes('Administrador:(F)'))
          );
        },
      },
    ],
  },
  {
    id: 'reto-05-cmd-chkdsk',
    number: '05',
    title: 'Diagnóstico y Reparación de Volumen NTFS (CHKDSK)',
    category: 'discos',
    categoryLabel: 'Comprobación de Discos',
    shell: 'cmd',
    difficulty: 'Intermedio',
    xp: 160,
    scenario:
      'El volumen secundario de datos D: presenta corrupción en la tabla maestra de archivos (MFT) y sectores defectuosos tras un corte eléctrico. Debes diagnosticarlo y repararlo sin formatear.',
    learningObjective:
      'Utilizar chkdsk en modo lectura y con los modificadores /f (corregir errores) y /r (recuperar sectores).',
    steps: [
      {
        id: 'r5-s1',
        instruction:
          'Realiza primero una comprobación no destructiva o consulta el estado del volumen D: con chkdsk D: o wmic.',
        hint: 'Ejecuta chkdsk D:',
        exampleCommand: 'chkdsk D:',
        validate: (cmd, shell) =>
          shell === 'cmd' &&
          /(chkdsk\s+d:|wmic\s+logicaldisk|get-volume)/i.test(cmd.trim()),
      },
      {
        id: 'r5-s2',
        instruction:
          'Ejecuta la reparación completa del volumen D: corrigiendo errores del sistema de ficheros (/f) y sectores físicos (/r).',
        hint: 'Ejecuta chkdsk D: /f /r',
        exampleCommand: 'chkdsk D: /f /r',
        validate: (_cmd, _shell, state) => {
          const dDrive = state.cmdDisks.find((d) => d.id.toUpperCase() === 'D:');
          return Boolean(
            dDrive && dDrive.repaired && dDrive.status === 'Healthy'
          );
        },
      },
    ],
  },
  {
    id: 'reto-06-bash-fsck',
    number: '06',
    title: 'Recuperación de Partición ext4 Corrupta (FSCK)',
    category: 'discos',
    categoryLabel: 'Comprobación de Discos',
    shell: 'bash',
    difficulty: 'Intermedio',
    xp: 160,
    scenario:
      'El volumen de datos /dev/sdb1 se ha montado en solo lectura por inodos huérfanos y bloques inconsistentes en el superbloque ext4. Inspecciona los bloques, desmonta el volumen (fsck nunca debe reparar un sistema de ficheros montado), sanéalo y vuelve a montarlo.',
    learningObjective:
      'Inspeccionar dispositivos de bloques con lsblk/df, desmontar con umount, reparar con sudo fsck -y y volver a montar con mount.',
    steps: [
      {
        id: 'r6-s1',
        instruction:
          'Verifica los discos y particiones del sistema mediante lsblk o df -h.',
        hint: 'Ejecuta lsblk o df -h para identificar la partición con errores.',
        exampleCommand: 'lsblk',
        validate: (cmd, shell) =>
          shell === 'bash' && /^(lsblk|df|blkid)/i.test(cmd.trim()),
      },
      {
        id: 'r6-s2',
        instruction:
          'Desmonta el volumen /mnt/datos: e2fsck se niega a reparar un sistema de ficheros montado porque podría corromperlo.',
        hint: 'Ejecuta sudo umount /mnt/datos (o sudo umount /dev/sdb1)',
        exampleCommand: 'sudo umount /mnt/datos',
        validate: (_cmd, _shell, state) => {
          const sdb1 = state.bashDisks.find((d) => d.id === '/dev/sdb1');
          return Boolean(sdb1 && (sdb1.mounted === false || sdb1.repaired));
        },
      },
      {
        id: 'r6-s3',
        instruction:
          'Repara automáticamente todos los inodos dañados en /dev/sdb1 ejecutando fsck con privilegios sudo y bandera -y.',
        hint: 'Ejecuta sudo fsck -y /dev/sdb1',
        exampleCommand: 'sudo fsck -y /dev/sdb1',
        validate: (_cmd, _shell, state) => {
          const sdb1 = state.bashDisks.find((d) => d.id === '/dev/sdb1');
          return Boolean(sdb1 && sdb1.repaired && sdb1.status === 'Healthy');
        },
      },
      {
        id: 'r6-s4',
        instruction: 'Vuelve a montar el volumen ya reparado en su punto de montaje de /etc/fstab.',
        hint: 'Ejecuta sudo mount /dev/sdb1 (o sudo mount -a)',
        exampleCommand: 'sudo mount /dev/sdb1',
        validate: (_cmd, _shell, state) => {
          const sdb1 = state.bashDisks.find((d) => d.id === '/dev/sdb1');
          return Boolean(sdb1 && sdb1.repaired && sdb1.mounted !== false);
        },
      },
    ],
  },
  {
    id: 'reto-07-cmd-sfc-dism',
    number: '07',
    title: 'Restauración de Imagen y Archivos de Sistema (DISM + SFC)',
    category: 'sistema',
    categoryLabel: 'Herramientas de Sistema',
    shell: 'cmd',
    difficulty: 'Avanzado',
    xp: 200,
    scenario:
      'El servidor Windows sufre cierres inesperados por corrupción en librerías .dll de System32 y daños en el almacén WinSxS. Primero debes sanear la imagen base con DISM y después reparar los ficheros del sistema con SFC.',
    learningObjective:
      'Aplicar el protocolo oficial de recuperación de Windows: DISM /RestoreHealth seguido de sfc /scannow.',
    steps: [
      {
        id: 'r7-s1',
        instruction:
          'Repara el almacén de componentes de la imagen online de Windows usando DISM con /Cleanup-Image y /RestoreHealth.',
        hint: 'Ejecuta dism /online /cleanup-image /restorehealth',
        exampleCommand: 'dism /online /cleanup-image /restorehealth',
        validate: (_cmd, _shell, state) => state.dismComponentStoreHealthy,
      },
      {
        id: 'r7-s2',
        instruction:
          'Una vez saneado el almacén base, ejecuta el Comprobador de Recursos de Windows para reparar las DLL dañadas.',
        hint: 'Ejecuta sfc /scannow',
        exampleCommand: 'sfc /scannow',
        validate: (_cmd, _shell, state) =>
          state.dismComponentStoreHealthy && state.sfcSystemFilesHealthy,
      },
    ],
  },
  {
    id: 'reto-08-cmd-taskkill',
    number: '08',
    title: 'Neutralización de Proceso Malicioso en Windows (TASKKILL)',
    category: 'sistema',
    categoryLabel: 'Herramientas de Sistema',
    shell: 'cmd',
    difficulty: 'Intermedio',
    xp: 150,
    scenario:
      'El uso de CPU del servidor está al 99% debido a un proceso no autorizado (crypto_miner.exe con PID 4812). Localízalo en la lista de tareas y fuérzalo a terminar.',
    learningObjective:
      'Auditar procesos activos con tasklist y finalizar procesos bloqueados o intrusos mediante taskkill /PID /F.',
    steps: [
      {
        id: 'r8-s1',
        instruction:
          'Lista todos los procesos en ejecución en Windows para confirmar el PID del proceso sospechoso.',
        hint: 'Ejecuta tasklist',
        exampleCommand: 'tasklist',
        validate: (cmd, shell) =>
          shell === 'cmd' && /^(tasklist|get-process|ps)/i.test(cmd.trim()),
      },
      {
        id: 'r8-s2',
        instruction:
          'Termina forzosamente (/F) el proceso crypto_miner.exe (PID 4812) utilizando taskkill.',
        hint: 'Ejecuta taskkill /PID 4812 /F o taskkill /IM crypto_miner.exe /F',
        exampleCommand: 'taskkill /PID 4812 /F',
        validate: (_cmd, _shell, state) =>
          !state.cmdProcesses.some((p) => p.pid === 4812),
      },
    ],
  },
  {
    id: 'reto-09-bash-ps-kill',
    number: '09',
    title: 'Eliminación de Proceso Descontrolado en Servidor Linux (PS + KILL)',
    category: 'sistema',
    categoryLabel: 'Herramientas de Sistema',
    shell: 'bash',
    difficulty: 'Intermedio',
    xp: 150,
    scenario:
      'Un worker descontrolado (runaway_syncd con PID 3104) está saturando la memoria RAM en Linux e ignora señales suaves. Localízalo con ps aux y envíale la señal SIGKILL (-9).',
    learningObjective:
      'Inspeccionar procesos POSIX con ps aux y enviar señales del kernel con kill -9.',
    steps: [
      {
        id: 'r9-s1',
        instruction:
          'Muestra todos los procesos activos del sistema con detalle de CPU y memoria.',
        hint: 'Ejecuta ps aux o ps -ef',
        exampleCommand: 'ps aux',
        validate: (cmd, shell) =>
          shell === 'bash' && /^(ps|top)/i.test(cmd.trim()),
      },
      {
        id: 'r9-s2',
        instruction:
          'Envía la señal SIGKILL (-9) al proceso 3104 para detenerlo inmediatamente.',
        hint: 'Ejecuta sudo kill -9 3104 o kill -9 3104',
        exampleCommand: 'sudo kill -9 3104',
        validate: (_cmd, _shell, state) =>
          !state.bashProcesses.some((p) => p.pid === 3104),
      },
    ],
  },
  {
    id: 'reto-10-bash-pipes',
    number: '10',
    title: 'Extracción Forense de Logs con Tuberías y Redirección (Bash)',
    category: 'redirecciones',
    categoryLabel: 'Redirecciones y Tuberías',
    shell: 'bash',
    difficulty: 'Avanzado',
    xp: 180,
    scenario:
      'El archivo /var/log/syslog contiene decenas de eventos mezclados. Debes filtrar únicamente las líneas que contengan ERROR y volcarlas en /home/sysadmin/errores.log, añadiendo después una firma de auditoría al final del archivo.',
    learningObjective:
      'Encadenar stdout con tuberías (|), filtrar con grep y persistir datos usando > (sobrescribir) y >> (anexar).',
    steps: [
      {
        id: 'r10-s1',
        instruction:
          'Filtra las líneas con ERROR de /var/log/syslog y redirige la salida al archivo errores.log en /home/sysadmin.',
        hint: 'Usa cat /var/log/syslog | grep ERROR > errores.log',
        exampleCommand: 'cat /var/log/syslog | grep ERROR > errores.log',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/errores.log'
          );
          return Boolean(
            node && node.content && node.content.includes('ERROR')
          );
        },
      },
      {
        id: 'r10-s2',
        instruction:
          'Añade al final de errores.log (sin borrar su contenido previo) una línea con el texto AUDITADO usando echo y >>.',
        hint: 'Ejecuta echo "AUDITADO" >> errores.log',
        exampleCommand: 'echo "AUDITADO" >> errores.log',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/errores.log'
          );
          return Boolean(
            node &&
              node.content &&
              node.content.includes('ERROR') &&
              node.content.toUpperCase().includes('AUDITADO')
          );
        },
      },
    ],
  },
  {
    id: 'reto-11-cmd-pipes',
    number: '11',
    title: 'Tuberías y Redirección de Auditoría en Windows (FINDSTR + >)',
    category: 'redirecciones',
    categoryLabel: 'Redirecciones y Tuberías',
    shell: 'cmd',
    difficulty: 'Avanzado',
    xp: 180,
    scenario:
      'El departamento de seguridad requiere un fichero llamado servicios_red.txt en C:\\Users\\Administrador\\Proyectos que contenga únicamente los procesos svchost.exe activos filtrados desde tasklist.',
    learningObjective:
      'Combinar tasklist | findstr en consola Windows y redirigir el flujo estándar hacia un archivo con >.',
    steps: [
      {
        id: 'r11-s1',
        instruction:
          'Filtra la salida de tasklist buscando svchost con findstr y redirígela al archivo servicios_red.txt.',
        hint: 'Ejecuta tasklist | findstr svchost > servicios_red.txt',
        exampleCommand: 'tasklist | findstr svchost > servicios_red.txt',
        validate: (_cmd, _shell, state) => {
          const node = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\servicios_red.txt'
          );
          return Boolean(
            node &&
              node.content &&
              node.content.toLowerCase().includes('svchost')
          );
        },
      },
      {
        id: 'r11-s2',
        instruction:
          'Anexa una línea final con el nombre del equipo (hostname) o sello de verificación al archivo servicios_red.txt usando >>.',
        hint: 'Ejecuta hostname >> servicios_red.txt o echo VERIFICADO >> servicios_red.txt',
        exampleCommand: 'hostname >> servicios_red.txt',
        validate: (cmd, shell, state) => {
          const node = getWinNode(
            state.cmdRoot,
            'C:\\Users\\Administrador\\Proyectos\\servicios_red.txt'
          );
          return Boolean(
            shell === 'cmd' &&
              cmd.includes('>>') &&
              node &&
              node.content &&
              node.content.split('\n').filter(Boolean).length >= 2
          );
        },
      },
    ],
  },
  {
    id: 'reto-12-master-dual',
    number: '12',
    title: 'Operación Fantasma: Respuesta Integral a Incidente',
    category: 'sistema',
    categoryLabel: 'Herramientas de Sistema',
    shell: 'bash',
    difficulty: 'Avanzado',
    xp: 220,
    scenario:
      'En el servidor Linux debes verificar y reiniciar el servicio web nginx tras un fallo de configuración, y generar un reporte del estado de los discos en /home/sysadmin/reporte_final.txt.',
    learningObjective:
      'Integrar administración de demonios (systemctl), diagnóstico de almacenamiento (df -h) y redirección de informes.',
    steps: [
      {
        id: 'r12-s1',
        instruction: 'Reinicia el servicio nginx utilizando systemctl.',
        hint: 'Ejecuta sudo systemctl restart nginx',
        exampleCommand: 'sudo systemctl restart nginx',
        validate: (cmd, shell) =>
          shell === 'bash' &&
          /systemctl\s+(restart|start)\s+nginx/i.test(cmd.trim()),
      },
      {
        id: 'r12-s2',
        instruction:
          'Genera el informe de uso de disco redirigiendo la salida de df -h hacia /home/sysadmin/reporte_final.txt.',
        hint: 'Ejecuta df -h > reporte_final.txt',
        exampleCommand: 'df -h > reporte_final.txt',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/reporte_final.txt'
          );
          return Boolean(
            node && node.content && node.content.includes('/dev/sda1')
          );
        },
      },
    ],
  },
  {
    id: 'reto-13-cmd-netstat-dns',
    number: '13',
    title: 'Auditoría de Puertos y Purga de Caché DNS en Windows',
    category: 'redes',
    categoryLabel: 'Redes y Cortafuegos',
    shell: 'cmd',
    difficulty: 'Intermedio',
    xp: 170,
    scenario:
      'Se sospecha de envenenamiento en la caché DNS local y conexiones salientes no autorizadas en el puerto 4444. Audita los sockets abiertos con su PID mediante netstat y purga la caché de resolución DNS.',
    learningObjective:
      'Utilizar netstat -ano para asociar puertos de red con procesos y sanear la resolución de nombres con ipconfig /flushdns.',
    steps: [
      {
        id: 'r13-s1',
        instruction:
          'Lista todas las conexiones TCP/UDP activas y sus PIDs asociados utilizando netstat -ano.',
        hint: 'Ejecuta netstat -ano',
        exampleCommand: 'netstat -ano',
        validate: (cmd, shell) =>
          shell === 'cmd' && /netstat(\s+-[a-z]+)?/i.test(cmd.trim()),
      },
      {
        id: 'r13-s2',
        instruction:
          'Vacía la caché de resolución DNS de Windows con ipconfig /flushdns.',
        hint: 'Ejecuta ipconfig /flushdns',
        exampleCommand: 'ipconfig /flushdns',
        validate: (_cmd, _shell, state) => state.cmdDnsFlushed,
      },
    ],
  },
  {
    id: 'reto-14-bash-ss-ufw',
    number: '14',
    title: 'Inspección de Sockets y Activación de Firewall UFW (Linux)',
    category: 'redes',
    categoryLabel: 'Redes y Cortafuegos',
    shell: 'bash',
    difficulty: 'Intermedio',
    xp: 170,
    scenario:
      'El servidor Linux tiene el cortafuegos perimetral desactivado y varios demonios escuchando en interfaces públicas. Inspecciona los puertos en escucha con ss, permite SSH para no quedarte fuera y activa el cortafuegos UFW.',
    learningObjective:
      'Auditar sockets de red con sudo ss -tulnp, abrir el puerto de SSH antes de nada (sudo ufw allow OpenSSH) y habilitar UFW (sudo ufw enable).',
    steps: [
      {
        id: 'r14-s1',
        instruction:
          'Muestra todos los sockets TCP y UDP en escucha junto al proceso propietario con ss -tulnp.',
        hint: 'Ejecuta sudo ss -tulnp (sin sudo no verás qué proceso hay detrás de los sockets de otros usuarios)',
        exampleCommand: 'sudo ss -tulnp',
        validate: (cmd, shell) =>
          shell === 'bash' && /^(sudo\s+)?(ss|netstat)\s+/i.test(cmd.trim()),
      },
      {
        id: 'r14-s2',
        instruction:
          'Antes de activar el cortafuegos, permite el tráfico SSH: la política por defecto de UFW bloquea todo lo entrante y en un servidor remoto perderías el acceso.',
        hint: 'Ejecuta sudo ufw allow OpenSSH (o sudo ufw allow 22/tcp)',
        exampleCommand: 'sudo ufw allow OpenSSH',
        validate: (_cmd, _shell, state) =>
          (state.bashFirewallRules ?? []).some((r) => /^(22|22\/tcp)\s+ALLOW$/.test(r)),
      },
      {
        id: 'r14-s3',
        instruction:
          'Activa el cortafuegos del servidor ejecutando sudo ufw enable.',
        hint: 'Ejecuta sudo ufw enable',
        exampleCommand: 'sudo ufw enable',
        validate: (_cmd, _shell, state) => state.bashFirewallEnabled,
      },
    ],
  },
  {
    id: 'reto-15-powershell-cmdlets',
    number: '15',
    title: 'Administración Moderna con Cmdlets de PowerShell',
    category: 'sistema',
    categoryLabel: 'PowerShell Moderno',
    shell: 'cmd',
    difficulty: 'Avanzado',
    xp: 190,
    scenario:
      'En entornos Windows Server modernos se priorizan los cmdlets verbo-nombre de PowerShell frente a ejecutables heredados. Inspecciona los volúmenes con Get-Volume y repara la unidad D: usando Repair-Volume.',
    learningObjective:
      'Dominar los cmdlets nativos de PowerShell: Get-Volume, Get-Process y Repair-Volume -DriveLetter D -SpotFix.',
    steps: [
      {
        id: 'r15-s1',
        instruction:
          'Consulta el estado de los volúmenes del servidor con el cmdlet Get-Volume.',
        hint: 'Ejecuta Get-Volume',
        exampleCommand: 'Get-Volume',
        validate: (cmd, shell) =>
          shell === 'cmd' && /^get-volume/i.test(cmd.trim()),
      },
      {
        id: 'r15-s2',
        instruction:
          'Ejecuta Repair-Volume -DriveLetter D -SpotFix para sanear el volumen de datos desde PowerShell.',
        hint: 'Ejecuta Repair-Volume -DriveLetter D -SpotFix',
        exampleCommand: 'Repair-Volume -DriveLetter D -SpotFix',
        validate: (cmd, shell, state) => {
          const dDrive = state.cmdDisks.find((d) => d.id.toUpperCase() === 'D:');
          return (
            shell === 'cmd' &&
            /repair-volume/i.test(cmd) &&
            Boolean(dDrive && dDrive.repaired)
          );
        },
      },
    ],
  },
  {
    id: 'reto-16-forense-sha256',
    number: '16',
    title: 'Verificación Criptográfica SHA-256 de Script en Producción',
    category: 'permisos',
    categoryLabel: 'Seguridad y Criptografía',
    shell: 'bash',
    difficulty: 'Avanzado',
    xp: 210,
    scenario:
      'Antes de ejecutar deploy.sh como root, el protocolo de seguridad exige calcular su hash SHA-256 y guardar el registro firmado en /home/sysadmin/checksum.sha256.',
    learningObjective:
      'Calcular resúmenes criptográficos con sha256sum y redirigirlos a un fichero de control de integridad.',
    steps: [
      {
        id: 'r16-s1',
        instruction:
          'Calcula el hash SHA-256 del script deploy.sh ejecutando sha256sum deploy.sh.',
        hint: 'Ejecuta sha256sum deploy.sh',
        exampleCommand: 'sha256sum deploy.sh',
        validate: (cmd, shell) =>
          shell === 'bash' && /^sha256sum\s+.*deploy\.sh/i.test(cmd.trim()),
      },
      {
        id: 'r16-s2',
        instruction:
          'Guarda la firma SHA-256 de deploy.sh dentro del archivo checksum.sha256 usando redirección >.',
        hint: 'Ejecuta sha256sum deploy.sh > checksum.sha256',
        exampleCommand: 'sha256sum deploy.sh > checksum.sha256',
        validate: (_cmd, _shell, state) => {
          const node = getLinuxNode(
            state.bashRoot,
            '/home/sysadmin/checksum.sha256'
          );
          return Boolean(
            node && node.content && node.content.includes('deploy.sh')
          );
        },
      },
      {
        id: 'r16-s3',
        instruction:
          'Comprueba la integridad del script contra la firma guardada con sha256sum -c: si alguien lo hubiera modificado, la suma no coincidiría.',
        hint: 'Ejecuta sha256sum -c checksum.sha256',
        exampleCommand: 'sha256sum -c checksum.sha256',
        validate: (cmd, shell, _state, lastEntry) =>
          shell === 'bash' &&
          /^sha256sum\s+(-c|--check)\s+\S+/i.test(cmd.trim()) &&
          Boolean(lastEntry && lastEntry.status === 'success' && /La suma coincide/.test(lastEntry.output)),
      },
    ],
  },
];
