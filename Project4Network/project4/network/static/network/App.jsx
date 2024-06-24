function App() {
    return (
        <>
            Hello, React!
            <NewPostForm />
            <AllPosts />
        </>
    );
}

ReactDOM.render(<App />, document.querySelector("#app"));