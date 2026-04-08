import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

export default function ConfigPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuratie</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Scoring, keywords en veld mappings</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-secondary/40 flex items-center justify-center">
          <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-foreground font-medium">Binnenkort beschikbaar</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          De configuratiepagina voor scoring parameters, keywords en HubSpot veld mappings wordt binnenkort toegevoegd.
        </p>
      </div>
    </motion.div>
  );
}
