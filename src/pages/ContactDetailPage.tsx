import { useParams } from 'react-router-dom';

export default function ContactDetailPage() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Detail</h1>
      <p className="text-muted-foreground">Viewing contact: {id}</p>
    </div>
  );
}
