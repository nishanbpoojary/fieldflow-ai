interface SectionHeadingProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function SectionHeading({
  title,
  description,
  eyebrow,
}: SectionHeadingProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
