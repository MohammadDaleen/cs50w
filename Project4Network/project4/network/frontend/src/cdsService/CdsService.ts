import { CdsResponse, Post, User, PostsSet, Comment, Dashboard } from "../types";
import { UsersSet } from "../types/UsersSet";

export default class CdsService {
  public static readonly serviceName = "CdsService";
  private readonly apiUrl = "http://localhost:8000";

  public async Register(username: string, email: string, password: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        // Handle and display error messages dynamically for all fields
        const errorMessages = Object.keys(data).map((field) => {
          return `${data[field].join(", ")}`;
        });
        return {
          error: Error(
            (errorMessages.length > 0 && errorMessages.join(" | ")) || "Error registering the user: Response is not ok"
          ),
        };
      }
    } catch (error: any) {
      console.error("Error registering the user:", error);
      return { error: Error("Error registering the user") };
    }
  }

  public async Login(username: string, password: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        return { error: Error(data.message || "Error logging in: Response is not ok") };
      }
    } catch (error: any) {
      console.error("Error logging in:", error);
      return { error: Error("Error logging in") };
    }
  }

  public async Logout(token: string): Promise<CdsResponse<void>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/logout`, {
        method: "POST",
        credentials: "include", // Send cookies for session management
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: undefined };
      } else {
        return {
          error: Error((data.detail && `Logout failed: ${data.detail}`) || "Error logging out: Response is not ok"),
        };
      }
    } catch (error: any) {
      console.error("Error logging out:", error);
      return { error: Error("Error logging out") };
    }
  }

  public async CheckAuthStatus(token: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        const user: User = {
          ...data.user,
          token: data.token,
          isAuthenticated: true,
        };
        return { data: user };
      } else {
        return { error: Error("Unable to check authentication status, Token invalid or expired") };
      }
    } catch (error: any) {
      console.error("Error checking authentication:", error);
      return { error: Error("Error checking authentication") };
    }
  }

  public async FetchUser(username: string, token?: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}), // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: data.user };
      } else {
        return { error: Error(data.message || `Error fetching user (${username}): Response is not ok`) };
      }
    } catch (error: any) {
      console.error(`Error fetching user (${username}):`, error);
      return { error: Error(`Error fetching user (${username})`) };
    }
  }

  public async FetchPosts(page: number, username?: string, token?: string): Promise<CdsResponse<PostsSet>> {
    // Build the URL.
    let url = `${this.apiUrl}/api/posts`;
    const params: string[] = [];
    params.push(`page=${page}`);
    if (username) {
      params.push(`username=${encodeURIComponent(username)}`);
    }
    url += `?${params.join("&")}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          // Do not set Content-Type when sending FormData;
          // the browser will set it with the correct boundary.
          // "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}), // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        const postsMap = new Map<number, Post>();
        data.results.posts.forEach((post: Post) => {
          postsMap.set(post.id, post);
        });
        const postsSet: PostsSet = {
          count: data.count,
          next: data.next,
          previous: data.previous,
          posts: postsMap,
        };
        return { data: postsSet };
      } else {
        return { error: Error(data.message || "Error fetching posts: Response is not ok") };
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      return { error: Error("Error fetching posts") };
    }
  }

  /**
   * Fetch posts created by announcer users only.
   */
  public async FetchAnnouncementsPosts(page: number, token?: string): Promise<CdsResponse<PostsSet>> {
    const url = `${this.apiUrl}/api/announcements?page=${page}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: Error(data.message || "Error fetching announcements") };
      }
      const postsMap = new Map<number, Post>();
      data.results.posts.forEach((p: Post) => postsMap.set(p.id, p));
      return {
        data: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          posts: postsMap,
        },
      };
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      return { error: Error("Error fetching announcements") };
    }
  }

  public async FetchPost(token: string, postId: number): Promise<CdsResponse<Post>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/post/${postId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: data.post };
      } else {
        return { error: Error(data.message || "Error fetching post") };
      }
    } catch (error: any) {
      console.error("Error fetching post:", error);
      return { error: Error("Error fetching post") };
    }
  }

  public async Post(token: string, formData: FormData): Promise<CdsResponse<Post>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/post`, {
        method: "POST",
        headers: {
          // Do not set Content-Type when sending FormData;
          // the browser will set it with the correct boundary.
          // "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const post: Post = {
          ...data.post,
        };
        return { data: post };
      } else {
        const data = await res.json();
        return { error: Error(data.message) };
      }
    } catch (error: any) {
      console.error("Error publishing post:", error);
      return { error: Error("Error publishing post") };
    }
  }

  public async Follow(
    token: string,
    username: string
  ): Promise<CdsResponse<{ username: string; isFollowee: boolean }>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Attach the token in the Authorization header
        },
        body: JSON.stringify({
          username,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { data: data.followee };
      } else {
        const data = await res.json();
        return { error: Error(data.message) };
      }
    } catch (error: any) {
      console.error("Error follow user (${username}):", error);
      return { error: Error("Error follow user (${username})") };
    }
  }

  public async FetchFollowingPosts(token: string, page: number): Promise<CdsResponse<PostsSet>> {
    let url = `${this.apiUrl}/api/following`;
    url += `?page=${page}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const postsMap = new Map<number, Post>();
        data.results.posts.forEach((post: Post) => {
          postsMap.set(post.id, post);
        });
        const postsSet: PostsSet = {
          count: data.count,
          next: data.next,
          previous: data.previous,
          posts: postsMap,
        };
        return { data: postsSet };
      } else {
        return { error: Error(data.message || "Error fetching following posts") };
      }
    } catch (error: any) {
      console.error("Error fetching following posts:", error);
      return { error: Error("Error fetching following posts") };
    }
  }

  public async DeletePost(token: string, postId: number): Promise<CdsResponse<void>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/post/${postId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: undefined };
      } else {
        return { error: Error(data.message || "Error deleting post") };
      }
    } catch (error: any) {
      console.error("Error deleting post:", error);
      return { error: Error("Error deleting post") };
    }
  }

  public async EditPost(token: string, postId: number, content: string): Promise<CdsResponse<Post>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/post/${postId}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        return { data: data.post };
      } else {
        return { error: Error(data.message || "Error updating post") };
      }
    } catch (error: any) {
      console.error("Error updating post:", error);
      return { error: Error("Error updating post") };
    }
  }

  public async ToggleLike(token: string, postId: number): Promise<CdsResponse<Post>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/post/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        return { data: data.post };
      } else {
        return { error: Error(data.message || "Error toggling like") };
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      return { error: Error("Error toggling like") };
    }
  }

  // Method to post a new comment for a given post
  public async PostComment(token: string, postId: number, content: string): Promise<CdsResponse<Comment>> {
    try {
      // Call the backend endpoint to post a comment
      const response = await fetch(`${this.apiUrl}/api/post/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (response.ok) {
        // Return the comment from the response (expected in data.comment)
        return { data: data.comment };
      } else {
        // Return an error with a message from the backend or a default message
        return { error: Error(data.message || "Error posting comment") };
      }
    } catch (error: any) {
      console.error("Error posting comment:", error);
      return { error: Error("Error posting comment") };
    }
  }

  // Method to fetch all comments for a given post
  public async FetchComments(token: string, postId: number): Promise<CdsResponse<Comment[]>> {
    try {
      // Call the backend endpoint to retrieve comments
      const response = await fetch(`${this.apiUrl}/api/post/${postId}/comments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Return the array of comments from data.comments
        return { data: data.comments };
      } else {
        return { error: Error(data.message || "Error fetching comments") };
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      return { error: Error("Error fetching comments") };
    }
  }

  public async UploadProfilePicture(token: string, file: File): Promise<CdsResponse<User>> {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await fetch(`${this.apiUrl}/api/profile-picture/upload`, {
        method: "POST",
        headers: {
          // Do not set Content-Type header; browser will add multipart boundary.
          Authorization: `Token ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        return { data: data.user };
      } else {
        return { error: Error(data.message || "Error uploading profile picture") };
      }
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      return { error: Error("Error uploading profile picture") };
    }
  }

  public async RemoveProfilePicture(token: string): Promise<CdsResponse<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/profile-picture/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { data: data.user };
      } else {
        return { error: Error(data.message || "Error removing profile picture") };
      }
    } catch (error: any) {
      console.error("Error removing profile picture:", error);
      return { error: Error("Error removing profile picture") };
    }
  }

  public async FetchFollowers(
    username: string,
    page: number,
    search?: string,
    token?: string
  ): Promise<CdsResponse<UsersSet>> {
    try {
      const url =
        `${this.apiUrl}/api/${username}/followers?page=${page}` +
        (search ? `&search=${encodeURIComponent(search)}` : "");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}), // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        const usersSet: UsersSet = {
          count: data.count,
          next: data.next,
          previous: data.previous,
          users: data.results.users,
        };
        return { data: usersSet };
      } else {
        return { error: Error(data.message || "Error fetching followers") };
      }
    } catch (error: any) {
      console.error("Error fetching followers:", error);
      return { error: Error("Error fetching followers") };
    }
  }

  public async FetchFollowees(
    username: string,
    page: number,
    search?: string,
    token?: string
  ): Promise<CdsResponse<UsersSet>> {
    try {
      const url =
        `${this.apiUrl}/api/${username}/followees?page=${page}` +
        (search ? `&search=${encodeURIComponent(search)}` : "");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}), // Attach the token in the Authorization header
        },
      });
      const data = await response.json();
      if (response.ok) {
        const usersSet: UsersSet = {
          count: data.count,
          next: data.next,
          previous: data.previous,
          users: data.results.users,
        };
        return { data: usersSet };
      } else {
        return { error: Error(data.message || "Error fetching followees") };
      }
    } catch (error: any) {
      console.error("Error fetching followees:", error);
      return { error: Error("Error fetching followees") };
    }
  }

  // Function to fetch admin dashboard data
  public async FetchDashboard(
    token: string,
    timeframe: "day" | "week" | "month" | "lifetime"
  ): Promise<CdsResponse<Dashboard>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/admin/dashboard?timeframe=${timeframe}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const newUsersMap = new Map<number, User>();
        data.new_users.forEach((user: User) => {
          newUsersMap.set(user.id, user);
        });
        const activeUsersMap = new Map<number, User>();
        data.active_users.forEach((user: User) => {
          activeUsersMap.set(user.id, user);
        });
        const recentPostsMap = new Map<number, Post>();
        data.recent_posts.forEach((post: Post) => {
          recentPostsMap.set(post.id, post);
        });
        const topPostsMap = new Map<number, Post>();
        data.top_posts.forEach((post: Post) => {
          topPostsMap.set(post.id, post);
        });
        const topPostersMap = new Map<number, User & { post_count: number }>();
        data.top_posters.forEach((user: User & { post_count: number }) => {
          topPostersMap.set(user.id, user);
        });
        const dashboard: Dashboard = {
          new_users: newUsersMap,
          active_users: activeUsersMap,
          recent_posts: recentPostsMap,
          top_posts: topPostsMap,
          top_posters: topPostersMap,
        };
        return { data: dashboard };
      } else {
        return { error: new Error(data.message || "Error fetching dashboard data") };
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return { error: new Error("Error fetching dashboard data") };
    }
  }
}
