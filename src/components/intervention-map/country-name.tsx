"use client";

interface CountryNameProps {
  name: string;
}

export function CountryName({ name }: CountryNameProps) {
  return (
    <h1 className="text-lg md:text-xl font-medium text-left text-primary">
      {name}
    </h1>
  );
}
