import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p className="text-4xl font-bold text-muted-foreground/20">404</p>
      <p className="text-sm text-muted-foreground">Pagina niet gevonden</p>
      <Link to="/" className="text-xs text-primary hover:underline">Terug naar briefing</Link>
    </div>
  );
}
