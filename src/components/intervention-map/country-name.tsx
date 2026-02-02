"use client";

interface CountryNameProps {
  name: string;
}

export function CountryName({ name }: CountryNameProps) {
  return (
    <h1 className="text-lg md:text-lg font-semibold text-left">
      {name}
    </h1>
  );
}
