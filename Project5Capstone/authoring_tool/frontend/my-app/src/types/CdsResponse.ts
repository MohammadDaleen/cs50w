export type CdsResponse<T = void> = { data: T; error?: never } | { data?: never; error: Error };
