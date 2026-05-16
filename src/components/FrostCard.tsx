type Props = {
  title: string;
  children: React.ReactNode;
};

export default function FrostCard({ title, children }: Props) {
  return (
    <section className="frost-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
