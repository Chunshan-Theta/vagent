declare global {
  type RouteContext<PT> = {
    params: Promise<PT>;
  }
}
export {}