import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FieldError from "./field-error";

/** The frame of one template section: title, instructions, section-wide errors, then its body. */
export default function SectionCard({
  id,
  title,
  instructions,
  errors,
  children,
}: {
  id: string;
  title: string;
  instructions?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <Card id={`section-${id}`} aria-labelledby={`section-${id}-title`} role="region">
      <CardHeader>
        <CardTitle id={`section-${id}-title`} className="type-section-title">
          {title}
        </CardTitle>
        {instructions && <CardDescription className="whitespace-pre-line">{instructions}</CardDescription>}
        {errors?.map((message, index) => <FieldError key={index} message={message} />)}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">{children}</CardContent>
    </Card>
  );
}
