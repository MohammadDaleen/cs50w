import type { CdsResponse, User } from "../types";

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
}
