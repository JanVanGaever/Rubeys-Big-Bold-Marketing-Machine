import { useState } from 'react';
import { Upload, Play, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type JobStatus = 'idle' | 'running' | 'done' | 'error';

interface ImportJob {
  id: string;
  source: string;
  status: JobStatus;
  count: number;
  timestamp: string;
}

const INITIAL_JOBS: ImportJob[] = [
  { id: '1', source: 'Apollo Daily Search', status: 'done', count: 18, timestamp: '07:00 vandaag' },
  { id: '2', source: 'Phantombuster — KMSKA', status: 'done', count: 12, timestamp: '08:00 vandaag' },
  { id: '3', source: 'Phantombuster — Bank Delen', status: 'done', count: 9, timestamp: '08:02 vandaag' },
];

function StatusIcon({ status }: { status: JobStatus }) {
  if (status === 'done') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  if (status === 'running') return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-400" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export default function ImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>(INITIAL_JOBS);
  const [apolloSearches] = useState([
    { id: 'a1', name: 'KMSKA partners & bezoekers', active: true },
    { id: 'a2', name: 'Private banking Brussel', active: true },
    { id: 'a3', name: 'Family office Antwerpen', active: false },
  ]);

  const runJob = (source: string) => {
    const newJob: ImportJob = { id: Date.now().toString(), source, status: 'running', count: 0, timestamp: 'Nu bezig...' };
    setJobs(prev => [newJob, ...prev]);
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'done', count: Math.floor(Math.random() * 20) + 5, timestamp: 'Zojuist' } : j));
    }, 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Import</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Leads importeren via Apollo, Phantombuster of CSV</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Apollo Daily Search', desc: 'Haalt 15–25 nieuwe leads op via Apollo filters', icon: Play, source: 'Apollo Daily Search' },
          { title: 'Phantombuster Sync', desc: 'Synchroniseert likes & reacties van actieve organisaties', icon: RefreshCw, source: 'Phantombuster Sync' },
        ].map(item => (
          <div key={item.title} className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
            <button onClick={() => runJob(item.source)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs rounded-lg hover:bg-primary/20 transition-colors">
              <item.icon className="h-3 w-3" /> Start handmatig
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground mb-1">CSV Import</h3>
        <p className="text-xs text-muted-foreground mb-3">Upload een CSV met contacten. Verwachte kolommen: firstName, lastName, company, title, linkedinUrl, email</p>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:border-primary/40 transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Klik om bestand te kiezen of sleep hier naartoe</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">.csv · max 5MB</p>
          <input type="file" accept=".csv" className="hidden" />
        </label>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Apollo zoekopdrachten</h3>
          <button className="text-xs text-primary hover:underline">+ Toevoegen</button>
        </div>
        <div className="space-y-2">
          {apolloSearches.map(s => (
            <div key={s.id} className="flex items-center gap-3 py-2 px-3 bg-secondary/30 rounded-lg">
              <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.active ? 'bg-emerald-400' : 'bg-muted-foreground/30')} />
              <p className="text-xs text-foreground flex-1">{s.name}</p>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', s.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary text-muted-foreground')}>
                {s.active ? 'Actief' : 'Inactief'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Import log</h3>
        </div>
        <div className="divide-y divide-border">
          {jobs.map(job => (
            <div key={job.id} className="flex items-center gap-3 px-4 py-2.5">
              <StatusIcon status={job.status} />
              <p className="text-xs text-foreground flex-1">{job.source}</p>
              {job.status === 'done' && <span className="text-[10px] font-mono text-emerald-400">+{job.count} leads</span>}
              <span className="text-[10px] text-muted-foreground">{job.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
