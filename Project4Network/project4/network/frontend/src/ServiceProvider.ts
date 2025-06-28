export default class ServiceProvider {
  private services = new Map();
  get<T = unknown>(serviceName: string): T {
    if (this.services.has(serviceName)) return this.services.get(serviceName);
    else throw new Error("Service '" + serviceName + " not registered in ServiceProvider");
  }
  // let register take an optional type parameter
  register<T = unknown>(serviceName: string, service: T) {
    this.services.set(serviceName, service);
  }
}
