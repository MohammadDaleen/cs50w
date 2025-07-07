import { makeAutoObservable } from "mobx";
import ServiceProvider from "../ServiceProvider.ts";
import { CdsResponse, Post, User, PostsSet, Comment, Dashboard } from "../types/index.ts";
import CdsService from "../cdsService/CdsService.ts";
import { UsersSet } from "../types/UsersSet.ts";

export default class AOUConnectVM {
  // Static service name for registration purposes
  public static readonly serviceName = "AOUConnectVM";

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

  // Posts
  private posts: Map<number, Post> = new Map();
  get Posts() {
    return this.posts;
  }
  set Posts(posts: Map<number, Post>) {
    this.posts = posts;
  }
  private visitedUserPosts: Map<number, Post> = new Map();
  get VisitedUserPosts() {
    return this.visitedUserPosts;
  }
  set VisitedUserPosts(vistedUserPosts: Map<number, Post>) {
    this.visitedUserPosts = vistedUserPosts;
  }
  private followingPosts: Map<number, Post> = new Map();
  public get FollowingPosts() {
    return this.followingPosts;
  }
  public set FollowingPosts(posts: Map<number, Post>) {
    this.followingPosts = posts;
  }
  private announcementsPosts: Map<number, Post> = new Map();
  public get AnnouncementsPosts() {
    return this.announcementsPosts;
  }
  public set AnnouncementsPosts(posts: Map<number, Post>) {
    this.announcementsPosts = posts;
  }

  private currentPost: Post | undefined = undefined;
  public get CurrentPost() {
    return this.currentPost;
  }
  public set CurrentPost(currentPost: Post | undefined) {
    this.currentPost = currentPost;
  }

  // TODO: maybe needs better structure/representation*
  // Pagination state for main page
  private postSetNumber: number = 1;
  public get PostSetNumber() {
    return this.postSetNumber;
  }
  public set PostSetNumber(postSetNumber: number) {
    this.postSetNumber = postSetNumber;
  }
  private hasMorePosts: boolean = true;
  public get HasMorePosts() {
    return this.hasMorePosts;
  }
  public set HasMorePosts(hasMorePosts: boolean) {
    this.hasMorePosts = hasMorePosts;
  }
  // Pagination state for profile page
  private visitedUserPostSetNumber: number = 1;
  public get VisitedUserPostSetNumber() {
    return this.visitedUserPostSetNumber;
  }
  public set VisitedUserPostSetNumber(visitedUserPostSetNumber: number) {
    this.visitedUserPostSetNumber = visitedUserPostSetNumber;
  }
  private hasMoreVisitedUserPosts: boolean = true;
  public get HasMoreVisitedUserPosts() {
    return this.hasMoreVisitedUserPosts;
  }
  public set HasMoreVisitedUserPosts(visitedUserHasMorePosts: boolean) {
    this.hasMoreVisitedUserPosts = visitedUserHasMorePosts;
  }
  // Pagination state for following page
  private followingPostSetNumber: number = 1;
  public get FollowingPostSetNumber() {
    return this.followingPostSetNumber;
  }
  public set FollowingPostSetNumber(followingPostSetNumber: number) {
    this.followingPostSetNumber = followingPostSetNumber;
  }
  private hasMoreFollowingPosts: boolean = true;
  public get HasMoreFollowingPosts() {
    return this.hasMoreFollowingPosts;
  }
  public set HasMoreFollowingPosts(hasMoreFollowingPosts: boolean) {
    this.hasMoreFollowingPosts = hasMoreFollowingPosts;
  }
  // Pagination state for announcements page
  private announcementsPostSetNumber: number = 1;
  public get AnnouncementsPostSetNumber() {
    return this.announcementsPostSetNumber;
  }
  public set AnnouncementsPostSetNumber(n: number) {
    this.announcementsPostSetNumber = n;
  }
  private hasMoreAnnouncementsPosts: boolean = true;
  public get HasMoreAnnouncementsPosts() {
    return this.hasMoreAnnouncementsPosts;
  }
  public set HasMoreAnnouncementsPosts(v: boolean) {
    this.hasMoreAnnouncementsPosts = v;
  }

