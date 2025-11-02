import React, { useEffect } from "react";
import { Button } from "@fluentui/react-components";
import { LockClosedRegular, DocumentRegular, FolderRegular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { Iridescence } from ".";

/**
 * A self-contained landing page component for unauthenticated users,
 * using Fluent UI for buttons and icons.
 *
 * It includes scroll-based fade-in animations managed by a useEffect hook.
 */
export const LandingPage: React.FC = () => {
  // This useEffect hook sets up the scroll-based animations.
  useEffect(() => {
    // 1. Define styles for the animation
    const styleId = "landing-page-animation-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `fsection className="py-5 text-center
        /* On-scroll fade-in-up animation setup */
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            will-change: opacity, transform;
        }
        .scroll-animate.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }
    // 2. Set up the IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 /* Trigger when 10% of the element is visible */ }
    );
    // 3. Observe all elements with the .scroll-animate class
    const animatedElements = document.querySelectorAll(".scroll-animate");
    animatedElements.forEach((el) => observer.observe(el));
    // 4. Cleanup function to remove observer
    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
      const styleElement = document.getElementById(styleId);
      if (styleElement) styleElement.remove(); // remove styles on unmount
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <main className="w-100 bg-white">
      {/* =========== Hero Section =========== */}
      <section className="py-5 text-center position-relative overflow-hidden">
        <Iridescence
          shaderColor={[0.95, 0.91, 1.0]} // Changed from white to be visible
          mouseReact={false}
          amplitude={0.1}
          speed={0.4}
          zoom={1.8}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 0, // Sit behind the content
          }}
        ></Iridescence>
        <div className="container py-md-5 position-relative" style={{ zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Logo */}
              <img
                src="/assets/fuse-docs-logo.png"
                alt="FuseDocs Logo"
                className="mb-4 scroll-animate"
                style={{ height: "128px", width: "auto" }}
              />
              <h1 className="display-4 fw-bold text-dark mb-3 scroll-animate" style={{ animationDelay: "100ms" }}>
                Welcome to FuseDocs
              </h1>
              <p className="fs-5 text-muted mb-4 scroll-animate" style={{ animationDelay: "200ms" }}>
                Your central hub for managing and viewing all your important files. Please log in to access your secure
                workspace.
              </p>
              <div className="scroll-animate" style={{ animationDelay: "300ms" }}>
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Button appearance="primary" size="large">
                    Get Started
                  </Button>
                </Link>
                <Button as="a" href="#features" size="large" appearance={"secondary"} style={{ marginLeft: "8px" }}>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* =========== Features Section =========== */}
      <section id="features" className="py-5 bg-white">
        <div className="container py-md-5">
          <div className="text-center mx-auto mb-5 scroll-animate" style={{ maxWidth: "500px" }}>
            <h2 className="display-5 fw-bold text-dark mb-3">Your Application, Your Files</h2>
            <p className="fs-5 text-muted">
              This application provides the core tools you need to organize and access your documents.
            </p>
          </div>
          {/* Responsive grid: 1 col on mobile, 3 on desktop */}
          <div className="row g-4">
            {/* Feature 1: Document Manager */}
            <div className="col-md-4 scroll-animate">
              <div className="card h-100 shadow-sm border-0 p-3">
                <div className="card-body text-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-3 mb-3"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <FolderRegular fontSize={32} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">Document Manager</h3>
                  <p className="text-muted">A centralized place to see and manage all of your files and projects.</p>
                </div>
              </div>
            </div>
            {/* Feature 2: View Documents */}
            <div className="col-md-4 scroll-animate" style={{ transitionDelay: "100ms" }}>
              <div className="card h-100 shadow-sm border-0 p-3">
                <div className="card-body text-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-3 mb-3"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <DocumentRegular fontSize={32} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">View Documents</h3>
                  <p className="text-muted">Open and view individual documents directly within the application.</p>
                </div>
              </div>
            </div>
            {/* Feature 3: Secure Access */}
            <div className="col-md-4 scroll-animate" style={{ transitionDelay: "200ms" }}>
              <div className="card h-100 shadow-sm border-0 p-3">
                <div className="card-body text-center">
                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-3 mb-3"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <LockClosedRegular fontSize={32} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-2">Secure Access</h3>
                  <p className="text-muted">
                    Your workspace is private. Authentication is required to access your content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* =========== Final CTA Section =========== */}
      <section className="py-5 bg-light">
        <div className="container py-md-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center scroll-animate">
              <h2 className="display-5 fw-bold text-dark mb-3">Ready to Get Started?</h2>
              <p className="fs-5 text-muted mb-4">Log in or sign up to access your document manager.</p>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <Button appearance="primary" size="large">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* =========== Footer Content =========== */}
      <div className="py-5 bg-white border-top">
        <div className="container text-center">
          <p className="text-muted mb-0">&copy; 2025 FuseDocs. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
};
