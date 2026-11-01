import { describe, expect, it } from 'vitest';
import { GUIDED_CHALLENGES } from '../data/challenges';
import { ShellMode, SystemHealthState, TerminalHistoryEntry } from '../types/cli';
import { createInitialSystemState, executeCommand, getLinuxNodeByPath, getWinNodeByPath } from './cliEngine';
import { sha256Hex } from './hash';

function session(shell: ShellMode = 'bash') {
  let state = createInitialSystemState();
  const run = (cmd: string, sh: ShellMode = shell) => {
    const r = executeCommand(cmd, sh, state);
    state = r.nextState;
    return r;
  };
  return { run, get state() { return state; } };
}

const linux = (state: SystemHealthState, path: string) => getLinuxNodeByPath(state.bashRoot, path);

describe('retos: el comando de ejemplo de cada paso lo completa', () => {
  it('los 16 retos en una misma sesión', () => {
    let state = createInitialSystemState();
    const failed: string[] = [];
    for (const challenge of GUIDED_CHALLENGES) {
      for (const step of challenge.steps) {
        const r = executeCommand(step.exampleCommand, challenge.shell, state);
        state = r.nextState;
        const entry = { output: r.output, status: r.status } as TerminalHistoryEntry;
        if (!step.validate(step.exampleCommand, challenge.shell, state, entry)) {
          failed.push(`${challenge.number}/${step.id}: ${step.exampleCommand} -> ${r.output.slice(0, 120)}`);
        }
      }
    }
    expect(failed).toEqual([]);
    expect(GUIDED_CHALLENGES).toHaveLength(16);
  });
});

describe('hashes reales', () => {
  it('sha256sum coincide con SHA-256 del contenido y no depende del nombre', () => {
    const s = session();
    const out = s.run('sha256sum deploy.sh').output;
    expect(out).toBe(`${sha256Hex(linux(s.state, '/home/sysadmin/deploy.sh')!.content!)}  deploy.sh`);
    s.run('cp deploy.sh copia.sh');
    expect(s.run('sha256sum copia.sh').output.split(' ')[0]).toBe(out.split(' ')[0]);
  });

  it('sha256sum -c detecta un fichero modificado', () => {
    const s = session();
    s.run('sha256sum deploy.sh > checksum.sha256');
    expect(s.run('sha256sum -c checksum.sha256').output).toBe('deploy.sh: La suma coincide');
    s.run('echo "rm -rf /" >> deploy.sh');
    const r = s.run('sha256sum -c checksum.sha256');
    expect(r.status).toBe('error');
    expect(r.output).toContain('deploy.sh: FALLÓ');
  });

  it('certutil y Get-FileHash calculan el mismo SHA-256', () => {
    const s = session('cmd');
    const content = getWinNodeByPath(s.state.cmdRoot, 'C:\\Users\\Administrador\\Proyectos\\leeme_sysadmin.txt')!.content!;
    expect(s.run('certutil -hashfile leeme_sysadmin.txt SHA256').output).toContain(sha256Hex(content));
    expect(s.run('Get-FileHash leeme_sysadmin.txt').output).toContain(sha256Hex(content).toUpperCase());
  });
});

describe('ficheros en Bash', () => {
  it('touch no cambia el contenido de un fichero existente', () => {
    const s = session();
    const before = linux(s.state, '/home/sysadmin/nginx.conf')!.content;
    s.run('touch nginx.conf');
    expect(linux(s.state, '/home/sysadmin/nginx.conf')!.content).toBe(before);
  });

  it('mkdir sin -p no crea padres; mv de una carpeta conserva su contenido', () => {
    const s = session();
    expect(s.run('mkdir a/b').status).toBe('error');
    s.run('mkdir -p a/b && touch a/b/dato.txt');
    s.run('mv a z');
    expect(linux(s.state, '/home/sysadmin/a')).toBeNull();
    expect(linux(s.state, '/home/sysadmin/z/b/dato.txt')?.type).toBe('file');
  });

  it('cp de una carpeta exige -r y rm de una carpeta exige -r', () => {
    const s = session();
    s.run('mkdir -p docs');
    expect(s.run('cp docs copia').status).toBe('error');
    expect(s.run('cp -r docs copia').status).toBe('success');
    expect(s.run('rm copia').status).toBe('error');
    expect(s.run('rm -r copia').status).toBe('success');
  });

  it('mv a un destino inexistente no pierde el origen', () => {
    const s = session();
    expect(s.run('mv nginx.conf /no/existe/nginx.conf').status).toBe('error');
    expect(linux(s.state, '/home/sysadmin/nginx.conf')).not.toBeNull();
  });

  it('head/tail con -n, wc con fichero y grep con -i, -n, -c', () => {
    const s = session();
    expect(s.run('head -n 2 nginx.conf').output.split('\n')).toHaveLength(2);
    expect(s.run('wc -l nginx.conf').output).toBe('8 nginx.conf');
    expect(s.run('grep -c ERROR /var/log/syslog').output).toBe('3');
    expect(s.run('grep -ic error /var/log/syslog').output).toBe('4');
    expect(s.run('grep -n EXT4 /var/log/syslog').output).toMatch(/^2:/);
    // el patrón «nginx» contiene una i, pero no debe activar -i por sí solo
    expect(s.run('grep NGINX nginx.conf').status).toBe('warning');
  });

  it('find busca por nombre y tipo', () => {
    const s = session();
    expect(s.run('find /etc -name "*tab"').output).toBe('/etc/fstab');
    expect(s.run('find . -type d').output).toBe('.');
  });
});

