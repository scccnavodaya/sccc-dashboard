"use client";

import useSWR from "swr";

export type PublicStudent = {
  id: string;
  name: string;
  photo: string | null; // fully-qualified public URL or null
};

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to load students");
    return r.json();
  });

export function usePublicStudents() {
  const { data, error, isLoading, mutate } = useSWR<PublicStudent[]>(
    "/api/public/students",
    fetcher,
    { revalidateOnFocus: true }
  );

  return {
    students: data ?? [],
    isLoading,
    isError: !!error,
    refetch: mutate,
  };
}
