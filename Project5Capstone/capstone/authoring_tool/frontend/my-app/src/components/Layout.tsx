import { observer } from "mobx-react-lite";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Image, makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { ArrowLeftFilled, DocumentTextRegular, TextBulletListTreeFilled } from "@fluentui/react-icons";
import { useVM } from "../viewModel/context";
import { useMediaQuery } from "../hooks/useMediaQuery";

/**
 * JSS styles for the Layout component.
 */
const useStyles = makeStyles({
  // Base style for the navbar to enable sticky positioning and transitions.
  navbar: {
    position: "sticky",
    top: "0",
    zIndex: "1020", // Standard z-index for Bootstrap navbars.
    transition: "transform 0.3s ease-in-out",
  },
  // Class applied to hide the navbar when scrolling down.
  navbarHidden: {
    transform: "translateY(-100%)",
  },
  // Flex container for the main navbar items (left, center, right groups).
  navContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  // Flex group for left and right items. `flex: 1` ensures they take up equal space,
  // allowing the center logo to be perfectly centered.
  navGroup: {
    display: "flex",
    alignItems: "center",
    flex: "1",
    minWidth: "0", // Prevents flex items from overflowing.
  },
  // Aligns the right-side navigation group content to the end.
  navGroupEnd: {
    justifyContent: "flex-end",
  },
  // Styles for the centered logo/brand. It does not flex or shrink.
  brand: {
    flex: "0 1 auto",
    margin: "0 auto",
  },
});

export const Layout = observer(() => {
  const vm = useVM();
  const navigate = useNavigate();
  const location = useLocation();
  const styles = useStyles();
  const isMobile = useMediaQuery();

  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if the current route is the document editor page.
  const isDocumentEditorPage = location.pathname.startsWith("/document/");

  /**
   * Effect to control the visibility of the navbar based on scroll direction.
   * Hides on scroll down, shows on scroll up.
   */
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 50) {
          // scrolling down
          setShowNav(false);
        } else {
          // scrolling up
          setShowNav(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => {
        window.removeEventListener("scroll", controlNavbar);
      };
    }
  }, [lastScrollY]);

  const handleLogout = async () => {
    await vm.Logout();
    navigate("/login");
  };

  /**
   * A component containing the navigation links for a logged-in user.
   * This is used to avoid duplicating link structures for desktop and mobile views.
   */
  const UserNavLinks = () => (
    <>
      <Nav.Link as="div">
        Welcome, <strong>{vm.User?.username}</strong>
      </Nav.Link>
      <Nav.Link as={Link} to="/">
        All Posts
      </Nav.Link>
      <Nav.Link as={Link} to="/following">
        Following
      </Nav.Link>
      <Nav.Link onClick={handleLogout}>Log Out</Nav.Link>
    </>
  );

  /**
   * A component containing the navigation links for a guest user.
   */
  const GuestNavLinks = () => (
    <>
      <Nav.Link as={Link} to="/login">
        Log In
      </Nav.Link>
      <Nav.Link as={Link} to="/register">
        Register
      </Nav.Link>
    </>
  );

  return (
    <>
      <Navbar expand={"lg"} className={`${styles.navbar} ${!showNav ? styles.navbarHidden : ""} bg-body-tertiary`}>
        <Container style={isMobile ? { maxWidth: "100%" } : {}}>
          <div className={styles.navContainer}>
            {/* --- Left Navigation Group --- */}
            <div className={styles.navGroup}>
              {isDocumentEditorPage && (
                // Back button, always visible on document editor page.
                <Nav.Link onClick={() => navigate(-1)} className="me-2 p-0">
                  <Tooltip content="Go Back" relationship="label">
                    <Button
                      appearance="outline"
                      size="large"
                      icon={<ArrowLeftFilled />}
                      style={{ padding: "7px 27px", borderRadius: tokens.borderRadiusLarge }}
                    />
                  </Tooltip>
                </Nav.Link>
              )}
              {isDocumentEditorPage && isMobile && (
                // Button to toggle the content tree drawer in mobile view.
                <Nav.Link onClick={() => vm.ToggleMobileView()} className="p-0">
                  <Tooltip content={vm.MobileView === "content" ? "View Tree" : "View Content"} relationship="label">
                    <Button
                      appearance="outline"
                      size="large"
                      icon={
                        vm.MobileView === "content" ? (
                          <TextBulletListTreeFilled fontSize={"1.5rem"} />
                        ) : (
                          <DocumentTextRegular fontSize={"1.5rem"} />
                        )
                      }
                      style={{ padding: "7px 27px", borderRadius: tokens.borderRadiusLarge }}
                    />
                  </Tooltip>
                </Nav.Link>
              )}
            </div>

            {/* --- Centered Logo --- */}
            <Navbar.Brand as={Link} to="/" className={`${styles.brand} py-0`}>
              <Image alt="React Logo" src="/assets/react.svg" height={40} width={40} className="me-3" />
              <b>{"Network"}</b>
            </Navbar.Brand>

            {/* --- Right Navigation Group --- */}
            <div className={`${styles.navGroup} ${styles.navGroupEnd}`}>
              {/* DESKTOP-ONLY NAVIGATION */}
              <Nav className="d-none d-lg-flex align-items-center">
                {vm.User ? <UserNavLinks /> : <GuestNavLinks />}
              </Nav>
              {/* MOBILE-ONLY HAMBURGER TOGGLE */}
              <Navbar.Toggle aria-controls="basic-navbar-nav" className="d-lg-none" />
            </div>
          </div>

          {/* --- Collapsed Menu Content for Mobile --- */}
          <Navbar.Collapse id="basic-navbar-nav">
            {/* This Nav is only visible in the collapsed mobile menu */}
            <Nav className="d-lg-none">{vm.User ? <UserNavLinks /> : <GuestNavLinks />}</Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Outlet />
    </>
  );
});
