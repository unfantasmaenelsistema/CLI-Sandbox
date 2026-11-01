import React, { useState } from 'react';
import { Play, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ShellMode } from '../types/cli';

interface PermissionsCalculatorProps {
  onSendCommand: (cmd: string, targetShell: ShellMode) => void;
}

interface PermTriplet {
  r: boolean;
  w: boolean;
  x: boolean;
}

export const PermissionsCalculator: React.FC<PermissionsCalculatorProps> = ({
  onSendCommand,
}) => {
  const [owner, setOwner] = useState<PermTriplet>({
    r: true,
    w: true,
    x: true,
  });
  const [group, setGroup] = useState<PermTriplet>({
    r: true,
    w: false,
    x: true,
  });
  const [others, setOthers] = useState<PermTriplet>({
    r: false,
    w: false,
    x: false,
  });
  const [targetFile, setTargetFile] = useState<string>('deploy.sh');
  const [winAttr, setWinAttr] = useState<{ r: boolean; h: boolean; s: boolean }>(
    { r: true, h: false, s: false }
  );

  const calcDigit = (t: PermTriplet) =>
    (t.r ? 4 : 0) + (t.w ? 2 : 0) + (t.x ? 1 : 0);
  const calcSym = (t: PermTriplet) =>
    `${t.r ? 'r' : '-'}${t.w ? 'w' : '-'}${t.x ? 'x' : '-'}`;

  const octalCode = `${calcDigit(owner)}${calcDigit(group)}${calcDigit(others)}`;
  const symbolicCode = `-${calcSym(owner)}${calcSym(group)}${calcSym(others)}`;

  const applyPreset = (code: string, sampleFile: string) => {
    const digits = code.split('').map(Number);
    const toTriplet = (d: number): PermTriplet => ({
      r: (d & 4) !== 0,
      w: (d & 2) !== 0,
      x: (d & 1) !== 0,
    });
    setOwner(toTriplet(digits[0] || 0));
    setGroup(toTriplet(digits[1] || 0));
    setOthers(toTriplet(digits[2] || 0));
    setTargetFile(sampleFile);
  };

  const bashCommand = `chmod ${octalCode} ${targetFile}`;
  const cmdAttrFlags = [
    winAttr.r ? '+r' : '-r',
    winAttr.h ? '+h' : '-h',
    winAttr.s ? '+s' : '-s',
  ].join(' ');
  const winCommand = `attrib ${cmdAttrFlags} credenciales.txt`;

  const isWorldWritable = others.w;
  const isPrivateSafe = octalCode === '600' || octalCode === '400';

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Simulador Interactivo de Permisos POSIX (chmod) y Atributos NTFS (attrib)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Experimenta con los bits octales (4=Lectura, 2=Escritura, 1=Ejecución) y comprueba su nivel de seguridad antes de enviarlos a la consola.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
            Perfiles típicos:
          </span>
          {[
            { code: '600', label: '600 (Clave SSH)', file: 'id_rsa' },
            { code: '644', label: '644 (Config)', file: 'nginx.conf' },
            { code: '750', label: '750 (Script Prod)', file: 'deploy.sh' },
            { code: '777', label: '777 (Peligroso)', file: 'id_rsa' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.code, preset.file)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                octalCode === preset.code
                  ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Matrix Checkboxes (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Propietario (User)',
              digit: calcDigit(owner),
              state: owner,
              setter: setOwner,
            },
            {
              title: 'Grupo (Group)',
              digit: calcDigit(group),
              state: group,
              setter: setGroup,
            },
            {
              title: 'Otros (Others)',
              digit: calcDigit(others),
              state: others,
              setter: setOthers,
            },
          ].map((col) => (
            <div
              key={col.title}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {col.title}
                </span>
                <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {col.digit}
                </span>
              </div>

              {(
                [
                  { key: 'r', label: 'Lectura (r = 4)' },
                  { key: 'w', label: 'Escritura (w = 2)' },
                  { key: 'x', label: 'Ejecución (x = 1)' },
                ] as const
              ).map((bit) => (
                <label
                  key={bit.key}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={col.state[bit.key]}
                    onChange={(e) =>
                      col.setter({ ...col.state, [bit.key]: e.target.checked })
                    }
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-mono">{bit.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Live Resulting Output & Security Evaluation (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-4 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Resultado Octal / Simbólico:</span>
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {octalCode} · {symbolicCode}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <code className="font-mono text-xs text-sky-300">
                $ {bashCommand}
              </code>
              <button
                type="button"
                onClick={() => onSendCommand(bashCommand, 'bash')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3" />
                <span>Ejecutar en Bash</span>
              </button>
            </div>

            {/* Windows attrib simulator row */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Atributos Windows NTFS (credenciales.txt):</span>
                <div className="flex items-center gap-2 font-mono">
                  {(
                    [
                      { k: 'r', l: 'R (Solo lectura)' },
                      { k: 'h', l: 'H (Oculto)' },
                      { k: 's', l: 'S (Sistema)' },
                    ] as const
                  ).map((at) => (
                    <label
                      key={at.k}
                      className="flex items-center gap-1 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={winAttr[at.k]}
                        onChange={(e) =>
                          setWinAttr({ ...winAttr, [at.k]: e.target.checked })
                        }
                      />
                      <span>{at.k.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-xs text-sky-300">
                  &gt; {winCommand}
                </code>
                <button
                  type="button"
                  onClick={() => onSendCommand(winCommand, 'cmd')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3" />
                  <span>Ejecutar en CMD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Auditor Box */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              isWorldWritable
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : 'border-emerald-500/30 bg-emerald-500/5 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isWorldWritable ? (
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div>
              {isWorldWritable ? (
                <span>
                  <strong>Riesgo Crítico ({octalCode}):</strong> El bloque "Otros" tiene permiso de escritura (w). Cualquier usuario local podría modificar o inyectar código en {targetFile}.
                </span>
              ) : isPrivateSafe ? (
                <span>
                  <strong>Blindaje Estricto ({octalCode}):</strong> Solo el propietario puede leer el archivo. Configuración ideal para claves privadas SSH (id_rsa) y secretos.
                </span>
              ) : (
                <span>
                  <strong>Permisos Equilibrados ({octalCode}):</strong> El bloque "Otros" no posee permisos de escritura. Adecuado para scripts o archivos de configuración.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