describe('permisos POSIX', () => {
  it('sysadmin lee /var/log/syslog por estar en el grupo adm', () => {
    expect(session().run('cat /var/log/syslog').status).toBe('success');
  });

  it('chmod 000 impide leer al propio dueño; chmod simbólico calcula el octal', () => {
    const s = session();
    s.run('chmod 000 id_rsa');
    expect(s.run('cat id_rsa').output).toBe('cat: id_rsa: Permiso denegado');
    s.run('chmod u+rw id_rsa');
    expect(linux(s.state, '/home/sysadmin/id_rsa')!.octal).toBe('600');
    s.run('chmod go+r,u+x id_rsa');
    expect(linux(s.state, '/home/sysadmin/id_rsa')!.permissions).toBe('rwxr--r--');
  });

  it('chown exige sudo y chmod sobre un fichero de root también', () => {
    const s = session();
    expect(s.run('chown root:root deploy.sh').status).toBe('error');
    expect(s.run('chmod 777 /etc/hosts').status).toBe('error');
    expect(s.run('sudo chown root:www-data deploy.sh').status).toBe('success');
  });

  it('la redirección a /etc falla aunque uses sudo; sudo tee funciona', () => {
    const s = session();
    expect(s.run('sudo echo 10.0.0.5 backup >> /etc/hosts').status).toBe('error');
    expect(s.run('echo 10.0.0.5 backup | sudo tee -a /etc/hosts').status).toBe('success');
    expect(linux(s.state, '/etc/hosts')!.content).toContain('10.0.0.5 backup');
  });
});

describe('discos, procesos y red en Linux', () => {
  it('fsck exige sudo y que el volumen esté desmontado', () => {
    const s = session();
    expect(s.run('fsck -y /dev/sdb1').status).toBe('error');
    expect(s.run('sudo fsck -y /dev/sdb1').output).toContain('está montado');
    s.run('sudo umount /mnt/datos');
    expect(s.run('df -h').output).not.toContain('/dev/sdb1');
    expect(s.run('sudo fsck -y /dev/sdb1').status).toBe('success');
    s.run('sudo mount /dev/sdb1');
    expect(s.run('df -h').output).toContain('/dev/sdb1');
  });

  it('kill sin -9 no basta con un proceso colgado y los de otro usuario exigen sudo', () => {
    const s = session();
    expect(s.run('kill 3104').status).toBe('warning');
    expect(s.state.bashProcesses.some((p) => p.pid === 3104)).toBe(true);
    expect(s.run('kill -9 1042').status).toBe('error');
    expect(s.run('kill -9 3104').status).toBe('success');
  });

  it('ss -l solo muestra sockets en escucha', () => {
    const s = session();
    expect(s.run('ss -tulnp').output).not.toContain('ESTAB');
    expect(s.run('ss -tunp').output).toContain('ESTAB');
  });

  it('ufw exige sudo y avisa si se activa sin permitir SSH', () => {
    const s = session();
    expect(s.run('ufw enable').status).toBe('error');
    expect(s.run('sudo ufw enable').status).toBe('warning');
    s.run('sudo ufw allow OpenSSH');
    expect(s.run('sudo ufw status').output).toContain('22/tcp');
  });
});

describe('Windows', () => {
  it('findstr distingue mayúsculas salvo con /i', () => {
    const s = session('cmd');
    expect(s.run('type leeme_sysadmin.txt | findstr DISM').output).toContain('DISM');
    expect(s.run('type leeme_sysadmin.txt | findstr dism').status).toBe('warning');
    expect(s.run('type leeme_sysadmin.txt | findstr /i dism').output).toContain('DISM');
  });

  it('chkdsk C: /f se programa para el reinicio; D: se repara', () => {
    const s = session('cmd');
    expect(s.run('chkdsk C: /f').output).toContain('próxima vez que se reinicie');
    s.run('chkdsk D: /f');
    expect(s.state.cmdDisks.find((d) => d.id === 'D:')!.repaired).toBe(true);
  });

  it('sfc no puede reparar si el almacén WinSxS está dañado', () => {
    const s = session('cmd');
    s.run('sfc /scannow');
    expect(s.state.sfcSystemFilesHealthy).toBe(false);
    s.run('dism /online /cleanup-image /restorehealth');
    s.run('sfc /scannow');
    expect(s.state.sfcSystemFilesHealthy).toBe(true);
  });

  it('taskkill de un proceso colgado exige /F', () => {
    const s = session('cmd');
    expect(s.run('taskkill /PID 4812').status).toBe('error');
    expect(s.run('taskkill /PID 4812 /F').status).toBe('success');
  });

  it('move de una carpeta conserva su contenido; del no borra carpetas; rmdir /s sí', () => {
    const s = session('cmd');
    s.run('mkdir Viejo');
    s.run('copy cache_old.tmp Viejo');
    s.run('move Viejo Antiguo');
    expect(getWinNodeByPath(s.state.cmdRoot, 'C:\\Users\\Administrador\\Proyectos\\Antiguo\\cache_old.tmp')).not.toBeNull();
    expect(s.run('del Antiguo').status).toBe('error');
    expect(s.run('rmdir Antiguo').status).toBe('error');
    expect(s.run('rmdir /s /q Antiguo').status).toBe('success');
  });

  it('del no borra un archivo de solo lectura sin /f', () => {
    const s = session('cmd');
    s.run('attrib +r cache_old.tmp');
    expect(s.run('del cache_old.tmp').status).toBe('error');
    expect(s.run('del /f cache_old.tmp').status).toBe('success');
  });
});
