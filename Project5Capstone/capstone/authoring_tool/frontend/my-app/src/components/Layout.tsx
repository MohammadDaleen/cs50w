import { observer } from "mobx-react-lite";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useVM } from "../viewModel/context";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { useEffect } from "react";
// import { WeatherMoonFilled, WeatherSunnyFilled } from "@fluentui/react-icons";
import { Image } from "@fluentui/react-components";

export const Layout = observer(() => {
  const vm = useVM();
  const navigate = useNavigate();

  // TODO: handle clearing indvisual errors properly
  // const location = useLocation(); // Get current location (i.e., route)
  // useEffect(() => {
  //   // Execute when the user navigates to different route
  //   vm.ClearErrors();
  // }, [location]); // Re-run effect on location change

  const handleLogout = async () => {
    await vm.Logout();
    navigate("/login");
  };

  const handleProfile = () => {
    if (!vm.User?.isAuthenticated) {
      vm.AddError("User is not authenticated");
      return;
    }
    navigate(`/${vm.User.username}`);
  };

  // const handleToggleMode = () => {
  //   vm.ToggleIsDarkMode();
  // };

  return (
    <>
      <Navbar expand={"lg"} className="bg-body-tertiary">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <Image alt="React Logo" src="/assets/react.svg" height={75} width={75} style={{ paddingRight: "1rem" }} />
            <b>{"Network"}</b>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {vm.User ? (
              <>
                <Nav className="me-auto">
                  <Nav.Link onClick={handleProfile}>
                    Welcome, <strong>{vm.User.username}</strong>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/">
                    All Posts
                  </Nav.Link>
                  <Nav.Link as={Link} to="/following">
                    Following
                  </Nav.Link>
                </Nav>
                <Nav className="ms-auto">
                  <Nav.Link onClick={handleLogout}>Log Out</Nav.Link>
                  {/* <Nav.Link onClick={handleToggleMode}>
                    {vm.IsDarkMode ? (
                      <WeatherMoonFilled fontSize={"1.5rem"} />
                    ) : (
                      <WeatherSunnyFilled fontSize={"1.5rem"} />
                    )}
                  </Nav.Link> */}
                </Nav>
              </>
            ) : (
              <>
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/">
                    All Posts
                  </Nav.Link>
                </Nav>
                <Nav className="ms-auto">
                  <Nav.Link as={Link} to="/login">
                    Log In
                  </Nav.Link>
                  <Nav.Link as={Link} to="/register">
                    Register
                  </Nav.Link>
                  {/* <Nav.Link onClick={handleToggleMode}>
                    {vm.IsDarkMode ? (
                      <WeatherMoonFilled fontSize={"1.5rem"} />
                    ) : (
                      <WeatherSunnyFilled fontSize={"1.5rem"} />
                    )}
                  </Nav.Link> */}
                </Nav>
              </>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Outlet />
    </>
  );
});
