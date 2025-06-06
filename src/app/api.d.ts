declare global {
  type AsyncRouteContext<PT> = {
    params: Promise<PT>;
  }
}
export {}