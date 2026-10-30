"use client"

import { useState, ChangeEvent } from "react";
import { DELAY, LIMIT_DEFAULT, PAGE_DEFAULT } from "@/constants/params-constant";
import useDebounce from "./use-debounce";


export function useChangeParams() {
  const debounce = useDebounce();

  const [limit, setLimit] = useState<string>(LIMIT_DEFAULT.toString());
  const [page, setPage] = useState<string>(PAGE_DEFAULT);
  const [search, setSearch] = useState<string>("");

  const handlePageChanged = (nextPage: string) => {
    setPage(nextPage);
  };

  const handleLimitChanged = (nextLimit: string) => {
    setLimit(nextLimit);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    debounce(() => {
      setSearch(e.target.value);
    }, DELAY);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  return {
    queryLimit: limit,
    queryPage: page,
    querySearch: search,
    setLimit,
    setPage,
    setSearch,
    handlePageChanged,
    handleLimitChanged,
    handleSearch,
    handleClearSearch,
  };
}