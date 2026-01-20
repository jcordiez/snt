"use client";

interface CountryNameProps {
  name: string;
}

export function CountryName({ name }: CountryNameProps) {
  return (
    <h1 className="text-2xl md:text-3xl font-semibold text-left">
      {name}
    </h1>
  );
}