  // Comments
  // Use Record to map each post's id (number) to an array of Comment objects.
  private comments: Record<number, Comment[]> = {};

  // Getter for comments of a specific post.
  public GetComments(postId: number): Comment[] | undefined {
    return this.comments[postId];
  }

  // Dashboard
  private dashboard: Dashboard | undefined = undefined;
  public get Dashboard() {
    return this.dashboard;
  }
  public set Dashboard(dashboard: Dashboard | undefined) {
    this.dashboard = dashboard;
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

  // TODO: Remove if not needed
  // private clearData() {
  //   this.VisitedUser = undefined;
  //   this.Posts.clear();
  //   this.VisitedUserPosts.clear();
  //   this.FollowingPosts.clear();
  //   this.AnnouncementsPosts.clear();
  //   this.CurrentPost = undefined;
  //   this.PostSetNumber = 1;
  //   this.HasMorePosts = true;
  //   this.VisitedUserPostSetNumber = 1;
  //   this.HasMoreVisitedUserPosts = true;
  //   this.FollowingPostSetNumber = 1;
  //   this.HasMoreFollowingPosts = true;
  //   this.AnnouncementsPostSetNumber = 1;
  //   this.HasMoreAnnouncementsPosts = true;
  //   this.Dashboard = undefined;
  // }

  public async FetchMainPage(postSetNumber: number) {
    await this.fetchPosts(postSetNumber);
  }

  public async FetchProfilePage(username: string, postSetNumber: number) {
    await this.fetchUser(username);
    if (!(this.VisitedUser?.username === username)) {
      return;
    }
    await this.fetchPosts(postSetNumber, this.VisitedUser.username);
  }

  private async fetchUser(username: string) {
    const res: CdsResponse<User> = await this.cdsService.FetchUser(username, this.GetToken());
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.VisitedUser = res.data;
  }

  private async fetchPosts(postSetNumber: number, username?: string) {
    const res: CdsResponse<PostsSet> = await this.cdsService.FetchPosts(postSetNumber, username, this.GetToken());
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    if (username) {
      this.VisitedUserPosts = res.data.posts;
      this.VisitedUserPostSetNumber = postSetNumber;
      this.HasMoreVisitedUserPosts = res.data.next ? true : false;
    } else {
      this.Posts = res.data.posts;
      this.PostSetNumber = postSetNumber;
      this.HasMorePosts = res.data.next ? true : false;
    }
  }

  /**
   * Fetch paginated announcements (announcer posts).
   */
  public async FetchAnnouncementsPosts(postSetNumber: number) {
    const res: CdsResponse<PostsSet> = await this.cdsService.FetchAnnouncementsPosts(postSetNumber, this.GetToken());
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.AnnouncementsPosts = res.data.posts;
    this.AnnouncementsPostSetNumber = postSetNumber;
    this.HasMoreAnnouncementsPosts = !!res.data.next;
  }

  public async FetchCurrentPost(postId: number) {
    const post = await this.fetchPost(postId);
    if (post) {
      this.CurrentPost = post;
    }
  }

  private async fetchPost(postId: number): Promise<Post | undefined> {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.FetchPost(token, postId);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    return res.data;
  }

  public async Post(postContent: string, imageFile?: File) {
    // Logic to submit the new post to the server
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const formData = new FormData();
    formData.append("post", postContent);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    // Call the service method that handles FormData uploads.
    const res = await this.cdsService.Post(token, formData);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Add the new post to the front of the Posts Map (a Map is an array of arrays)
    this.Posts = new Map([
      // Add the new post as the first entry in the Map
      [res.data.id, res.data], // Key: post ID (string), Value: post data
      // Spread the existing Posts entries after the new post
      ...this.Posts, // This maintains the original insertion order of remaining posts
    ]);
  }

  public async Follow(username: string, isVisited: boolean = true) {
    // Ensure the visited username is the same as the one we are trying to follow
    if (isVisited && this.VisitedUser?.username !== username) {
      this.SetError("Requested user is not same as visted user in VM");
      return;
    }
    const token = this.GetToken();
    if (!token) {
      console.warn("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.Follow(token, username);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Add the new post to the front of the Posts array
    if (!this.User) {
      this.SetError("Could not find user data in VM");
      return;
    }
    const followeeUsername: string = res.data.username;
    const isFollowee: boolean = res.data.isFollowee;
    // Ensure the user is now following `followeeUsername`.
    if (isFollowee) {
      // Add followeeUsername to the current user's followees array (if not already there).
      if (!this.User.userFollowees.includes(followeeUsername)) {
        this.User.userFollowees.push(followeeUsername);
      }
      // On the visited user, add the current user as a follower (if not already).
      if (isVisited && this.VisitedUser && !this.VisitedUser.userFollowers.includes(this.User.username)) {
        this.VisitedUser.userFollowers.push(this.User.username);
      }
    } else {
      // The user just unfollowed `followeeUsername`.
      // Remove followeeUsername from the current user's followees array (if it exists).
      const index = this.User.userFollowees.indexOf(followeeUsername);
      if (index !== -1) {
        this.User.userFollowees.splice(index, 1);
      }
      if (isVisited && this.VisitedUser) {
        // Remove the current user from the visited user's followers array (if present).
        const followerIndex = this.VisitedUser.userFollowers.indexOf(this.User.username);
        if (followerIndex !== -1) {
          this.VisitedUser.userFollowers.splice(followerIndex, 1);
        }
      }
    }
  }

  public async FetchFollowingPosts(postSetNumber: number) {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res: CdsResponse<PostsSet> = await this.cdsService.FetchFollowingPosts(token, postSetNumber);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.FollowingPosts = res.data.posts;
    this.FollowingPostSetNumber = postSetNumber;
    this.HasMoreFollowingPosts = res.data.next ? true : false;
  }

  /**
   * Delete a post and remove it from all Maps.
   */
  public async DeletePost(postId: number): Promise<void> {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.DeletePost(token, postId);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Remove the post from all Maps if it exists.
    this.Posts.delete(postId);
    this.VisitedUserPosts.delete(postId);
    this.FollowingPosts.delete(postId);
    // Remove the current post if it is the deleted post
    if (this.CurrentPost?.id === postId) this.CurrentPost = undefined;
  }

  public async EditPost(postId: number, newContent: string) {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.EditPost(token, postId, newContent);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Update the post in the Maps if it is found
    if (this.posts.has(postId)) this.posts.set(postId, res.data);
    if (this.visitedUserPosts.has(postId)) this.visitedUserPosts.set(postId, res.data);
    if (this.followingPosts.has(postId)) this.followingPosts.set(postId, res.data);
    // Update the post in CurrentPost if it is the same post
    if (this.CurrentPost?.id === postId) this.CurrentPost = res.data;
  }

  public async ToggleLike(postId: number) {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.ToggleLike(token, postId);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Update the post in the Maps if it is found
    if (this.posts.has(postId)) this.posts.set(postId, res.data);
    if (this.visitedUserPosts.has(postId)) this.visitedUserPosts.set(postId, res.data);
    if (this.followingPosts.has(postId)) this.followingPosts.set(postId, res.data);
    if (this.AnnouncementsPosts.has(postId)) this.AnnouncementsPosts.set(postId, res.data);
    if (this.dashboard?.top_posts.has(postId)) this.dashboard.top_posts.set(postId, res.data);
    // Update the post in CurrentPost if it is the same post
    if (this.CurrentPost?.id === postId) this.CurrentPost = res.data;
  }

  // Function to open the file explorer so the user can select an image file,
  // and then return a Promise that resolves with the selected File (or undefined if cancelled).
  public OpenFileExplorer(): Promise<File | undefined> {
    return new Promise((resolve) => {
      // Create an input element dynamically
      const input = document.createElement("input");
      // Set the input type to 'file' to enable file selection
      input.type = "file";
      // Restrict the selection to image files only
      input.accept = "image/*";
      // Define the onchange event handler, which is triggered when a file is selected
      input.onchange = () => {
        // Retrieve the first selected file (if any)
        const file = input.files?.[0];
        // Resolve the promise with the selected file (or undefined if no file is selected)
        resolve(file);
      };
      // Define the oncancel event handler, which is triggered if the user cancels the selection
      input.oncancel = () => {
        // Resolve the promise with undefined to indicate that no file was selected
        resolve(undefined);
      };
      // Programmatically click the input element to open the file explorer
      input.click();
    });
  }

  // Method to post a comment using the CDS service
  public async PostComment(postId: number, content: string) {
    // Check for authentication token
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    // Call the service to post the comment
    const res = await this.cdsService.PostComment(token, postId, content);
    if (res.error) {
      // Set error message if posting fails
      this.SetError(res.error.message);
      return;
    }
    // Retrieve existing comments for the post; initialize an empty array if not found.
    const existingComments = this.comments[postId] || [];
    // Update the comments record by prepending the new comment.
    this.comments[postId] = [res.data, ...existingComments];
  }

  // Method to fetch comments for a given post using the CDS service
  public async FetchComments(postId: number) {
    // Check for authentication token
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    // Call the service to fetch comments
    const res = await this.cdsService.FetchComments(token, postId);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Save the fetched comments in the postComments Record.
    this.comments[postId] = res.data;
  }

  public async UploadProfilePicture(file: File) {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.UploadProfilePicture(token, file);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Update the profile picture of the user
    if (this.User) this.User.profilePicture = res.data.profilePicture;
    if (this.VisitedUser) this.VisitedUser = res.data;
    // Update the profile picture of the user on thier posts
    if (this.VisitedUserPosts && this.VisitedUserPosts.size > 0)
      this.VisitedUserPosts.forEach((post) => {
        post.poster.profilePicture = res.data.profilePicture;
      });
    if (this.Posts && this.Posts.size > 0) {
      this.Posts.forEach((post) => {
        if (post.poster.id === res.data.id) post.poster.profilePicture = res.data.profilePicture;
      });
    }
    if (this.FollowingPosts && this.FollowingPosts.size > 0) {
      this.FollowingPosts.forEach((post) => {
        if (post.poster.id === res.data.id) post.poster.profilePicture = res.data.profilePicture;
      });
    }
  }

  public async RemoveProfilePicture() {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res = await this.cdsService.RemoveProfilePicture(token);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    // Update the profile picture of the user
    if (this.User) {
      this.User.profilePicture = res.data.profilePicture;
    }
    if (this.VisitedUser) this.VisitedUser = res.data;
    // Update the profile picture of the user on thier posts
    if (this.VisitedUserPosts && this.VisitedUserPosts.size > 0)
      this.VisitedUserPosts.forEach((post) => {
        post.poster.profilePicture = res.data.profilePicture;
      });
    if (this.Posts && this.Posts.size > 0) {
      this.Posts.forEach((post) => {
        if (post.poster.id === res.data.id) post.poster.profilePicture = res.data.profilePicture;
      });
    }
    if (this.FollowingPosts && this.FollowingPosts.size > 0) {
      this.FollowingPosts.forEach((post) => {
        if (post.poster.id === res.data.id) post.poster.profilePicture = res.data.profilePicture;
      });
    }
  }

  public async FetchFollowers(username: string, page: number, search?: string): Promise<UsersSet | undefined> {
    if (this.VisitedUser?.username !== username) await this.fetchUser(username);
    if (this.VisitedUser?.username !== username) return;
    const res = await this.cdsService.FetchFollowers(this.VisitedUser.username, page, search, this.GetToken());
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    return res.data;
  }

  public async FetchFollowees(username: string, page: number, search?: string): Promise<UsersSet | undefined> {
    if (this.VisitedUser?.username !== username) await this.fetchUser(username);
    if (this.VisitedUser?.username !== username) return;
    const res = await this.cdsService.FetchFollowees(this.VisitedUser.username, page, search, this.GetToken());
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    return res.data;
  }

  // Method to fetch dashboard data
  public async FetchDashboard(timeframe: "day" | "week" | "month" | "lifetime"): Promise<void> {
    const token = this.GetToken();
    if (!token) {
      this.SetError("No token found, user is not authenticated");
      return;
    }
    const res: CdsResponse<Dashboard> = await this.cdsService.FetchDashboard(token, timeframe);
    if (res.error) {
      this.SetError(res.error.message);
      return;
    }
    this.Dashboard = res.data;
  }
}
