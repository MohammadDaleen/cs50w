import { makeAutoObservable } from "mobx";
import ServiceProvider from "../ServiceProvider.ts";
import type { CdsResponse, User } from "../types/index.ts";
import CdsService from "../cdsService/CdsService.ts";

export default class AuthoringToolVM {
  // Static service name for registration purposes
  public static readonly serviceName = "AuthoringToolVM";

  // Dependencies and context
  public serviceProvider: ServiceProvider;
  public cdsService: CdsService;

  // State and error handling
  private errorMessage?: string = undefined;
  get ErrorMessage() {
    return this.errorMessage;
  }
  private set ErrorMessage(value: string | undefined) {
    this.errorMessage = value;
  }

  private pcfError?: string = undefined;
  get PcfError() {
    return this.pcfError;
  }
  private set PcfError(value: string | undefined) {
    this.pcfError = value;
  }

  // Function to force a UI update (should be set by the consumer)
  // *TODO: public forceUpdate: () => void;
  public forceUpdate: (() => void) | undefined;

  // General Loading indicator
  private isLoading: boolean = false;
  public get IsLoading() {
    return this.isLoading;
  }
  public set IsLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }

  private isLightMode: boolean = false;
  public get IsLightMode() {
    this.isLightMode = localStorage.getItem("isLightMode") === "true" ? true : false;
    return this.isLightMode;
  }
  private set IsLightMode(mode: boolean) {
    if (mode) {
      localStorage.setItem("isLightMode", "true");
      this.isLightMode = true;
    } else {
      localStorage.removeItem("isLightMode");
      this.isLightMode = false;
    }
  }
  public ToggleIsLightMode() {
    this.IsLightMode = !this.IsLightMode;
  }

  // TODO: Do you really need a User and a Token ?*
  private user?: User = undefined;
  get User() {
    return this.user;
  }
  set User(user: User | undefined) {
    this.user = user;
  }
  private visitedUser?: User = undefined;
  get VisitedUser() {
    return this.visitedUser;
  }
  set VisitedUser(visitedUser: User | undefined) {
    this.visitedUser = visitedUser;
  }

  constructor(serviceProvider: ServiceProvider) {
    // Initialize dependencies and context
    this.serviceProvider = serviceProvider;
    this.cdsService = serviceProvider.get(CdsService.serviceName);
    // Make this class observable for MobX
    makeAutoObservable(this);
    this.init();
  }

  /**
   * Sets a general application error.
   * @param errorMessage The error message to set.
   */
  public SetAppError(errorMessage: string | undefined) {
    this.PcfError = errorMessage;
    if (this.forceUpdate) this.forceUpdate();
  }

  // *TODO: make the error an array of errors rather than a string
  /**
   * Sets an error message specific to content operations.
   * @param errorMessage The error message to set.
   */
  public SetError(errorMessage: string | undefined) {
    this.ErrorMessage = errorMessage;
    if (errorMessage) console.error(errorMessage);
    if (this.forceUpdate) this.forceUpdate();
  }

  // User Authentication's Token
  public GetToken() {
    return localStorage.getItem("token") || undefined;
  }
  public SetToken(token: string | undefined) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }

  public async init() {
    this.IsLoading = true;
    const token = this.GetToken();
    if (!token) {
      console.warn("No token found, user is not authenticated");
      this.IsLoading = false;
      return;
    }
    await this.checkAuthStatus(token);
    this.IsLoading = false;
  }

  private async checkAuthStatus(token: string) {
    const res: CdsResponse<User> = await this.cdsService.CheckAuthStatus(token);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.User = res.data;
  }

  public async Register(registerState: { username: string; email: string; password: string; confirmPassword: string }) {
    if (registerState.password !== registerState.confirmPassword) {
      const message = "Passwords must match.";
      this.SetError(message);
      return;
    }
    const res: CdsResponse<User> = await this.cdsService.Register(
      registerState.username,
      registerState.email,
      registerState.password
    );
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.User = res.data;
    this.SetToken(res.data.token);
  }

  public async Login(username: string, password: string) {
    const res: CdsResponse<User> = await this.cdsService.Login(username, password);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.User = res.data;
    this.SetToken(res.data.token);
  }

  public async Logout() {
    const token = this.GetToken();
    if (!token) {
      console.warn("No token found, user is not authenticated");
      return;
    }
    const res: CdsResponse<void> = await this.cdsService.Logout(token);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.SetToken(undefined);
    this.User = undefined;
  }
}
