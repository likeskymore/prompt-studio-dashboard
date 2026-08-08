import { LucideIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  icon: LucideIcon;
  href: string;
};

export default function NavCard({ title, icon: Icon, href }: Props) {
  return (
    <Link
      href={href}
      className="
        h-40
        border-2
        border-border
        rounded-lg
        flex
        flex-col
        items-center
        justify-center
        hover:bg-accent
        hover:text-accent-foreground
        cursor-pointer
      "
    >
      <Icon className="h-10 w-10" />

      <h2 className="text-xl mt-4">
        {title}
      </h2>
    </Link>
  );
}