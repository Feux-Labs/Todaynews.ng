import { redirect } from "next/navigation";

interface NewsRedirectProps {
  params: {
    slug: string;
  };
}

export default function NewsSlugRedirect({ params }: NewsRedirectProps) {
  redirect(`/article/${params.slug}`);
}
